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
  private speed: number = 0.2;

  private scrollSpeed: number = 0.05;
  isFalling: boolean = true;

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
    this.player.position.set(-8, 0.5, 0);
    this.scene.add(this.player);
  }

  private createPlatforms(): void {
    const platformGeometry = new THREE.BoxGeometry(5, 0.5, 1);
    const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 });
    const color2 = new THREE.Color( 0xff0000 );
    const platformMaterial2 = new THREE.MeshBasicMaterial({ color: color2 });
    

    const ground = new THREE.Mesh(platformGeometry, platformMaterial);
    ground.position.set(0, -2, 0);
    this.scene.add(ground);
    this.platforms.push(ground);

    const platform1 = new THREE.Mesh(platformGeometry, platformMaterial2);
    platform1.position.set(5, 0, 0);
    // platform1.userData = { velocityY: 0, isFalling: true }; // Adding gravity properties
    this.scene.add(platform1);
    this.platforms.push(platform1);

    const platform2 = new THREE.Mesh(platformGeometry, platformMaterial2);
    platform2.position.set(10, 2, 0);
    this.scene.add(platform2);
    this.platforms.push(platform2);

    const platform3 = new THREE.Mesh(platformGeometry, platformMaterial2);
    platform3.position.set(20, 2, 0);
    this.scene.add(platform3);
    this.platforms.push(platform3);
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
    // this.applyGravityToBlocks(); // Apply gravity to blocks
    this.scrollBackground();


        // Trigger falling if player steps off a platform
        if (!this.isJumping && !this.isFalling && !this.isOnPlatform()) {
          this.isFalling = true;
        }

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

      case 'Digit1':
      this.loadLevel(1);
      break;
    case 'Digit2':
      this.loadLevel(2);
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
    if (this.isJumping || this.isFalling) {
      this.velocityY -= this.gravity;
      this.player.position.y += this.velocityY;
  
      this.platforms.forEach(platform => {
        const playerBox = new THREE.Box3().setFromObject(this.player);
        const platformBox = new THREE.Box3().setFromObject(platform);
  
        if (playerBox.intersectsBox(platformBox) && this.velocityY <= 0) {
          this.isJumping = false;
          this.isFalling = false;
          this.player.position.y = platform.position.y + 0.5; // Adjust player's position to be on top of the platform
          this.velocityY = 0;
        }
      });
  
      // Stop falling when hitting the ground
      if (this.player.position.y <= 0.5) {
        this.player.position.y = 0.5;
        this.isJumping = false;
        this.isFalling = false;
        this.velocityY = 0;
      }
    }
  

  }
  

  private isOnPlatform(): boolean {
    return this.platforms.some(platform => {
      const playerBox = new THREE.Box3().setFromObject(this.player);
      const platformBox = new THREE.Box3().setFromObject(platform);
  
      return playerBox.intersectsBox(platformBox);
    });
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

  private applyGravityToBlocks(): void {
    this.platforms.forEach((platform:any) => {
      if (platform.userData.isFalling) {
        platform.userData.velocityY -= this.gravity;
        platform.position.y += platform.userData.velocityY;
  
        this.platforms.forEach(otherPlatform => {
          if (otherPlatform !== platform) {
            const platformBox = new THREE.Box3().setFromObject(platform);
            const otherPlatformBox = new THREE.Box3().setFromObject(otherPlatform);
  
            if (platformBox.intersectsBox(otherPlatformBox) && platform.userData.velocityY <= 0) {
              platform.position.y = otherPlatform.position.y + 0.5; // Place on top of the other platform
              platform.userData.velocityY = 0;
              platform.userData.isFalling = false;
            }
          }
        });
  
        // Stop falling when hitting the ground
        if (platform.position.y <= -2.25) {
          platform.position.y = -2.25;
          platform.userData.velocityY = 0;
          platform.userData.isFalling = false;
        }
      }
    });
  }

  private scrollBackground(): void {
    if (this.moveRight && this.player.position.x > 2) {
      this.player.position.x = 2; // Player stops moving right
      this.camera.position.x += this.scrollSpeed; // Background scrolls left
      this.platforms.forEach(platform => platform.position.x -= this.scrollSpeed);
    }

    if (this.moveLeft && this.player.position.x < -2) {
      this.player.position.x = -2; // Player stops moving left
      this.camera.position.x -= this.scrollSpeed; // Background scrolls right
      this.platforms.forEach(platform => platform.position.x += this.scrollSpeed);
    }
  }


  private loadLevel(level: number): void {
    // Clear current platforms
    this.platforms.forEach(platform => this.scene.remove(platform));
    this.platforms = [];
  
    if (level === 1) {
      // Level 1 platforms
      const ground = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 1), new THREE.MeshBasicMaterial({ color: 0x654321 }));
      ground.position.set(0, -2, 0);
      this.scene.add(ground);
      this.platforms.push(ground);
  
      const platform = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 1), new THREE.MeshBasicMaterial({ color: 0x654321 }));
      platform.position.set(7, -1, 0);
      this.scene.add(platform);
      this.platforms.push(platform);
    } else if (level === 2) {
      // Level 2 platforms
      const ground = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 1), new THREE.MeshBasicMaterial({ color: 0x654321 }));
      ground.position.set(-4, -3, 0);
      this.scene.add(ground);
      this.platforms.push(ground);
  
      const platform1 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 1), new THREE.MeshBasicMaterial({ color: 0x654321 }));
      platform1.position.set(10, -2, 0);
      this.scene.add(platform1);
      this.platforms.push(platform1);
  
      const platform2 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1), new THREE.MeshBasicMaterial({ color: 0x654321 }));
      platform2.position.set(5, 0, 0);
      this.scene.add(platform2);
      this.platforms.push(platform2);
    }
    // Add more levels as needed
  }

}
