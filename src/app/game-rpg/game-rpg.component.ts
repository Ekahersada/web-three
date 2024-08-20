import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three'
import { OrbitControls, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { CharacterControls } from './characterControls';
import { KeyDisplay } from './utils';
import nipplejs from 'nipplejs';



@Component({
  selector: 'app-game-rpg',
  templateUrl: './game-rpg.component.html',
  styleUrls: ['./game-rpg.component.css']
})
export class GameRpgComponent implements OnInit {
  @ViewChild('canvas2', { static: true }) canvasRef!: ElementRef;
  @ViewChild('joystickContainer', { static: true }) joystickContainer!: ElementRef;

  
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private player!: THREE.Mesh;
  private walls: THREE.Mesh[] = [];

  clock = new THREE.Clock();

  private character:any;
  private joystick: any;


  private keypress:any = {
    a:false,
    s:false,
    d:false,
    w:false
  }


  constructor() { }

  ngOnInit() {
    this.initThreeJS();
    this.animate();
    this.initJoystick();
  }

  private initThreeJS(): void {

    const canvas = this.canvasRef.nativeElement;

     // Initialize renderer
     this.renderer = new THREE.WebGLRenderer({ canvas });
     this.renderer.setSize(window.innerWidth, window.innerHeight);
     this.renderer.setPixelRatio(window.devicePixelRatio);
     this.renderer.shadowMap.enabled = true;

     // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(5, 5, 0);

     // Initialize OrbitControls
     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
     this.controls.enableDamping = true;
     this.controls.minDistance = 5;
     this.controls.maxDistance = 15;
     this.controls.enablePan = false;
     this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

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

    this.generateFloor();
    this.onWindowResize();
    this.initialModelCharacter();
    this.keyControl();


  }

  initialModelCharacter(){
    // MODEL WITH ANIMATIONS
    var characterControls: CharacterControls
    new GLTFLoader().load('./assets/models/Soldier.glb', (gltf) => {
        const model = gltf.scene;

        // console.log(model);
        model.traverse(function (object: any) {
            if (object.isMesh) object.castShadow = true;
        });
        this.scene.add(model);

        const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap: Map<string, THREE.AnimationAction> = new Map()
        gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
            animationsMap.set(a.name, mixer.clipAction(a))
        })

        this.character = new CharacterControls(model, mixer, animationsMap, this.controls, this.camera,  'Idle')
    });
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

  keyControl(){
    // CONTROL KEYS
  
    const keyDisplayQueue = new KeyDisplay();
    document.addEventListener('keydown', (event) => {
        keyDisplayQueue.down(event.key)
        if (event.shiftKey && this.character) {
            this.character.switchRunToggle()
        } else {
            (this.keypress as any)[event.key.toLowerCase()] = true
        }
    }, false);
    document.addEventListener('keyup', (event) => {
        keyDisplayQueue.up(event.key);
        (this.keypress as any)[event.key.toLowerCase()] = false
    }, false);
  }

  onWindowResize(){
    window.addEventListener('resize', ()=>{
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
})
  }

  private animate = () => {
    
    let mixerUpdateDelta = this.clock.getDelta();
    if (this.character) {
        this.character.update(mixerUpdateDelta, this.keypress);
    }
    this.controls.update()

    requestAnimationFrame(this.animate);

    this.renderer.render(this.scene, this.camera);
  };

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
      var direction = data.direction;
      if (direction) {
          var key;
          if (direction.angle === 'left') key = 'a';
          if (direction.angle === 'right') key = 'd';
          if (direction.angle === 'up') key = 'w';
          if (direction.angle === 'down') key = 's';
          this.triggerAction(key);
      }
    });

    this.joystick.on('end', (event:any) =>{
      this.triggerAction(null);

  });
  }

  triggerAction(key:any) {
    // Set semua arah menjadi false
    for (var dir in this.keypress) {
      this.keypress[dir] = false;
    }

    // Set arah yang sesuai menjadi true
    if (key) {
        this.keypress[key] = true;
    }

  // Debugging: Lihat status arah di console
  console.log(this.keypress);

}

}
