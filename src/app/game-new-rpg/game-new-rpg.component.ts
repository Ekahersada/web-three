import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls, GLTFLoader, PointerLockControls  } from 'three/examples/jsm/Addons.js';
import { PreloaderInit, PreloaderOptions } from './preloader';

@Component({
  selector: 'app-game-new-rpg',
  templateUrl: './game-new-rpg.component.html',
  styleUrls: ['./game-new-rpg.component.css']
})
export class GameNewRpgComponent implements OnInit {
  @ViewChild('rendererContainer2', { static: true }) rendererContainer!: ElementRef;
  @ViewChild('container', { static: true }) container!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  anims = ["run", "gather-objects", "look-around"];

  modes = {
    NONE: "none",
    PRELOAD: "preload",
    INITIALIZE: "initialize",
  }

  mode = this.modes.NONE;


  clock = new THREE.Clock();

  constructor() { }

  ngOnInit() {



    this.mode = this.modes.PRELOAD;

    const ass =  this.anims.map(anim => `assets/lotus/fbx/${anim}.fbx`)

    console.log(ass);
  // Initialize preloader
  const preloaderOptions: PreloaderOptions = {
    assets: this.anims.map(anim => `assets/lotus/fbx/${anim}.fbx`),
    container: this.container.nativeElement,
    onprogress: (progress: number) => {
      console.log(progress);
    },
    oncomplete: () => {

      console.log("Preloading complete");
      this.mode = this.modes.INITIALIZE;
      this.initScene();
      this.runAnimate();
    }
  };

  const preloader = new PreloaderInit(preloaderOptions);

  }

  // MARK: Animate
  runAnimate(){
    requestAnimationFrame(() => this.runAnimate());

    this.renderer.render(this.scene, this.camera);


  }

  // MARK: Initialize the scene
  initScene(){
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);


    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);


    // Create a grid
    var gridHelper = new THREE.GridHelper(40, 40);
    this.scene.add(gridHelper);


    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1, 0);// Set camera position 0.1 units above the grid

    // Adjust the camera's near clipping plane value
    this.camera.near = .015; // Set a smaller value, like 0.1
    this.camera.updateProjectionMatrix();


    this.generateFloor();

    this.addLight()
  }
  // MARK: Add light
  addLight(){
    // LIGHTS
    
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 50, 0 );
        this.scene.add( hemiLight );
    
    const hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
        this.scene.add( hemiLightHelper );
    
    //
    
    const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( - 1, 1.75, 1 );
    dirLight.position.multiplyScalar( 30 );
        this.scene.add( dirLight );
    
    dirLight.castShadow = true;
    
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    
    const d = 50;
    
    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;
    
    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = - 0.0001;
    
    const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
        this.scene.add( dirLightHelper );
    
    // GROUND
    
    const groundGeo = new THREE.PlaneGeometry( 10000, 10000 );
    const groundMat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
    groundMat.color.setHSL( 0.095, 1, 0.75 );
    
    const ground = new THREE.Mesh( groundGeo, groundMat );
    ground.position.y = - 33;
    ground.rotation.x = - Math.PI / 2;
    ground.receiveShadow = true;
        this.scene.add( ground );
  }
  // MARK:Generate the floor
  generateFloor(){

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

}
