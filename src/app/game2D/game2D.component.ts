import { Component, HostListener, OnInit } from '@angular/core';

import * as THREE from 'three';


@Component({
  selector: 'app-game2D',
  templateUrl: './game2D.component.html',
  styleUrls: ['./game2D.component.scss']
})
export class Game2DComponent implements OnInit {

  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private player!: THREE.Mesh;
  private platforms: THREE.Mesh[] = [];
  private isJumping: boolean = false;
  private velocityY: number = 0;
  private gravity: number = 0.02;

  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private speed: number = 0.1;

  constructor() { }

  ngOnInit() {

    this.initThreeJS();
    this.createPlayer();
    this.createPlatforms();
    this.animate();
  }


  private initThreeJS(): void {
    this.scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(-aspect * 10, aspect * 10, 10, -10, 0.1, 1000);
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  private createPlayer(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.player = new THREE.Mesh(geometry, material);
    this.player.position.y = 0.5;
    this.scene.add(this.player);
  }

  private createPlatforms(): void {
    const platformGeometry = new THREE.BoxGeometry(5, 0.5, 1);
    const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 });

    const ground = new THREE.Mesh(platformGeometry, platformMaterial);
    ground.position.set(0, -2, 0);
    this.scene.add(ground);
    this.platforms.push(ground);

    // Add another platform
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(7, -1, 0);
    this.scene.add(platform);
    this.platforms.push(platform);
  }

  private onWindowResize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = -aspect * 10;
    this.camera.right = aspect * 10;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    this.handleMovement();
    this.handleJumping();
    this.checkCollisions();

    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        break;
      case 'Space':
        if (!this.isJumping) {
          this.isJumping = true;
          this.velocityY = 0.5;
        }
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        break;
    }
  }

  private handleMovement(): void {
    if (this.moveLeft) {
      this.player.position.x -= this.speed;
    }
    if (this.moveRight) {
      this.player.position.x += this.speed;
    }
  }

  private handleJumping(): void {
    if (this.isJumping) {
      this.velocityY -= this.gravity;
      this.player.position.y += this.velocityY;
    }

    if (this.player.position.y <= 0.5) {
      this.player.position.y = 0.5;
      this.isJumping = false;
      this.velocityY = 0;
    }
  }

  private checkCollisions(): void {
    this.platforms.forEach(platform => {
      const playerBox = new THREE.Box3().setFromObject(this.player);
      const platformBox = new THREE.Box3().setFromObject(platform);

      if (playerBox.intersectsBox(platformBox) && this.velocityY <= 0) {
        this.isJumping = false;
        this.player.position.y = platform.position.y + 0.5;
        this.velocityY = 0;
      }
    });
  }

}
