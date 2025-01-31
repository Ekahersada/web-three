import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HelperService } from '../shared/helper.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { City } from './create-city';

@Component({
  selector: 'app-game-grid',
  templateUrl: './game-grid.component.html',
  styleUrls: ['./game-grid.component.css'],
})
export class GameGridComponent implements OnInit {
  @ViewChild('rendererContainer2', { static: true })
  rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private gridHelper!: THREE.GridHelper;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private buildings: THREE.Mesh[] = [];
  private selectedBuilding: THREE.Mesh | null = null;

  isPaused = false;

  mesh: any[] = [];

  constructor(private helper: HelperService) {}

  ngOnInit() {
    this.helper.lockFrame();
    this.initScene();
    this.animate();
    // this.addEventListeners();

    let city = new City().createCity(10);
    console.log(city);
    this.initialize(city);

    setInterval(() => {
      new City().updateCity();
    }, 1000);
  }

  initialize(city: any) {
    for (let x = 0; x < city.length; x++) {
      const column = [];
      for (let y = 0; y < city.length; y++) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, -0.5, y);
        this.scene.add(mesh);
        column.push(mesh);

        const tile = city[x][y];

        if (tile.building) {
          const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
          const buildingMaterial = new THREE.MeshPhongMaterial({
            color: 0x777777,
          });
          const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
          building.position.set(x, 0.5, y);
          this.scene.add(building);
          column.push(building);
        }
      }
      this.mesh.push(column);
    }
  }

  animate() {
    if (!this.isPaused) {
      requestAnimationFrame(() => this.animate());
      this.controls.update(); // Update orbit controls
      this.renderer.render(this.scene, this.camera);
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  initScene() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);

    // Tambahkan AxesHelper
    // this.axesHelper = new THREE.AxesHelper(5);
    // this.scene.add(this.axesHelper);

    // Create a grid
    // Grid Helper
    this.gridHelper = new THREE.GridHelper(20, 20);
    this.scene.add(this.gridHelper);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.addLight();
    // this.camera.position.set(0, 1, 0); // Set camera position 0.1 units above the grid
    // this.camera.position.set(4, 4, 0);

    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Animasi damping
    this.controls.dampingFactor = 0.05;
  }

  addLight() {
    // LIGHTS

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
    this.scene.add(hemiLightHelper);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    this.scene.add(dirLight);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    const d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = -0.0001;

    const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
    this.scene.add(dirLightHelper);

    const groundGeo = new THREE.PlaneGeometry(10000, 10000);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    groundMat.color.setHSL(0.095, 1, 0.75);

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -33;
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private addEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('click', (event) => this.onMouseClick(event));
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycasting
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const gridX = Math.round(point.x);
      const gridZ = Math.round(point.z);

      // Highlight grid position
      if (this.selectedBuilding) {
        this.selectedBuilding.position.set(gridX, 0, gridZ);
      }
    }
  }

  private onMouseClick(event: MouseEvent): void {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycasting
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const gridX = Math.round(point.x);
      const gridZ = Math.round(point.z);

      if (this.selectedBuilding) {
        // Place the selected building
        const building = this.selectedBuilding.clone();
        building.position.set(gridX, 0, gridZ);
        this.scene.add(building);
        this.buildings.push(building);
        this.selectedBuilding = null; // Reset selection
      } else {
        // Select a building to place
        this.createBuilding(gridX, gridZ);
      }
    }
  }

  private createBuilding(x: number, z: number): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, 0.5, z); // Y = 0.5 to place it on top of the grid
    this.selectedBuilding = building;
  }
}
