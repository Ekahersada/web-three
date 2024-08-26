import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import * as io from 'socket.io-client';
import { OrbitControls, GLTFLoader, PointerLockControls  } from 'three/examples/jsm/Addons.js';



@Component({
  selector: 'app-game-fps',
  templateUrl: './game-fps.component.html',
  styleUrls: ['./game-fps.component.css']
})
export class GameFpsComponent implements OnInit {

  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;
  // @ViewChild('canvas2', { static: true }) canvasRef!: ElementRef;


  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();

  socket: any;

  players: { [key: string]: THREE.Mesh } = {};

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private touch: THREE.Vector2 = new THREE.Vector2();
  private crosshairPosition: THREE.Vector3 = new THREE.Vector3();
  
  player: any = {
    speed: 0.1,
    turnSpeed: 0.02,
    velocity: new THREE.Vector3(),
    canJump: false,
    position:{ x: 0, y: 0, z: 5 },
  };

  private Mainplayer!: THREE.Mesh;

  controls: any = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  private controls2!: PointerLockControls;

  private orbit!: OrbitControls;

  bullets: THREE.Mesh[] = [];

    // Variabel untuk menyimpan posisi sentuhan sebelumnya
    private previousTouchX: number = 0;
    private previousTouchY: number = 0;
  
    // Sensitivitas gerakan kamera
    private sensitivity: number = 0.002;


  constructor() { }

  ngOnInit() {

    this.initScene();
    this.initSocket();
    this.animate();
    this.initEventListeners();
  }

  initSocket() {
    this.socket = io.connect('localhost:3000');

    // Handle current players
    this.socket.on('currentPlayers', (players: any) => {
      Object.keys(players).forEach((id) => {
        if (id !== this.socket.id) {
          this.addPlayer(id, players[id]);
        }
      });
    });

    // Handle new player
    this.socket.on('newPlayer', (data: any) => {
      this.addPlayer(data.id, data.player);
    });

    // Handle player movement
    this.socket.on('playerMoved', (data: any) => {
      if (this.players[data.id]) {
        this.players[data.id].position.set(
          data.player.position.x,
          data.player.position.y,
          data.player.position.z
        );
        this.players[data.id].rotation.set(
          data.player.rotation.x,
          data.player.rotation.y,
          data.player.rotation.z
        );
      }
    });

    // Handle player disconnect
    this.socket.on('playerDisconnected', (id: string) => {
      if (this.players[id]) {
        this.scene.remove(this.players[id]);
        delete this.players[id];
      }
    });
  }

  addPlayer(id: string, playerData: any) {
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);

    player.position.set(
      playerData.position.x,
      playerData.position.y,
      playerData.position.z
    );
    player.rotation.set(
      playerData.rotation.x,
      playerData.rotation.y,
      playerData.rotation.z
    );

    this.players[id] = player;
    this.scene.add(player);
  }

  updatePlayerMovement() {
    const position = this.camera.position;
    const rotation = this.camera.rotation;

    this.socket.emit('movePlayer', {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
    });
  }

  initScene() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);

     //Add LIGHT
     this.scene.add(new THREE.AmbientLight(0xffffff, 0.7))
     const dirLight = new THREE.DirectionalLight(0xffffff, 1)
     dirLight.position.set(- 60, 100, - 10);
     dirLight.castShadow = true;
     dirLight.shadow.camera.top = 50;
     dirLight.shadow.camera.bottom = - 50;
     dirLight.shadow.camera.left = - 50;
     dirLight.shadow.camera.right = 50;
     dirLight.shadow.camera.near = 0.1;
     dirLight.shadow.camera.far = 200;
     dirLight.shadow.mapSize.width = 4096;
     dirLight.shadow.mapSize.height = 4096;
     this.scene.add(dirLight);


    // Setup camera
    this.camera.position.y = 1.8; // Player height
    this.camera.position.z = 5;


     // Tambahkan pemain (kotak)
     const geometry = new THREE.BoxGeometry(1, 1, 1);
     const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
     this.Mainplayer = new THREE.Mesh(geometry, material);
     this.scene.add(this.Mainplayer);

     this.controls2 = new PointerLockControls(this.camera, this.renderer.domElement);
     this.scene.add(this.controls2.getObject());
 
     // Event listener untuk mengunci pointer
     this.renderer.domElement.addEventListener('click', () => {
      this.controls2.lock()
     });


        // Tambahkan OrbitControls
        // this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
        // this.orbit.enableDamping = true; // Smooth damping (inertia)
        // this.orbit.dampingFactor = 0.05;
        // this.orbit.screenSpacePanning = false; // Allow panning in screen space
        // this.orbit.minDistance = 2; // Minimum zoom distance
        // this.orbit.maxDistance = 10; // Maximum zoom distance
        // this.orbit.maxPolarAngle = Math.PI / 2; // Batasi sudut pandang vertikal

        // // Atur target kamera ke pemain
        // this.orbit.target.set(this.Mainplayer.position.x, this.Mainplayer.position.y, this.Mainplayer.position.z);

    // Setup lighting

    // Setup ground
    this.generateFloor();


    // Request pointer lock when clicking the renderer container

     // Listen for clicks to shoot even after pointer lock
  }


  generateFloor(){
    // TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const placeholder = textureLoader.load("./assets/textures/placeholder/placeholder.png");
    const sandBaseColor = textureLoader.load("./assets/textures/sand/Sand 002_COLOR.jpg");
    const sandNormalMap = textureLoader.load("./assets/textures/sand/Sand 002_NRM.jpg");
    const sandHeightMap = textureLoader.load("./assets/textures/sand/Sand 002_DISP.jpg");
    const sandAmbientOcclusion = textureLoader.load("./assets/textures/sand/Sand 002_OCC.jpg");

    const WIDTH = 80
    const LENGTH = 80

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    const material = new THREE.MeshStandardMaterial(
        {
            map: sandBaseColor, normalMap: sandNormalMap,
            displacementMap: sandHeightMap, displacementScale: 0.1,
            aoMap: sandAmbientOcclusion
        })
    this.wrapAndRepeatTexture(material.map!)
    this.wrapAndRepeatTexture(material.normalMap!)
    this.wrapAndRepeatTexture(material.displacementMap!)
    this.wrapAndRepeatTexture(material.aoMap!)
    // const material = new THREE.MeshPhongMaterial({ map: placeholder})

    const floor = new THREE.Mesh(geometry, material)
    floor.receiveShadow = true
    floor.rotation.x = - Math.PI / 2
    this.scene.add(floor)
 }

 wrapAndRepeatTexture(map: THREE.Texture){
   map.wrapS = map.wrapT = THREE.RepeatWrapping
   map.repeat.x = map.repeat.y = 10;

   return map;
 }


  initEventListeners() {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));

    // Mouse movement listener
    // document.addEventListener('mousemove', (event) => this.onMouseMove(event));
    document.addEventListener('touchmove', (event) => this.onToucheMove(event));
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.controls.forward = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.controls.backward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.controls.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.controls.right = true;
        break;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.controls.forward = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.controls.backward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.controls.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.controls.right = false;
        break;
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.controls.isLocked) {
      // Tangani pergerakan mouse di sini
      // Misalnya, kita bisa mendapatkan delta pergerakan mouse
      const movementX = event.movementX  || 0;
      const movementY = event.movementY  || 0;

      // Update rotasi kamera berdasarkan pergerakan mouse
      let y = this.controls.getObject().rotation.y -= movementX * 0.002;
      let x = this.controls.getObject().rotation.x -= movementY * 0.002;


      this.camera.rotation.y = y;
      this.camera.rotation.x = x; 




    }
  }

  shoot() {
    const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    bullet.position.set(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );

    bullet.quaternion.copy(this.camera.quaternion);
    this.bullets.push(bullet);
    this.scene.add(bullet);
  }

  // updateHUD() {
  //   const healthElement = document.getElementById('health');
  //   const ammoElement = document.getElementById('ammo');
  
  //   if (healthElement) healthElement.innerText = String(this.playerHealth);
  //   if (ammoElement) ammoElement.innerText = String(this.playerAmmo);
  // }


  onToucheMove(event:TouchEvent){
    if (event.touches.length > 0) {
      const touch = event.touches[0];

      // Hitung delta (perubahan) posisi sentuhan
      const deltaX = touch.clientX - this.previousTouchX;
      const deltaY = touch.clientY - this.previousTouchY;

      // Update rotasi kamera berdasarkan delta
      this.camera.rotation.y -= deltaX * this.sensitivity; // Rotasi horizontal (yaw)
      this.camera.rotation.x -= deltaY * this.sensitivity; // Rotasi vertikal (pitch)

      // Simpan posisi sentuhan saat ini untuk digunakan sebagai referensi berikutnya
      this.previousTouchX = touch.clientX;
      this.previousTouchY = touch.clientY;
    }
  }

  updateCrosshair() {
    // Sesuaikan posisi crosshair di layar
    const vector = this.crosshairPosition.clone().project(this.camera);

    const crosshairElement = document.getElementById('crosshair');
    if (crosshairElement) {
      crosshairElement.style.left = ((vector.x + 1) / 2 * window.innerWidth) + 'px';
      crosshairElement.style.top = (-(vector.y - 1) / 2 * window.innerHeight) + 'px';
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update player movement
    if (this.controls.forward) {
      this.camera.translateZ(-this.player.speed);
    }
    if (this.controls.backward) {
      this.camera.translateZ(this.player.speed);
    }
    if (this.controls.left) {
      this.camera.translateX(-this.player.speed);
    }
    if (this.controls.right) {
      this.camera.translateX(this.player.speed);
    }


    if (this.controls2.isLocked) {
      // Kirim posisi pemain ke server

      console.log('Locked');
      const playerPosition = this.controls2.getObject().position;
      // this.socket.emit('move', { x: playerPosition.x, y: playerPosition.y, z: playerPosition.z });
    }


     // Update controls pada setiap frame
    //  this.orbit.update();


    // Update bullets
    this.bullets.forEach(bullet => {
      bullet.translateZ(-0.2);
    });

    this.updatePlayerMovement();

     // Update HUD
  // this.updateHUD();

    this.renderer.render(this.scene, this.camera);
  }

}
