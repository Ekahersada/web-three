import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three'
import { OrbitControls, GLTFLoader,  } from 'three/examples/jsm/Addons.js';
import { CharacterControls } from './characterControls';
import { KeyDisplay } from './utils';
import nipplejs from 'nipplejs';
import * as io from 'socket.io-client';
import { MatDialog } from '@angular/material/dialog';
import { ModalSettingComponent } from '../modals/modal-setting/modal-setting.component';
import { lastValueFrom } from 'rxjs';
import { GameRpgService } from '../shared/game-rpg.service';





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

  init:boolean = false;
  
  demage = 10;

  movementThreshold = 0.05; // Distance threshold for detecting movement
  runThreshold = 0.2; // Speed threshold for running

  clock = new THREE.Clock();
  fadeDuration: number = 0.2

  isMoving: boolean = false;

  private character:any;
  private joystick: any;

  private MaincharacterPOS: any;

  private MainPlayerControl:any = {};

  myName = 'Jhone eo'

  socket: any;

  players: { [key: string]: any } = {};
  playerArr:any[]=[];

  private bullets: Bullet[] = [];

  health:number = 100;


  npcSpeed = 0.03;

  totalUser = 0;

  mixerNpc:any;

  private keypress:any = {
    a:false,
    s:false,
    d:false,
    w:false
  }


  constructor(
    private modal : MatDialog,
    private rpgServ: GameRpgService
  ) { }

  ngOnInit() {
    this.initThreeJS();

  
    this.openName();

    this.animate();
    this.initJoystick();
  }

  openName(){
    this.init = true
    let modal = this.modal.open(ModalSettingComponent,{
      data:this.myName,
      disableClose:true
    })


    lastValueFrom(modal.afterClosed()).then(res=>{
      if(res?.name){
        this.myName = res.name;
        this.updateSpriteText(this.MainPlayerControl.sprite, this.myName);
        this.init = false;
      }
    })

    
  }

  initSocket() {
    // this.socket = io.connect('localhost:3000');
    this.socket = io.connect('https://game.hostrx.net');

    // Handle current players
    this.socket.on('currentPlayers', (players: any) => {
      Object.keys(players).forEach((id) => {
        if (id !== this.socket.id) {
          this.addPlayer(id, players[id]);
          
        }
        this.totalUser++;
      });
    });

    // Handle new player
    this.socket.on('newPlayer', (data: any) => {
      this.addPlayer(data.id, data.player);
      this.totalUser++;

      // console.log(this.players);
    });

    // Terima posisi peluru dari server dan tambahkan ke scene
    this.socket.on('bulletPosition', (bulletData: any) => {
      this.createBulletFromData(bulletData);
    });

    

    // Handle player movement
    this.socket.on('playerMoved', (data: any) => {
      if (this.players[data.id]) {

        let player =  this.players[data.id];

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

        this.players[data.id].sprite?.position.set(
          data.player.position.x,
          data.player.position.y + 2,
          data.player.position.z
        )

        this.players[data.id].barHealth?.position.set(
          data.player.position.x,
          data.player.position.y + 2.1,
          data.player.position.z
        )

        if(this.players[data.id].name != data.player.name){
          this.updateSpriteText(this.players[data.id].sprite, data.player.name);
          this.players[data.id].name = data.player.name;
        }


        if(this.players[data.id].health != data.player.health ){

            this.rpgServ.updateHealth(this.players[data.id].barHealth, data.player.health);
            this.players[data.id].health = data.player.health;
        }

        let idx = this.playerArr.indexOf((x:any)=> x.id == data.id)

        if(idx != -1){
          this.playerArr[idx] = {...this.playerArr[idx], ...player};
        }



        // console.log(data);
        this.updateAnimation(data.id, data.player.movementStatus);
      }
    });

    // Handle player disconnect
    this.socket.on('playerDisconnected', (id: string) => {
      if (this.players[id]) {
        this.totalUser--;
        this.playerArr.filter(p => p.id ! == id);
        this.scene.remove(this.players[id]);

        delete this.players[id];
      }
    });
  }


  private createBulletFromData(bulletData: any): void {
    const bulletPosition = new THREE.Vector3(bulletData.x, bulletData.y, bulletData.z);
    const bulletDirection = new THREE.Vector3(bulletData.dx, bulletData.dy, bulletData.dz);
    const bullet = new Bullet(bulletPosition, bulletDirection);
    this.bullets.push(bullet);
    this.scene.add(bullet.mesh);
  }

  
  private createPlayerName(playerName: string): THREE.Sprite {
    // Buat canvas untuk menggambar teks
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const fontSize = 20;
    context.font = 'Semibold 10px Arial';
    context.fillStyle = 'white';
  
    // Sesuaikan ukuran canvas dengan panjang teks
    const textWidth = context.measureText(playerName).width;
    canvas.width = textWidth;
    canvas.height = fontSize;
  
    // Gambar teks pada canvas
    context.font = 'Semibold 10px Arial';
    context.fillStyle = 'white';
    context.fillText(playerName, 0, fontSize);
  
    // Buat texture dari canvas
    const texture = new THREE.CanvasTexture(canvas);
  
    // Buat material dan sprite untuk menampilkan teks
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(canvas.width / 50, canvas.height / 50, 1); // Atur ukuran sprite sesuai kebutuhan
  
    return sprite;
  }

  

 updateSpriteText(sprite: THREE.Sprite, newText: string) {
    // Buat canvas untuk menggambar teks
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const fontSize = 20;
    context.font = 'Semibold 10px Arial';
    context.fillStyle = 'white';
  
    // Hitung lebar teks dan sesuaikan ukuran canvas
    const textWidth = context!.measureText(newText).width;
    canvas.width = textWidth;
    canvas.height = fontSize;
  
    // Bersihkan canvas sebelumnya dan gambar teks baru
    context!.clearRect(0, 0, canvas.width, canvas.height);
    // Gambar teks pada canvas
    context.font = 'Semibold 10px Arial';
    context.fillStyle = 'white';
    context.fillText(newText, 0, fontSize);
  
    // Buat texture baru dari canvas
    const texture = new THREE.CanvasTexture(canvas);
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
  
    // Sesuaikan skala sprite berdasarkan ukuran teks baru
    sprite.scale.set(canvas.width / 50, canvas.height / 50, 1); // Atur ukuran sprite sesuai kebutuhan
  }


  updateAnimation(playerId: string, movementStatus: string) {
    if (this.players[playerId]) {
      const mixer = this.players[playerId].mixer;
      const anim = this.players[playerId].animation;


      if(movementStatus !=  this.players[playerId].current){
        let curr = this.players[playerId].current;

        const toPlay = anim.get(movementStatus)
        const current = anim.get(curr)

        current!.fadeOut(this.fadeDuration)
        toPlay!.reset().fadeIn(this.fadeDuration).play();

        this.players[playerId].current = movementStatus;

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
      // const animationsMap: any = [];

      gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
          animationsMap.set(a.name, mixer.clipAction(a))
          // animationsMap.push({key:a.name, mixer: mixer.clipAction(a)});
      })

      const toPlay = animationsMap.get('Idle')

      toPlay?.reset().fadeIn(this.fadeDuration).play();


    let playerNameSprite = this.createPlayerName(playerData?.name);
    playerNameSprite.position.set(0, 2, 0); // Misalnya 2 unit di atas karakter
    this.scene.add(playerNameSprite);

    // add Bar health
    let barHealth = this.rpgServ.createHealthBarSprite(playerData.health);
    this.scene.add(barHealth);


        
      
          this.players[id] = {
            model:player,
            id:id,
            sprite:playerNameSprite,
            barHealth: barHealth,
            name: playerData?.name,
            status:playerData.movementStatus,
            mixer:mixer,
            animation:animationsMap,
            current:'Walk',
            lastPosition: player.position.clone()
          };

          this.playerArr.push(this.players[id]);

          this.scene.add(player);



    })




    // console.log('player',player);
  }

  updatePlayerMovement() {
    if(this.character){
      const position = this.MainPlayerControl.position;
      const rotation = this.MainPlayerControl.rotation;



      // console.log(this.isMoving);

      let movementStatus = this.isMoving ? 'Run' : 'Idle';


      // let movementStatus ='Idle';

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
        movementStatus: movementStatus,
        name: this.myName,
        health: Number(this.health)
      });

      // console.log(this.myName);
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
    this.camera.position.set(24, 18, 0);

     // Initialize OrbitControls
     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
     this.controls.enableDamping = true;
     this.controls.minDistance = 5;
     this.controls.maxDistance = 20;
     this.controls.enablePan = false;
     this.controls.enableZoom = true;
     this.controls.enableRotate = true;
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

    this.initNPC();
    


  }

  initNPC(){

    // Create the NPC character


    // new GLTFLoader().load('./assets/models/Soldier.glb', (gltf) => {

    //   let model = gltf.scene;

    //   model.rotation.y = 8;

    //   model.position.set(5,0,0);
    //   model.name = 'npc';

    //   this.scene.add(model);

    // })



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
        model.name = 'MainPalayer';
        this.scene.add(model);

        const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap: Map<string, THREE.AnimationAction> = new Map()
        gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
            animationsMap.set(a.name, mixer.clipAction(a))
        })

        // console.log(animationsMap);

        this.character = new CharacterControls(model, mixer, animationsMap, this.controls, this.camera,  'Idle');

        const playerNameSprite = this.createPlayerName(this.myName);
        playerNameSprite.position.set(0, 2, 0); // Misalnya 2 unit di atas karakter
        this.scene.add(playerNameSprite);
        this.MainPlayerControl.sprite = playerNameSprite;
        
        // let barHealth = this.rpgServ.createHealthBarSprite(100);
        // this.MainPlayerControl.barHealth = barHealth;
        // this.scene.add(barHealth);

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
          if(!this.init){
            this.character.switchRunToggle()
          }
        } else {

          if(!this.init){
            (this.keypress as any)[event.key.toLowerCase()] = true
            this.isMoving = true;
          }
        }
    }, false);
    document.addEventListener('keyup', (event) => {
        keyDisplayQueue.up(event.key);
        (this.keypress as any)[event.key.toLowerCase()] = false
        this.isMoving = false;

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
        this.MainPlayerControl.sprite.position.set(this.MaincharacterPOS.x,this.MaincharacterPOS.y + 2, this.MaincharacterPOS.z);

        this.character.currentAction == 'Run' ? this.isMoving = true : this.isMoving = false; 



         // Update posisi atau rotasi sprite agar selalu menghadap kamera
        this.scene.children.forEach((child) => {
          if (child instanceof THREE.Sprite) {
            child.lookAt(this.camera.position);
          }
        });



        Object.values(this.players).forEach(({ mixer }) => mixer.update(mixerUpdateDelta));
        this.updatePlayerMovement();

        this.updateBullet();
      
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

  onShoot(): void {
    // const bullet = new Bullet(this.camera.position.clone(), this.camera.getWorldDirection(new THREE.Vector3()));
    // this.bullets.push(bullet);
    // this.scene.add(bullet.mesh);


     // Posisi awal peluru adalah di depan karakter
      const bulletPosition = new THREE.Vector3();
      this.character.model.getWorldPosition(bulletPosition);

      // Arah tembakan mengikuti arah depan karakter
      const direction = new THREE.Vector3(0, 0, -1); // Arah depan relatif terhadap karakter
      direction.applyQuaternion(this.character.model.quaternion); // Menyesuaikan arah dengan rotasi karakter

      // Offset untuk mengeluarkan peluru sedikit di depan karakter
      const offset = direction.clone().multiplyScalar(1.5); // Mengatur jarak dari karakter
      bulletPosition.add(offset);

      // Buat peluru dan tambahkan ke scene
      // const bullet = new Bullet(bulletPosition, direction);
      // this.bullets.push(bullet);
      // this.scene.add(bullet.mesh);


      const bulletData = {
        x: this.character.model.position.x,
        y: this.character.model.position.y,
        z: this.character.model.position.z,
        dx: direction.x,
        dy: direction.y,
        dz: direction.z,
        id:this.socket.id
      };
  
      this.socket.emit('shootBullet', bulletData);

  }

  private checkCollision(bullet: Bullet) {
    // Misalnya, Anda dapat memeriksa jarak antara peluru dan objek
    // const target = this.scene.getObjectByName('npc'); // Nama objek target

    // let collisionDetected = false;

    // this.playerArr.forEach(x=>{

    //   if (bullet.mesh.position.distanceTo(x.model.position) < 0.5) {
    //     collisionDetected = x.id;
    //     console.log(`Hit: ${x.name}`);
    //   }
    // })


    // return collisionDetected;


    if (bullet.mesh.position.distanceTo(this.MaincharacterPOS) < 0.5) {
      return true;
    }
    return false;
  }


  updateBullet(){
    this.bullets.forEach((bullet, index) => {
      bullet.update();
      // Hapus peluru jika keluar dari jangkauan tertentu
      if (bullet.mesh.position.length() > 30) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(index, 1);
      }

      let cek = this.checkCollision(bullet);
      if (cek) {
        
        
        this.health =  this.rpgServ.onCharacterHit(this.health, this.demage);
        // console.log('myHealt', this.health);
        this.updatePlayerMovement();

        // console.log(this.MainPlayerControl.barHealth);

        // this.rpgServ.updateHealth(this.MainPlayerControl.barHealth, this.health);
          
        // Hapus peluru setelah tabrakan
        this.scene.remove(bullet.mesh);
        this.bullets.splice(index, 1);
      }
      
    });


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


class Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;

  constructor(position: THREE.Vector3, direction: THREE.Vector3) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.velocity = direction.multiplyScalar(0.8); // Kecepatan peluru
  }

  update(): void {
    this.mesh.position.add(this.velocity);
  }
}
