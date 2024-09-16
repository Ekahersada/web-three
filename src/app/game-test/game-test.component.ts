import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as THREE from 'three';
import * as io from 'socket.io-client';
import { GUI } from 'dat.gui';
import { OrbitControls, GLTFLoader, PointerLockControls, FirstPersonControls, MapControls, MD2Character, Gyroscope, MD2CharacterComplex } from 'three/examples/jsm/Addons.js'
import nipplejs from 'nipplejs';


@Component({
  selector: 'app-game-test',
  templateUrl: './game-test.component.html',
  styleUrls: ['./game-test.component.css']
})
export class GameTestComponent implements OnInit {

  @ViewChild('renderer2', { static: true }) rendererContainer!: ElementRef;
  @ViewChild('joystickContainer', { static: true }) joystickContainer!: ElementRef;


  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  private joystick: any;


  controls:any;
  clock = new THREE.Clock();

  playbackConfig:any = {

    speed: 1.0,
    wireframe: false

  };

  // keypress = {

  //   moveForward: false,
  //   moveBackward: false,
  //   moveLeft: false,
  //   moveRight: false

  // };

  private keypress:any = {
    a:false,
    s:false,
    d:false,
    w:false
  }
isMoving: boolean = false;

  datGUI:any;


  character:any;

  stats:any;


  constructor() { }

  ngOnInit() {
    this.initThree();
    this.animate();
    this.initJoystick();
  }

  onKeyDown( event:any ) {


    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW': this.controls.moveForward = true; break;

      case 'ArrowDown':
      case 'KeyS': this.controls.moveBackward = true; break;

      case 'ArrowLeft':
      case 'KeyA': this.controls.moveLeft = true; break;

      case 'ArrowRight':
      case 'KeyD': this.controls.moveRight = true; break;



      // case 'KeyC': controls.crouch = true; break;
      // case 'Space': controls.jump = true; break;
      // case 'ControlLeft':
      // case 'ControlRight': controls.attack = true; break;

    }

  }

  onKeyUp( event:any ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW': this.controls.moveForward = false; break;

      case 'ArrowDown':
      case 'KeyS': this.controls.moveBackward = false; break;

      case 'ArrowLeft':
      case 'KeyA': this.controls.moveLeft = false; break;

      case 'ArrowRight':
      case 'KeyD': this.controls.moveRight = false; break;

      // case 'KeyC': controls.crouch = false; break;
      // case 'Space': controls.jump = false; break;
      // case 'ControlLeft':
      // case 'ControlRight': controls.attack = false; break;

    }

  }



  initThree(){

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    
    this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
    this.camera.position.set(1, 1, 0);// Set camera position 0.1 units above the grid
  

    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);


    // Create a grid
    var gridHelper = new THREE.GridHelper(40, 40);
    this.scene.add(gridHelper);

    // this.controls = new FirstPersonControls( this.camera, this.renderer.domElement );
    // this.controls.movementSpeed = 5;
    // this.controls.lookSpeed = 0.8;


    // this.controls =  new MapControls( this.camera, this.renderer.domElement );
    // this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    // this.controls.dampingFactor = 0.05;

    // this.controls.screenSpacePanning = false;

    // this.controls.minDistance = 5;
    // this.controls.maxDistance = 500;

    // this.controls.maxPolarAngle = Math.PI / 2;
  
     // Initialize OrbitControls
     this.controls = new OrbitControls(this.camera, this.renderer.domElement);

      this.controls.target.set( 0, 1, 0 );
      this.controls.update();

    this.addLight();

    this.addGround()

    window.addEventListener( 'resize', ()=> this.onWindowResize() );

    window.addEventListener( 'keydown', (event)=>this.onKeyDown(event) );
		window.addEventListener( 'keyup', (event)=>this.onKeyUp(event) );

    this.addCharcter();

    this.datGUI  = new GUI();

  }

  addCharcter(){
    // CHARACTER

    const config = {

      baseUrl: './assets/models/ratama/',

      body: 'ratamahatta.md2',
      skins: [ 'ratamahatta.png', 'ctf_b.png', 'ctf_r.png', 'dead.png', 'gearwhore.png' ],
      weapons: [[ 'weapon.md2', 'weapon.png' ],
             [ 'w_bfg.md2', 'w_bfg.png' ],
             [ 'w_blaster.md2', 'w_blaster.png' ],
             [ 'w_chaingun.md2', 'w_chaingun.png' ],
             [ 'w_glauncher.md2', 'w_glauncher.png' ],
             [ 'w_hyperblaster.md2', 'w_hyperblaster.png' ],
             [ 'w_machinegun.md2', 'w_machinegun.png' ],
             [ 'w_railgun.md2', 'w_railgun.png' ],
             [ 'w_rlauncher.md2', 'w_rlauncher.png' ],
             [ 'w_shotgun.md2', 'w_shotgun.png' ],
             [ 'w_sshotgun.md2', 'w_sshotgun.png' ]
      ]

    };

    this.character = new MD2Character();
    // this.character = new MD2CharacterComplex();
    this.character.scale = 0.03;

    this.character.onLoadComplete = ()=>{

      this.setupSkinsGUI();
      this.setupWeaponsGUI();
      this.setupGUIAnimations();

      this.character.setAnimation( this.character.meshBody.geometry.animations[ 0 ].name );

      // const gyro = new Gyroscope();
			// 		gyro.add( this.camera );
			// 		gyro.add( light, light.target );

					// this.character.root.add( gyro );

          this.character.controls = this.controls;
    };

    this.character.loadParts( config );

    console.log(this.character);


    this.scene.add( this.character.root );

  

  }


  setupWeaponsGUI() {

    const folder = this.datGUI.addFolder( 'Weapons' );

    const generateCallback = ( index:any )=>{

      return ()=>{

        this.character.setWeapon( index );
        this.character.setWireframe( this.playbackConfig.wireframe );

      };

    };

    const guiItems = [];

    for ( let i = 0; i < this.character.weapons.length; i ++ ) {

      const name = this.character.weapons[ i ].name;

      this.playbackConfig[ name ] = generateCallback( i );
      guiItems[ i ] = folder.add( this.playbackConfig, name ).name( this.labelize( name ) );

    }

  }


  setupSkinsGUI( ) {

    const folder = this.datGUI.addFolder( 'Skins' );

    const generateCallback = ( index:any )=>{

      return ()=>{

        this.character.setSkin( index );
      }

    };

    const guiItems = [];

    for ( let i = 0; i < this.character.skinsBody.length; i ++ ) {

      const name = this.character.skinsBody[ i ].name;

      this.playbackConfig[ name ] = generateCallback( i );
      guiItems[ i ] = folder.add( this.playbackConfig, name ).name( this.labelize( name ) );

    }

  }


  setupGUIAnimations( ) {



    const folder = this.datGUI.addFolder( 'Animations' );


    const generateCallback = ( animationClip:any )=>{

      return ()=>{

        this.character.setAnimation( animationClip.name );

      };

    };

    const guiItems = [];
    const animations = this.character.meshBody.geometry.animations;

    for ( let i = 0; i < animations.length; i ++ ) {

      const clip = animations[ i ];

      this.playbackConfig[ clip.name ] = generateCallback( clip );
      guiItems[ i ] = folder.add( this.playbackConfig, clip.name, clip.name );

    }

  }

  addGround(){
    //  GROUND

    const gt = new THREE.TextureLoader().load( './assets/textures/any/grasslight-big.jpg' );
    const gg = new THREE.PlaneGeometry( 20, 20 );
    const gm = new THREE.MeshPhongMaterial( { color: 0xffffff, map: gt } );

    const ground = new THREE.Mesh( gg, gm );
    ground.rotation.x = - Math.PI / 2;
    ground.material.map!.repeat.set( 8, 8 );
    ground.material.map!.wrapS = ground.material.map!.wrapT = THREE.RepeatWrapping;
    ground.material.map!.colorSpace = THREE.SRGBColorSpace;
    ground.receiveShadow = true;

    this.scene.add( ground );

  }

  onWindowResize() {

    this.camera.aspect = window.innerWidth / window.innerHeight;

    
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.camera.updateProjectionMatrix();

    // labelRenderer.setSize( window.innerWidth, window.innerHeight );

  }


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


  animate(){
    requestAnimationFrame(() => this.animate());

    let mixerUpdateDelta = this.clock.getDelta();

    this.character.update( mixerUpdateDelta );

    // this.controls.update( mixerUpdateDelta );
    this.renderer.render(this.scene, this.camera);
  }


  labelize( text:any ) {

    const parts = text.split( '.' );

    if ( parts.length > 1 ) {

      parts.length -= 1;
      return parts.join( '.' );

    }

    return text;

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


      var vector = data.vector;
      var activeKeys = [];

      // Threshold untuk mendeteksi apakah gerakan lebih dominan di satu arah
      var threshold = 0.5;

      if (Math.abs(vector.x) > Math.abs(vector.y) * threshold) {
          // Gerakan lebih dominan ke arah horizontal
          if (vector.x < 0) {
              activeKeys.push('a'); // Kiri
          } else if (vector.x > 0) {
              activeKeys.push('d'); // Kanan
              
          }
      }

      if (Math.abs(vector.y) > Math.abs(vector.x) * threshold) {
          // Gerakan lebih dominan ke arah vertikal
          if (vector.y < 0) {
            activeKeys.push('s'); // Bawah
          } else if (vector.y > 0) {
            activeKeys.push('w'); // Atas
          }
      }

        // console.log(vector);
        this.updateDirectionStatus(activeKeys);
    });

    this.joystick.on('end', (event:any) =>{
      // this.triggerAction(null);

      this.updateDirectionStatus([]);

    });
  }

  updateDirectionStatus(activeKeys:any) {
    // console.log(activeKeys);

      // Reset semua status ke false
  for (var key in this.keypress) {
    this.keypress[key] = false;
    this.isMoving = false;

}
// Set arah yang aktif ke true
activeKeys.forEach((key:any)=>{
    this.keypress[key] = true;
    this.isMoving = true;
});

  }



}

