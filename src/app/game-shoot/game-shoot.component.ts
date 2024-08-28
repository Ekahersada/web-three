import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import * as io from 'socket.io-client';
import { OrbitControls, GLTFLoader, PointerLockControls  } from 'three/examples/jsm/Addons.js'

@Component({
  selector: 'app-game-shoot',
  templateUrl: './game-shoot.component.html',
  styleUrls: ['./game-shoot.component.css']
})
export class GameShootComponent implements OnInit {

  @ViewChild('rendererContainer2', { static: true }) rendererContainer!: ElementRef;



  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private orbit!: OrbitControls;

  controls!: any;

  tommyGun:any;
  abandonedBuilding:any;
  bulletHoles:any[]=[];
  isFiring = false;
  bulletCount = 0;

  raycaster = new THREE.Raycaster();
           
  mouse = new THREE.Vector2();  //Create mouse instance
 
  bullets:any[] = [];  //Create array to store bullets

  // Variables for tracking time and adding bullet hole meshes
  lastMeshAdditionTime = 0;
  meshAdditionInterval = 100; // Interval duration in milliseconds


   // Gravity effect variables
   gravity = new THREE.Vector3(0, -0.01, 0); // Adjust the gravity strength as needed
   maxGravityDistance = 2; // Adjust the maximum distance affected by gravity as needed


    // Keyboard controls
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;

    tommyGunLight:any;



  constructor() { }

  ngOnInit() {

    this.initScene();
    this.animate();
    
  }

  initScene(){

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);


    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);


    // Create a grid
    var gridHelper = new THREE.GridHelper(20, 20);
    this.scene.add(gridHelper);


    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1, 0);// Set camera position 0.1 units above the grid

    // Adjust the camera's near clipping plane value
    this.camera.near = .015; // Set a smaller value, like 0.1
    this.camera.updateProjectionMatrix();


    ///flashing light // Create a point light
    const tommyGunLight = new THREE.PointLight(0xffffff, 100, 100); // Adjust the light color and intensity as needed
    tommyGunLight.position.set(0, 0, 0); // Set the light position
    tommyGunLight.visible = false
    this.tommyGunLight = tommyGunLight;
    // Add the light to the scene initially
    this.scene.add(tommyGunLight);


   this.pointerLock();

   

    this.loadModel();

    // Controller
    document.addEventListener('keydown',(event) => {
      this.onKeyDown(event);
    });
    document.addEventListener('keyup', (event)=>{
      this.onKeyUp(event);
    });

    this.onMouserListener();



  }

  pointerLock(){
 // Add PointerLockControls
 this.renderer.domElement.addEventListener('click', () => {
  this.controls.lock()
 });

  this.controls =  new PointerLockControls(this.camera, document.body);

    this.controls.addEventListener('lock', function () {
        // instructions.style.display = 'none';
        // blocker.style.display = 'none';
        // document.getElementById('crosshair').style.display = 'block'; // Show the crosshair when screen is locked
    });

    this.controls.addEventListener('unlock', function () {
        // blocker.style.display = 'block';
        // instructions.style.display = '';
        // document.getElementById('crosshair').style.display = 'none'; // Hide the crosshair when screen is unlocked
    });

    this.scene.add(this.controls.getObject());

  }

  onKeyDown(event:any){
    switch (event.keyCode) {
        case 38: // up arrow
        case 87: // W key
            this.moveForward = true;
            break;
        case 37: // left arrow
        case 65: // A key
            this.moveLeft = true;
            break;
        case 40: // down arrow
        case 83: // S key
            this.moveBackward = true;
            break;
        case 39: // right arrow
        case 68: // D key
            this.moveRight = true;
            break;
    }
  }

  onKeyUp(event:any){
    switch (event.keyCode) {
      case 38: // up arrow
      case 87: // W key
          this.moveForward = false;
          break;
      case 37: // left arrow
      case 65: // A key
          this.moveLeft = false;
          break;
      case 40: // down arrow
      case 83: // S key
          this.moveBackward = false;
          break;
      case 39: // right arrow
      case 68: // D key
          this.moveRight = false;
          break;
  }
  }

  onMouserListener(){
     // Add event listeners for the mouse down and mouse up events
     window.addEventListener('mousedown', (event)=>{
       // Check if the left mouse button is pressed (button code 0)
       if (this.controls.isLocked && event.button === 0) {
          // Set isFiring to true
          this.isFiring = true;
      }
     }, false);

     
     window.addEventListener('mouseup', (event)=>{
      if (event.button === 0) {
            // Set isFiring to false
            this.isFiring = false;
        }
     });

  }



  loadModel(){
    // Load GLTF model

    
    new GLTFLoader().load('./assets/models/Gun.glb', (gltf) => {
      gltf.scene.scale.set(0.25, 0.25, 0.25)
      gltf.scene.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z - 2);
      const model = gltf.scene;
      this.tommyGun = gltf.scene;
      this.scene.add(model);

       // Add a point light to the gun
       var tommyGunLight = new THREE.PointLight(0xffffff, 1);
       tommyGunLight.position.set(.025, -.15, 0); // Adjust the position of the light relative to the gun
       model.add(tommyGunLight);

    })


  }

  animate(){
    requestAnimationFrame(() => this.animate());

    this.moveControl();
      // Update bullets
      this.updateBullets();

      if (this.tommyGun) {

        // Match tommy gun to player camera position
        this.tommyGun.position.copy(this.camera.position);
        this.tommyGun.rotation.copy(this.camera.rotation);
        this.tommyGun.updateMatrix();
        this.tommyGun.translateZ(-.05);
        this.tommyGun.translateY(-.05);
        this.tommyGun.translateX(-.025);
        this.tommyGun.rotateY(Math.PI / 2); // Rotate the model by 180 degrees

    }

    this.onFire();

    this.renderer.render(this.scene, this.camera);
  }

  onFire(){
      if (this.isFiring) {

        const currentTime = performance.now();

        // Check if the specified interval has passed since the last mesh addition
        if (currentTime - this.lastMeshAdditionTime >= this.meshAdditionInterval) {

            this.lastMeshAdditionTime = currentTime; // Update the last mesh addition time
            // Get the direction of the ray at the time of creation
            const direction = this.raycaster.ray.direction.clone();

            // Search for the "barrel_low" mesh within the "tommyGun" object
            //use it as bullet particle start point
            let finLowObject = null;
            this.tommyGun.traverse(function (object:any) {
                if (object.name === 'barrel_low') {
                    console.log(object.name);
                    finLowObject = object;
                }
            });

            const worldPosition = new THREE.Vector3();
            finLowObject!.getWorldPosition(worldPosition);

            this.createBullet(worldPosition, direction);
            this.updateGunMuzzleFlash(worldPosition);

        }

        //check bullet collision
        // this.checkBulletCollision();


    }
  }

  checkBulletCollision() {
    this.bullets.forEach((bullet:any)=>{
        var bulletPosition = bullet.position;
        var bulletDirection = bullet.direction; // Assuming each bullet has a direction property

        // Create a raycaster for the current bullet
        var raycaster = new THREE.Raycaster(bulletPosition, bulletDirection);

        // Find intersections between the ray and the abandonedBuilding object
        let abadon = this.abandonedBuilding;
        var intersects = raycaster.intersectObject(abadon, true);

        if (intersects.length > 0) {

            // Play the bullet ricochet sound every 5 bullets
            if (this.bulletCount % 15 === 0) {
                // playBulletRicochetSound();
            }
            this.bulletCount++;

            var intersect = intersects[0];
            var point = intersect.point;
            var faceNormal = intersect.face!.normal;

            // Create and position the mesh at the intersection point
            var offset = new THREE.Vector3(0, 0, 0.01); // Increase the offset value to avoid z-fighting
            var insertionOffset = new THREE.Vector3(0, 0.01, 0); // Adjust the insertion offset as needed

            var loader = new THREE.TextureLoader();
            var material = new THREE.MeshBasicMaterial({
                map: loader.load('https://www.shanebrumback.com/images/bullet-hole.png'),
                side: THREE.DoubleSide,
                transparent: true,
                depthWrite: true,
            });

            var geometry = new THREE.PlaneGeometry(0.08, 0.08);
            var bulletHoleMesh = new THREE.Mesh(geometry, material);

            var insertionPoint = new THREE.Vector3().copy(point).add(offset).add(insertionOffset);

            bulletHoleMesh.position.copy(insertionPoint);
            this.scene.add(bulletHoleMesh);
            this.bulletHoles.push(bulletHoleMesh);


            // Fade out the mesh gradually over time
            var opacity = 1.0;
            var fadeOutDuration = 5000; // 5 seconds
            var fadeOutInterval = 50; // Update every 50 milliseconds

            var fadeOutTimer = setInterval(()=>{
                opacity -= fadeOutInterval / fadeOutDuration;
                if (opacity <= 0) {
                    opacity = 0;
                    clearInterval(fadeOutTimer);
                    this.scene.remove(bulletHoleMesh);
                    this.bulletHoles.splice(this.bulletHoles.indexOf(bulletHoleMesh), 1);
                }
                bulletHoleMesh.material.opacity = opacity;
            }, fadeOutInterval);
        }
    });
}


  // Call the function whenever the value of isFiring changes
   updateGunMuzzleFlash(position:any) {
    this.toggleLight(this.isFiring);
    this.tommyGunLight.position.copy(this.camera.position)
}

toggleLight(isFiring:any) {
  if (isFiring) {
      this.tommyGunLight.visible = !this.tommyGunLight.visible; // Toggle the light visibility
  } else {
      this.tommyGunLight.visible = false; // Ensure the light is off when not firing
  }
}


  // Function to create a bullets
  createBullet(position:any, direction:any) {

    //play machine gun sound bite
    // playMachineGunSound();

    console.log('fireeeeee............')

    const bulletGeometry = new THREE.SphereGeometry(0.01, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.5
    });
    const bullet:any = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.copy(position);
    bullet.direction = direction.clone().normalize();
    bullet.distanceTraveled = 0;

    // Add a point light to the bullet
    const pointLight = new THREE.PointLight(0xFFFFFF, 10, 100);
    pointLight.position.copy(position);
    bullet.add(pointLight);

    this.scene.add(bullet);
    this.bullets.push(bullet);
}



// Function to update bullets
updateBullets() {
    const maxDistance = 5; // Maximum distance a bullet can travel before removal

    for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet:any = this.bullets[i];
        bullet?.position.addScaledVector(bullet?.direction, .75); // Adjust the speed of the bullet here
        bullet.distanceTraveled! += 0.4;

        if (bullet?.distanceTraveled >= maxDistance) {
            this.scene.remove(bullet);
            this.bullets.splice(i, 1);
        }
    }
}

moveControl(){
   //ramp up player movement speed and direction
   if (this.controls.isLocked) {
    var acceleration = 0.003; // Speed increment per frame
    var maxSpeed = 0.10; // Maximum speed

    if (this.moveForward) {
        this.controls.speed = Math.min(this.controls.speed + acceleration, maxSpeed);
        this.controls.moveForward(this.controls.speed);
        if (this.checkCollision(this.controls.getObject().position)) {
            this.controls.moveForward(-this.controls.speed); // Move back to the previous position
        }
    } else if (this.moveBackward) {
        this.controls.speed = Math.min(this.controls.speed + acceleration, maxSpeed);
        this.controls.moveForward(-this.controls.speed);
        if (this.checkCollision(this.controls.getObject().position)) {
            this.controls.moveForward(this.controls.speed); // Move back to the previous position
        }
    } else if (this.moveLeft) {
        this.controls.speed = Math.min(this.controls.speed + acceleration, maxSpeed);
        this.controls.moveRight(-this.controls.speed);
        if (this.checkCollision(this.controls.getObject().position)) {
            this.controls.moveRight(this.controls.speed); // Move back to the previous position
        }
    } else if (this.moveRight) {
        this.controls.speed = Math.min(this.controls.speed + acceleration, maxSpeed);
        this.controls.moveRight(this.controls.speed);
        if (this.checkCollision(this.controls.getObject().position)) {
            this.controls.moveRight(-this.controls.speed); // Move back to the previous position
        }
    } else {
        this.controls.speed = 0; // Reset speed when no movement controls are active
    }
}
}


  checkCollision(position:any) {
    var gridSize = 20;
    var halfGridSize = gridSize / 2;
    var margin = 0.1;

    if (
        position.x < -halfGridSize + margin ||
        position.x > halfGridSize - margin ||
        position.z < -halfGridSize + margin ||
        position.z > halfGridSize - margin
    ) {
        return true; // Collision detected
    }

    return false; // No collision
  }

}
