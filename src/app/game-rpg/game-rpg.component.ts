import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three'
import { OrbitControls, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { CharacterControls } from './characterControls';
import { KeyDisplay } from './utils';
import nipplejs from 'nipplejs';
import * as io from 'socket.io-client';




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
  private npc:any[]=[];

  movementThreshold = 0.05; // Distance threshold for detecting movement
  runThreshold = 0.2; // Speed threshold for running

  clock = new THREE.Clock();

  isMoving: boolean = false;

  private character:any;
  private joystick: any;

  private MaincharacterPOS: any;

  private MainPlayerControl:any = {};

  socket: any;

  players: { [key: string]: any } = {};


  npcSpeed = 0.03;

  mixerNpc:any;

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

        // console.log(this.players[data.id]);
        this.players[data.id].model.position.set(
          data.player.position.x,
          data.player.position.y,
          data.player.position.z
        );
        this.players[data.id].model.rotation.set(
          data.player.rotation.x,
          data.player.rotation.y,
          data.player.rotation.z
        );

        // console.log(data);
        this.updateAnimation(data.id, data.player.movementStatus);
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

  updateAnimation(playerId: string, movementStatus: string) {
    if (this.players[playerId]) {
      const mixer = this.players[playerId].mixer;
      const anim = this.players[playerId].animation;

      // console.log(this.players[playerId]);

    //   anim.forEach((value:any, key:any) => {
    //     if (key == movementStatus) {
    //         mixer.clipAction(key).play();
    //     }
    // })

      // console.log(mixer);

      // Update the animation based on movement status
      if (movementStatus === 'Run') {
        // Play running animation
        // mixer.mixer.clipAction('Run').play();

      } else if (movementStatus === 'walk') {
        // Play walking animation
        // mixer.clipAction('walk').play();
      } else {
        // Play idle animation
        // console.log(mixer.clipAction('Idle'));
        // mixer.clipAction('Idle').play();
      }
    }
  }

  addPlayer(id: string, playerData: any) {
    // const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    // const playerMaterial = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
    // const player = new THREE.Mesh(playerGeometry, playerMaterial);

    new GLTFLoader().load('./assets/models/Soldier.glb', (gltf) => {

      let player = gltf.scene;
      // this.scene.add(model);


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

      const mixer = new THREE.AnimationMixer(player);

      // Assuming the model has animations, add them here
      // gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      const gltfAnimations: THREE.AnimationClip[] = gltf.animations;

      const animationsMap: Map<string, THREE.AnimationAction> = new Map()
      gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
          animationsMap.set(a.name, mixer.clipAction(a))
      })


        
      
          this.players[id] = {
            model:player,
            status:playerData.movementStatus,
            mixer:mixer,
            animation:animationsMap,
            lastPosition: player.position.clone()
          };
          this.scene.add(player);



    })




    // console.log('player',player);
  }

  updatePlayerMovement() {
    if(this.character){
      const position = this.MainPlayerControl.position;
      const rotation = this.MainPlayerControl.rotation;

      // console.log(this.isMoving);

      // let movementStatus = this.isMoving ? 'Run' : 'Idle';
      let movementStatus ='Idle';

      // const currentPosition = new THREE.Vector3(position.x, position.y, position.z);
      // const distanceMoved = currentPosition.distanceTo(this.players[this.socket.id].lastPosition);
  
      // if (distanceMoved > this.movementThreshold) {
      //   const speed = distanceMoved / this.clock.getDelta(); // Speed = distance / time
      //   movementStatus = speed > this.runThreshold ? 'Run' : 'Idle';
      // }
  
      // this.players[this.socket.id].lastPosition.copy(currentPosition);

  
      this.socket.emit('movePlayer', {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
        movementStatus: movementStatus
      });
    }
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

    this.npc = [
      {name:'npc1'},
      {name:'npc1'},
      {name:'npc1'},
      // {name:'npc2'},
      // {name:'npc3'},
    ]

    // this.initNPC();
    


  }

  initNPC(){

    // Create the NPC character


    new GLTFLoader().load('./assets/models/Soldier.glb', (gltf) => {

      let model = gltf.scene;

      model.rotation.y = 8;

      model.position.set(5,0,0);

      this.scene.add(model);

    })



    // this.npc.forEach((x:any,idx):any=>{

      
    //   const rand =  this.getRandomInt(1,5) ;

    //   new GLTFLoader().load('./assets/models/Soldier.glb', (gltf) => {

    //     let model = gltf.scene;

    //   //   model.traverse(function (object: any) {
    //   //     if (object.isMesh) object.castShadow = true;
    //   // });
    //   model.rotation.y = 8;  // Flip model 180 degrees

    //     this.scene.add(model);

    //         // Set up animation mixer
    //        x.mixer = new THREE.AnimationMixer(model);


        
    //        console.log(model.rotation);
            
    //         // Add all animations from the GLB file to the mixer
    //         gltf.animations.forEach((clip) => {
    //           if(clip.name =='Walk'){
    //             x.mixer.clipAction(clip).play(); // Play all animations
    //           }
    //           console.log(clip.name);
    //       });

    //         // Optionally adjust the model's scale and position
    //         // model.scale.set(1, 1, 1); // Scale model if necessary
    //         model.position.set(rand, 0, 0);
            
    //         x.char = model;// Position model if necessary

    //   })

    // })

    console.log(this.npc);


  }

  moveNpcRandomly() {
    
    this.npc.forEach(x=>{

      if(x?.char){
        const dx = this.MaincharacterPOS?.x - x.char.position.x;
              const dz = this.MaincharacterPOS?.z - x.char.position.z;
              const distance = Math.sqrt(dx * dx + dz * dz);
  
              if (distance > 0.1) { // Threshold to stop moving when close enough
                  x.char.position.x += (dx / distance) * this.npcSpeed;
                  x.char.position.z += (dz / distance) * this.npcSpeed;
              }
        

      }
    })
}

  getRandomInt(min:number, max:number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//   moveNpcRandomly() {
//     const angle = Math.random() * 2 * Math.PI;
//     npcCharacter.position.x += Math.cos(angle) * npcSpeed;
//     npcCharacter.position.z += Math.sin(angle) * npcSpeed;
// }




  initialModelCharacter(){
    // MODEL WITH ANIMATIONS

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

        console.log(animationsMap);

        this.character = new CharacterControls(model, mixer, animationsMap, this.controls, this.camera,  'Idle')

        this.initSocket();

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
        this.MaincharacterPOS = this.character.model.position;
        this.MainPlayerControl.position = this.character.model.position;
        this.MainPlayerControl.rotation = this.character.model.rotation;



        Object.values(this.players).forEach(({ mixer }) => mixer.update(mixerUpdateDelta));
        this.updatePlayerMovement();

      
          // this.npc.forEach(x=>{
            

          //   if(x?.mixer && x?.char){
          //     x.mixer.update(mixerUpdateDelta);

          //     const direction = new THREE.Vector3();
          //     direction.subVectors(this.MaincharacterPOS, x.char.position).normalize();
          //     const angle = Math.atan2(direction.z, direction.x);
          //     x.char.rotation.y = angle + 2; // Rotate NPC to face the main character

          //     // console.log(angle);


          //     x.char.lookAt(this.MaincharacterPOS)
          //   }

          // })
        

        // console.log(this.MaincharacterPOS)
    }
    this.controls.update()
    
    

    // this.moveNpcRandomly();

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

  // Fungsi untuk mendeteksi arah berdasarkan sudut
detectDirection(radian:any) {
  var activeKeys = [];

  // Hitung berdasarkan radian (atau gunakan degree jika lebih mudah)
  var angle = radian * (180 / Math.PI); // Konversi ke derajat

  if (angle >= 135 || angle <= -135) {
      activeKeys.push('a'); // Kiri
  }
  if (angle >= -45 && angle <= 45) {
      activeKeys.push('d'); // Kanan
  }
  if (angle > 45 && angle < 135) {
      activeKeys.push('w'); // Atas
  }
  if (angle < -45 && angle > -135) {
      activeKeys.push('s'); // Bawah
  }

  return activeKeys;
}

  // Fungsi untuk mengaktifkan arah dan menonaktifkan yang tidak digunakan
 updateDirectionStatus(activeKeys:any) {

 
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

  // console.log(this.keypress); // Debugging status arah
}





}