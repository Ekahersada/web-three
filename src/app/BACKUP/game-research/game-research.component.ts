import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import {
  OrbitControls,
  FBXLoader,
  GLTFLoader,
  Octree,
  OctreeHelper,
  OBJLoader,
  Capsule,
  PointerLockControls,
} from 'three/examples/jsm/Addons.js';
import { GUI } from 'dat.gui';

@Component({
  selector: 'app-game-research',
  templateUrl: './game-research.component.html',
  styleUrls: ['./game-research.component.css'],
})
export class GameResearchComponent implements OnInit {
  @ViewChild('rendererContainer2', { static: true })
  rendererContainer!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  axesHelper: any;

  playerCollider: any;

  private controls!: OrbitControls;

  constructor() {}

  ngOnInit() {
    this.initScene();
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  initScene() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);

    // Tambahkan AxesHelper
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);

    // Create a grid
    var gridHelper = new THREE.GridHelper(40, 40);
    this.scene.add(gridHelper);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // this.camera.position.set(0, 1, 0); // Set camera position 0.1 units above the grid
    this.camera.position.set(24, 18, 0);

    // Initialize OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 20;
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

    // Adjust the camera's near clipping plane value
    // this.camera.near = 0.015; // Set a smaller value, like 0.1
    // this.camera.updateProjectionMatrix();

    this.setup();
  }

  setup() {
    this.generateFloor();
  }

  setuPlayer() {
    this.playerCollider = new Capsule(
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0, 1, 0),
      0.35
    );
  }

  generateFloor() {
    // Create a floor
    var floorGeometry = new THREE.PlaneGeometry(40, 40);
    var floorMaterial = new THREE.MeshBasicMaterial({ color: 0x303030 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -0.5 * Math.PI; // Rotate the floor 90 degrees
    floor.position.y = -0.01; // Set the floor position
    this.scene.add(floor);
  }
}
