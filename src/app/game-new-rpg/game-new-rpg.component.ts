import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls, GLTFLoader, PointerLockControls, FBXLoader  } from 'three/examples/jsm/Addons.js';
import { PreloaderInit, PreloaderOptions } from './preloader';
import { JoyStick } from './joystick';

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
  private orbit!: OrbitControls;

  anims = ["run", "gather-objects", "look-around"];

  modes = {
    NONE: "none",
    PRELOAD: "preload",
    INITIALIZE: "initialize",
    ACTIVE: "active"
  }

  mode = this.modes.NONE;

  clock = new THREE.Clock();
  player: any = {};

  constructor() { }

  ngOnInit() {
    this.mode = this.modes.PRELOAD;

    const assets = this.anims.map(anim => `assets/lotus/fbx/${anim}.fbx`);
    console.log(assets);

    const preloaderOptions: PreloaderOptions = {
      assets: assets,
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

    new PreloaderInit(preloaderOptions);
  }

  runAnimate() {
    const dt = this.clock.getDelta();
    requestAnimationFrame(() => this.runAnimate());

    if (this.player.mixer!=undefined && this.mode==this.modes.ACTIVE) this.player.mixer.update(dt);
		
		if (this.player.move!=undefined){
			if (this.player.move.forward>0) this.player.object.translateZ(dt*100);
			this.player.object.rotateY(this.player.move.turn*dt);
		}
		
		if (this.player.cameras!=undefined && this.player.cameras.active!=undefined){
			this.camera.position.lerp(this.player.cameras.active.getWorldPosition(new THREE.Vector3()), 0.05);
			this.camera.quaternion.slerp(this.player.cameras.active.getWorldQuaternion(new THREE.Quaternion()), 0.05);
		}
		

    this.renderer.render(this.scene, this.camera);
  }

  initScene() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa0a0a0);
    this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const gridHelper = new THREE.GridHelper(40, 40);
    this.scene.add(gridHelper);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    this.camera.position.set(0, 1, 0);
    this.camera.near = 0.015;
    this.camera.updateProjectionMatrix();

    this.generateFloor();
    this.addLight();
    this.loadModel();
  }

  addLight() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    this.scene.add(dirLight);
  }

  generateFloor() {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  wrapAndRepeatTexture(map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(10, 10);
    return map;
  }

  loadModel() {
    const loader = new FBXLoader();
    loader.load('assets/lotus/fbx/girl-walk.fbx', (object: any) => {
      object.mixer = new THREE.AnimationMixer(object);
      this.player.mixer = object.mixer;
      this.player.root = object.mixer.getRoot();

      object.name = "Character";
      object.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

    
      if ( object.animations && object.animations.length ) {


        const action = object.mixer.clipAction( object.animations[0] );
        action.play();

      }
      

      this.scene.add(object);
      this.player.object = object;
      this.player.walk = object.animations[0];

      new JoyStick({
        onMove: (forward: number, turn: number) => this.playerControl(forward, turn),
				game: this
			});

      this.createCameras();
      this.loadNextAnim(loader);


    });
  }

  playerControl(forward:any, turn:any){
		//console.log(`playerControl(${forward}), ${turn}`);
        
		if (forward>0){
			if (this.player.action!='walk') this.action('walk');
		}else{
			if (this.player.action=="walk") this.action('look-around');
		}
		if (forward==0 && turn==0){
			delete this.player.move;
		}else{
			this.player.move = { forward, turn }; 
		}

    console.log(this.player);
	}

  action(name:any){
		const anim = this.player[name];
		const action = this.player.mixer.clipAction( anim,  this.player.root );
        action.time = 0;
		this.player.mixer.stopAllAction();
        if (this.player.action == 'gather-objects'){
            delete this.player.mixer._listeners['finished'];
        }
        if (name=='gather-objects'){
            action.loop = THREE.LoopOnce;
            this.player.mixer.addEventListener('finished', () => { 
                console.log("gather-objects animation finished");
                this.action('look-around');
            });
        }
		this.player.action = name;
		action.fadeIn(0.5);	
		action.play();
	}

  loadNextAnim(loader: any) {
    const anim = this.anims.pop();
    if (!anim) return;

    loader.load(`assets/lotus/fbx/${anim}.fbx`, (object: any) => {

      this.player[anim] = object.animations[0];
      if (this.anims.length > 0) {
        this.loadNextAnim(loader);
      } else {
        this.anims = [];
        this.player.action = "look-around";
        this.mode = this.modes.INITIALIZE;
      }
    });
  }


  createCameras(){
		const offset = new THREE.Vector3(0, 60, 0);
		const front = new THREE.Object3D();
		front.position.set(112, 100, 200);
		front.quaternion.set(0.07133122876303646, -0.17495722675648318, -0.006135162916936811, -0.9819695435118246);
		front.parent = this.player.object;
		const back = new THREE.Object3D();
		back.position.set(0, 100, -250);
		back.quaternion.set(-0.001079297317118498, -0.9994228131639347, -0.011748701462123836, -0.031856610911161515);
		back.parent = this.player.object;
		const wide = new THREE.Object3D();
		wide.position.set(178, 139, 465);
		wide.quaternion.set(0.07133122876303646, -0.17495722675648318, -0.006135162916936811, -0.9819695435118246);
		wide.parent = this.player.object;
		const overhead = new THREE.Object3D();
		overhead.position.set(0, 400, 0);
		overhead.quaternion.set(0.02806727427333993, 0.7629212874133846, 0.6456029820939627, 0.018977008134915086);
		overhead.parent = this.player.object;
		const collect = new THREE.Object3D();
		collect.position.set(40, 82, 94);
		collect.quaternion.set(0.07133122876303646, -0.17495722675648318, -0.006135162916936811, -0.9819695435118246);
		collect.parent = this.player.object;
		this.player.cameras = { front, back, wide, overhead, collect };
		this.activeCamera(this.player.cameras.back);	
	}

  activeCamera(object:any){
		this.player.cameras.active = object;
	}

}
