import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls, GLTFLoader, PointerLockControls, FBXLoader  } from 'three/examples/jsm/Addons.js';
import { PreloaderInit, PreloaderOptions } from './preloader';
import { JoyStick } from './joystick';
import { SFX } from './sfx';
import { Tween } from './tween';

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

  anims = ["ascend-stairs", "gather-objects", "look-around", "push-button", "run"];

  modes = {
    NONE: "none",
    PRELOAD: "preload",
    INITIALIZE: "initialize",
    ACTIVE: "active"
  }

  mode = this.modes.NONE;

  clock = new THREE.Clock();
  player: any = {};
  cameraFade: number = 0;
  cameraTarget: any;
  tweens: any[]=[];
  environmentProxy: any;
  collect: any[]=[];

  assetsPath: string = 'assets/lotus/';
  sfxExt: any = SFX.supportsAudioType('mp3') ? 'mp3' : 'ogg';

  assets: any[]=[
    // `${this.assetsPath}sfx/gliss.${this.sfxExt}`,
    // `${this.assetsPath}sfx/factory.${this.sfxExt}`,
    // `${this.assetsPath}sfx/button.${this.sfxExt}`,
    // `${this.assetsPath}sfx/door.${this.sfxExt}`,
    // `${this.assetsPath}sfx/fan.${this.sfxExt}`,
    `${this.assetsPath}fbx/environment.fbx`,
    `${this.assetsPath}fbx/girl-walk.fbx`,
    `${this.assetsPath}fbx/usb.fbx`,
  ];
  fans: any[]=[];
  actionBtn:any;
  doors: any;
  onAction: any;
  collected: any[] = [];

  constructor() { }

  ngOnInit() {
    this.mode = this.modes.PRELOAD;

    

    this.anims.map(anim => this.assets.push(`assets/lotus/fbx/${anim}.fbx`));

    this.actionBtn = document.getElementById("action-btn");
   

    const preloaderOptions: PreloaderOptions = {
      assets: this.assets,
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
  //MARK: - runAnimate
  runAnimate() {
    const dt = this.clock.getDelta();
    requestAnimationFrame(() => this.runAnimate());

    if (this.tweens.length>0){

  
			this.tweens.forEach((tween:any)=>{ tween.update(dt); });	
		}
		
		if (this.player.mixer!=undefined && this.mode==this.modes.ACTIVE){
			this.player.mixer.update(dt);
		}
		
		if (this.player.action=='walk'){
			const elapsedTime = Date.now() - this.player.actionTime;
			if (elapsedTime>1000 && this.player.move.forward>0) this.action('run');
		}
		if (this.player.move!=undefined){
			if (this.player.move.forward!=0) this.movePlayer(dt);
			this.player.object.rotateY(this.player.move.turn*dt);
		}
		
		if (this.player.cameras!=undefined && this.player.cameras.active!=undefined){
			this.camera.position.lerp(this.player.cameras.active.getWorldPosition(new THREE.Vector3()), this.cameraFade);
			let pos;
			if (this.cameraTarget!=undefined){
				this.camera.position.copy(this.cameraTarget.position);
				pos = this.cameraTarget.target;
			}else{
				pos = this.player.object.position.clone();
				pos.y += 60;
			}
			this.camera.lookAt(pos);
		}


    this.actionBtn.style = 'display:none;';
		let trigger = false;
		
		if (this.doors !== undefined){
			this.doors.forEach((door:any)=>{
				if (this.player.object.position.distanceTo(door.trigger.position)<100){
					this.actionBtn.style = 'display:block;';
					this.onAction = { action:'push-button', mode:'open-doors', index:0 };
					trigger = true;
				}
			});
		}
        
        if (this.collect !== undefined && !trigger){

            this.collect.forEach((object:any)=>{
				if (object.visible && this.player.object.position.distanceTo(object.position)<100){
					this.actionBtn.style = 'display:block;';
					this.onAction = { action:'gather-objects', mode:'collect', index:0, src:"assets/lotus/usb.jpg" };
					trigger = true;
				}
			});
        }
		
		if (!trigger) delete this.onAction;
		
		if (this.fans !== undefined){
            let vol = 0;
            this.fans.forEach((fan:any)=>{
                const dist = fan.position.distanceTo(this.player.object.position);
                const tmpVol = 1 - dist/1000;
                if (tmpVol>vol) vol = tmpVol;
                fan.rotateZ(dt); 
            });
            // this.sfx.fan.volume = vol;
        }
	
		this.renderer.render( this.scene, this.camera );

		// if (this.stats!=undefined) this.stats.update();
  }

  //MARK: - initScene
  initScene() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa0a0a0);
    this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const gridHelper = new THREE.GridHelper(40, 40);
    this.scene.add(gridHelper);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    // this.camera.position.set(0, 1, 0);
    // this.camera.near = 0.015;
    // this.camera.updateProjectionMatrix();

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

  //MARK: - loadModel
  loadModel() {
    const loader = new FBXLoader();
    loader.load('assets/lotus/fbx/girl-walk.fbx', (object: any) => {
      object.mixer = new THREE.AnimationMixer(object);

      object.mixer.addEventListener('finished', (e: any) => {
				this.action('look-around');
        if (this.player.cameras.active == this.player.cameras.collect){

          console.log("this.player.cameras.active == this.player.cameras.collect");
            this.activeCamera(this.player.cameras.back);
            this.toggleBriefcase();
        }
			})

      this.player.mixer = object.mixer;
      this.player.root = object.mixer.getRoot();



      object.name = "Character";
      object.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

  

      this.scene.add(object);
      this.player.object = object;
      this.player.walk = object.animations[0];

      new JoyStick({
        onMove: (forward: number, turn: number) => this.playerControl(forward, turn),
				game: this
			});

      this.createCameras();
      // this.loadNextAnim(loader);
      this.loadEnvironment(loader);

  



    });

  
  }

  loadUSB(loader:any){
		const game = this;
		
		loader.load( `assets/lotus/fbx/usb.fbx`, (object:any) => {
			game.scene.add(object);
			
            const scale = 0.2;
			object.scale.set(scale, scale, scale);
			object.name = "usb";
            object.position.set(-416, 0.8, -472);
            object.castShadow = true;
			
            game.collect.push(object);
			
			object.traverse( (child:any) => {
				if ( child.isMesh ) {
                    child.castShadow = true;
                    child.receiveShadow = true;
				}
			} );
			
			this.loadNextAnim(loader);
		}, null, (err:any)=>{console.log(err)} );
	}

  showMessage(msg: any, fontSize: number = 20, onOK: (() => void) | null = null) {
		const txt = document.getElementById('message_text');
		txt!.innerHTML = msg;
		txt!.style.fontSize = fontSize + 'px';
		const btn = document.getElementById('message_ok');
		const panel = document.getElementById('message');
		const game = this;
		if (onOK!=null){
			btn!.onclick = function(){ 
				panel!.style.display = 'none';
				onOK.call(game); 
			}
		}else{
			btn!.onclick = function(){
				panel!.style.display = 'none';
			}
		}
		panel!.style.display = 'flex';
	}

  //MARK: - playerControl
  playerControl(forward:any, turn:any){
    turn = -turn;
		
		if (forward==0 && turn==0){
			delete this.player.move;
		}else{
			this.player.move = { forward, turn }; 
		}
		
		if (forward>0){
			if (this.player.action!='walk'&& this.player.action!='run') this.action('walk');
		}else if (forward<-0.2){
			if (this.player.action!='walk') this.action('walk');
		}else{
			if (this.player.action=="walk" || this.player.action=='run') this.action('look-around');
		}
	}

  movePlayer(dt:any){
		const pos = this.player.object.position.clone();
		pos.y += 60;
		let dir = new THREE.Vector3();
		this.player.object.getWorldDirection(dir);
		if (this.player.move.forward<0) dir.negate();
		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		const box = this.environmentProxy;
	
		if (this.environmentProxy!=undefined){ 
			const intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<50) blocked = true;
			}
		}
		
		if (!blocked){
			if (this.player.move.forward>0){
				const speed = (this.player.action=='run') ? 200 : 100;
				this.player.object.translateZ(dt*speed);
			}else{
				this.player.object.translateZ(-dt*30);
			}
		}
		
		if (this.environmentProxy!=undefined){
			//cast left
			dir.set(-1,0,0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.player.object.translateX(50-intersect[0].distance);
			}
			
			//cast right
			dir.set(1,0,0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.player.object.translateX(intersect[0].distance-50);
			}
			
			//cast down
			dir.set(0,-1,0);
			pos.y += 200;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				const targetY = pos.y - intersect[0].distance;
				if (targetY > this.player.object.position.y){
					//Going up
					this.player.object.position.y = 0.8 * this.player.object.position.y + 0.2 * targetY;
					this.player.velocityY = 0;
				}else if (targetY < this.player.object.position.y){
					//Falling
					if (this.player.velocityY==undefined) this.player.velocityY = 0;
					this.player.velocityY += dt * gravity;
					this.player.object.position.y -= this.player.velocityY;
					if (this.player.object.position.y < targetY){
						this.player.velocityY = 0;
						this.player.object.position.y = targetY;
					}
				}
			}
		}
	}

  action(name:any){
    if (this.player.action==name) return;
		const anim = this.player[name];
		const action = this.player.mixer.clipAction( anim,  this.player.root );
		this.player.mixer.stopAllAction();
		this.player.action = name;
		action.timeScale = (name=='walk' && this.player.move!=undefined && this.player.move.forward<0) ? -0.3 : 1;
        action.time = 0;
		action.fadeIn(0.5);	
		if (name=='push-button' || name=='gather-objects') action.loop = THREE.LoopOnce;
		action.play();
		this.player.actionTime = Date.now();

	}

  loadNextAnim(loader: any) {
    const anim = this.anims.pop();
    if (!anim) return;

    loader.load(`assets/lotus/fbx/${anim}.fbx`, (object: any) => {
      this.player[anim] = object.animations[0];
      if (anim === 'push-button') {
      this.player[anim].loop = THREE.LoopOnce;
      }
      if (this.anims.length > 0) {
      this.loadNextAnim(loader);
      } else {
      this.anims = [];
      this.action('look-around');
      this.initPlayerPosition();
      this.mode = this.modes.ACTIVE;
      const overlay = document.getElementById('overlay');
      if (overlay) {
        overlay.classList.add('fade-in');
        overlay.addEventListener('animationend', (evt: AnimationEvent) => {
        (evt.target as HTMLElement).style.display = 'none';
        }, false);
      }
      }
    }, undefined, (error: any) => {
      console.error('An error happened', error);
    });
	
  }

  initPlayerPosition(){
		//cast down
		const dir = new THREE.Vector3(0,-1,0);
		const pos = this.player.object.position.clone();
		pos.y += 200;
		const raycaster = new THREE.Raycaster(pos, dir);
		const gravity = 30;
		const box = this.environmentProxy;
		
		const intersect = raycaster.intersectObject(box);
		if (intersect.length>0){
			this.player.object.position.y = pos.y - intersect[0].distance;
		}
	}

  switchCamera(fade=0.05){

    console.log(this.player.cameras);
		const cams = Object.keys(this.player.cameras);
		cams.splice(cams.indexOf('active'), 1);
		let index;
		for(let prop in this.player.cameras){
			if (this.player.cameras[prop]==this.player.cameras.active){
				index = cams.indexOf(prop) + 1;
				if (index>=cams.length) index = 0;
				this.player.cameras.active = this.player.cameras[cams[index]];
				break;
			}
		}
		this.cameraFade = fade;
	}

  toggleBriefcase(){

    console.log("toggleBriefcase");
    const briefcase = document.getElementById("briefcase");
    const open = briefcase && parseFloat(briefcase.style.opacity) > 0;
    
    if (open){
        briefcase.style.opacity = "0";
    }else{
        briefcase!.style.opacity = "1";
    }
}

contextAction(){
  console.log('contextAction called ' + JSON.stringify(this.onAction));
  if (this.onAction !== undefined){
    if (this.onAction.action!=undefined){
      this.action(this.onAction.action);
    }
  }
  
  const game = this;
  
  if (this.onAction.mode !== undefined){
    switch(this.onAction.mode){
      case 'open-doors':
        // this.sfx.door.play();
        // this.sfx.button.play();
        const door = this.doors[this.onAction.index];
        const left = door.doors[0];
        const right = door.doors[1];
        this.cameraTarget = { position:left.position.clone(), target:left.position.clone() };
        this.cameraTarget.position.y += 150;
        this.cameraTarget.position.x -= 950;
        //target, channel, endValue, duration, oncomplete, easing="inOutQuad"){
        this.tweens.push( new Tween(left.position, "z", left.position.z - 240, 2, ()=>{
          game.tweens.splice(game.tweens.indexOf(this), 1);
        }));
        this.tweens.push( new Tween(right.position, "z", right.position.z + 240, 2, ()=>{
          game.tweens.splice(game.tweens.indexOf(this), 1);
          this.cameraTarget = null;
          const door = game.doors[this.onAction.index];
          const left = door.doors[0];
          const right = door.doors[1];
          const leftProxy = door.proxy[0];
          const rightProxy = door.proxy[1];
          leftProxy.position = left.position.clone();
          rightProxy.position = right.position.clone();
        }))

        break;
              case 'collect':
                  this.activeCamera = this.player.cameras.collect;
                  this.collect[this.onAction.index].visible = false;
                  if (this.collected==undefined) this.collected = [];
                  this.collected.push(this.onAction.index);
                  const briefcase = document.getElementById("briefcase");
                  if (briefcase && briefcase.children[0] && briefcase.children[0].children[0] && briefcase.children[0].children[0].children[this.onAction.index] && briefcase.children[0].children[0].children[this.onAction.index].children[0]) {
                    (briefcase.children[0].children[0].children[this.onAction.index].children[0] as HTMLImageElement).src = this.onAction.src;
                  }

                  console.log(this.collected);;
                  
                  break;
    }
  }
}


  //MARK: - createCameras
  createCameras(){
   
      const front = new THREE.Object3D();
      front.position.set(112, 100, 200);
      front.parent = this.player.object;
      const back = new THREE.Object3D();
      back.position.set(0, 100, -250);
      back.parent = this.player.object;
      const wide = new THREE.Object3D();
      wide.position.set(178, 139, 465);
      wide.parent = this.player.object;
      const overhead = new THREE.Object3D();
      overhead.position.set(0, 400, 0);
      overhead.parent = this.player.object;
      const collect = new THREE.Object3D();
      collect.position.set(40, 82, 94);
      collect.parent = this.player.object;
      this.player.cameras = { front, back, wide, overhead, collect };
      this.activeCamera(this.player.cameras.wide)
      this.cameraFade = 1;
      setTimeout(() => { 
        this.activeCamera(this.player.cameras.back); 
        this.cameraFade = 0.01; 
        setTimeout(() => { this.cameraFade = 0.1; }, 1500);
      }, 2000)
    
	}

  activeCamera(object:any){
		this.player.cameras.active = object;
	}


  loadEnvironment(loader:any){
		let game:any = this;
		
		loader.load( `assets/lotus/fbx/environment.fbx`, (object:any) => {
			game.scene.add(object);
			game.doors = [];
			game.fans = [];
			
			object.receiveShadow = true;
			object.scale.set(0.8, 0.8, 0.8);
			object.name = "Environment";
			let door:any = { trigger:null, proxy:[], doors:[]};
			
			object.traverse( (child:any) => {
				if ( child.isMesh ) {
					if (child.name.includes('main')){
						child.castShadow = true;
						child.receiveShadow = true;
					}else if (child.name.includes('mentproxy')){
						child.material.visible = false;
						game.environmentProxy = child;
					}else if (child.name.includes('door-proxy')){
						child.material.visible = false;
						door.proxy.push(child);
						checkDoor();
 					}else if (child.name.includes('door')){
						door.doors.push(child);
						checkDoor()
					}else if (child.name.includes('fan')){
						game.fans.push(child);
					}
				}else{
					if (child.name.includes('Door-null')){
						door.trigger = child;
						checkDoor();
					}
				}
				
				function checkDoor(){
					if (door.trigger!==null && door.proxy.length==2 && door.doors.length==2){
						game.doors.push(Object.assign({}, door));
						door = { trigger:null, proxy:[], doors:[]};
					}
				}
			} );
			
			game.loadUSB(loader);
		}, null, (err:any)=>{console.log(err)} );
	}

}
