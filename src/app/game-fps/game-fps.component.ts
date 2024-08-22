import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
// import { io } from 'socket.io-client';
import * as io from 'socket.io-client';


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
  
  player: any = {
    speed: 0.1,
    turnSpeed: 0.02,
    velocity: new THREE.Vector3(),
    canJump: false
  };

  controls: any = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  bullets: THREE.Mesh[] = [];


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

    // Setup camera
    this.camera.position.y = 1.8; // Player height
    this.camera.position.z = 5;

    // Setup lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    this.scene.add(light);

    // Setup ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Request pointer lock when clicking the renderer container
    this.rendererContainer.nativeElement.addEventListener('click', () => {
      this.rendererContainer.nativeElement.requestPointerLock();
    });

     // Listen for clicks to shoot even after pointer lock
     document.addEventListener('click', () => this.shoot());
  }

  initEventListeners() {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));

    // Mouse movement listener
    document.addEventListener('mousemove', (event) => this.onMouseMove(event));
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
    if (document.pointerLockElement === this.rendererContainer.nativeElement) {
      // Horizontal rotation (left and right)
      this.camera.rotation.y -= event.movementX * 0.002;
      
      // Vertical rotation (up and down)
      this.camera.rotation.x -= event.movementY * 0.002;
      
      // Clamp the vertical rotation to prevent flipping
      this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
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
