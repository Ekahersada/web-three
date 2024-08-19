import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

import { HostListener } from '@angular/core';
import nipplejs from 'nipplejs';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  @ViewChild('joystickContainer', { static: true }) joystickContainer!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private player!: THREE.Mesh;
  private walls: THREE.Mesh[] = [];

  private joystick: any;



  // Pergerakan pemain
private moveDistance = 0.1;
private keysPressed: { [key: string]: boolean } = {};

  constructor() { }

  ngOnInit() {
    console.log('Game');
    this.initJoystick();
    this.initThreeJS();
    this.animate();
  }

  private initThreeJS(): void {
    const canvas = this.canvasRef.nativeElement;

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Initialize scene
    this.scene = new THREE.Scene();

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 10);

    const grid = new THREE.GridHelper(100,100,0x0a0a0a, 0x000000);
    grid.position.set(0,0.01,0);
    this.scene.add(grid);
   
    // Add ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);


    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x8c8c8c });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Add player (simple cube)
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.player = new THREE.Mesh(playerGeometry, playerMaterial);
    this.player.position.set(0, 1, 2);
    this.scene.add(this.player);

     // Initialize OrbitControls
     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
     this.controls.enableDamping = true;
     this.controls.dampingFactor = 0.1;
     this.controls.enablePan = false; // Nonaktifkan panning
     this.controls.enableRotate = false; // Nonaktifkan rotasi
     this.controls.target = this.player?.position; // Tetapkan target ke pemain


      // Tambahkan dinding (misalnya, kotak dengan ukuran tertentu)
  const wallGeometry = new THREE.BoxGeometry(10, 2, 0.5); // Lebar 10, tinggi 2, tebal 0.5
  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
  // Dinding 1
  const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall1.position.set(5, 1, 0); // Posisi X=5, Y=1 (ketinggian), Z=0
  this.scene.add(wall1);
  this.walls.push(wall1);

  // Dinding 2
  const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall2.position.set(-5, 1, -10); // Posisi X=-5, Y=1 (ketinggian), Z=-10
  this.scene.add(wall2);
  this.walls.push(wall2);

    // Add a basic directional light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    this.scene.add(light);
  }
 
  private animate = () => {
    requestAnimationFrame(this.animate);
  
    // Update player position based on input
    // this.movePlayer();
  
    // Update camera position to follow the player
    this.updateCameraPosition();
  
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  };


  private updateCameraPosition(): void {
    // Set camera position relative to player
    this.camera.position.set(
      this.player.position.x,
      this.player.position.y + 5,
      this.player.position.z + 10
    );
  
    // Ensure the camera is always looking at the player
    this.camera.lookAt(this.player.position);
  }

  
  //----------------CONTROLS-----------------------//


  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.keysPressed[event.key] = true;
    // this.movePlayer();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this.keysPressed[event.key] = false;
  }

  // private movePlayer(x?:any,y?:any): void {
  //   let moveX = x ? x * this.moveDistance : 0;
  //   let moveZ = y ? y * this.moveDistance : 0;
  
  //   if (this.keysPressed['ArrowUp'] || this.keysPressed['w']) {
  //     moveZ -= this.moveDistance;
  //   }
  //   if (this.keysPressed['ArrowDown'] || this.keysPressed['s']) {
  //     moveZ += this.moveDistance;
  //   }
  //   if (this.keysPressed['ArrowLeft'] || this.keysPressed['a']) {
  //     moveX -= this.moveDistance;
  //   }
  //   if (this.keysPressed['ArrowRight'] || this.keysPressed['d']) {
  //     moveX += this.moveDistance;
  //   }
  
  //   // Update player position
  //   this.player.position.x += moveX;

  //   if(y){
  //     this.player.position.z -= moveZ;
  //   } else {
  //     this.player.position.z += moveZ;

  //   }
  
  //   // console.log(`Player Position: X=${this.player.position.x}, Z=${this.player.position.z}`);

  //    // Cek apakah pemain akan menabrak dinding
  //     const newPlayerPosition = this.player.position.clone();
  //     newPlayerPosition.x += moveX;
  //     newPlayerPosition.z += moveZ;

  //     const playerBoundingBox = new THREE.Box3().setFromObject(this.player);
  //     playerBoundingBox.translate(new THREE.Vector3(moveX, 0, moveZ));

  //     let collision = false;
  //     for (const wall of this.walls) {
  //       const wallBoundingBox = new THREE.Box3().setFromObject(wall);
  //       if (playerBoundingBox.intersectsBox(wallBoundingBox)) {
  //         collision = true;
  //         break;
  //       }
  //     }

  //     if (!collision) {
  //       // Hanya update posisi pemain jika tidak ada tabrakan
  //       this.player.position.x += moveX;

  //   if(y){
  //     this.player.position.z -= moveZ;
  //   } else {
  //     this.player.position.z += moveZ;

  //   }
  //     }
  // }

  private movePlayer(x: number, y: number): void {
    const moveX = x * this.moveDistance;
    const moveZ = y * this.moveDistance;

    // Update player position
    this.player.position.x += moveX;
    this.player.position.z -= moveZ; // Z-axis is inverted in this setup
  }

  private initJoystick(): void {
    const options = {
      zone: this.joystickContainer.nativeElement,
      color: 'blue',
      size: 100,
      position: { left: '50%', top: '50%' },
      lockX: false,
      lockY: false,
    };

    this.joystick = nipplejs.create(options);

    this.joystick.on('move', (event: any, data: any) => {
      const x = data.vector.x;
      const y = data.vector.y;

      console.log(x,y);
      this.movePlayer(x, y);
    });
  }


}
