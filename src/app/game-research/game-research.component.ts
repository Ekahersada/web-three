import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import nipplejs from 'nipplejs';

import {
  OrbitControls,
  FBXLoader,
  GLTFLoader,
  Octree,
  OctreeHelper,
  OBJLoader,
  MTLLoader,
  Capsule,
  PointerLockControls,
} from 'three/examples/jsm/Addons.js';
import { GUI } from 'dat.gui';
import { HelperService } from '../shared/helper.service';

@Component({
  selector: 'app-game-research',
  templateUrl: './game-research.component.html',
  styleUrls: ['./game-research.component.css'],
})
export class GameResearchComponent implements OnInit {
  @ViewChild('rendererContainer2', { static: true })
  rendererContainer!: ElementRef;

  @ViewChild('joystickContainer', { static: true })
  joystickContainer!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  axesHelper: any;

  playerCollider: any;
  playerCapsule: any;

  playerVelocity = new THREE.Vector3();
  playerDirection = new THREE.Vector3();

  playerOnFloor = true;

  keyStates: any = {};

  GRAVITY = 30;

  STEPS_PER_FRAME = 5;
  clock = new THREE.Clock();

  private controls!: OrbitControls;
  private joystick: any;

  worldOctree = new Octree();
  maxJumpHeight = 8;

  npc: any[] = [];

  freeCamera = false;

  constructor(private helper: HelperService) {}

  ngOnInit() {
    if (this.helper.lock) {
      window.location.reload();
    }
    this.helper.lockFrame();

    this.initScene();
    this.animate();
    this.initJoystick();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // this.controls.update();

    const deltaTime =
      Math.min(0.05, this.clock.getDelta()) / this.STEPS_PER_FRAME;
    for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
      if (this.playerCapsule) {
        this.movement(deltaTime);
        this.updatePlayer(deltaTime);
        this.updateCameraOrbit();

        // this.npcChasePlayer(deltaTime);
      }

      if (this.npc.length > 0) {
        // this.randomMoveNPC(deltaTime);
        this.npc.forEach((npcData) => {
          if (npcData.object.mixer) {
            npcData.object.mixer.update(deltaTime);
          }
        });
      }
    }

    // this.playerCapsule.position.copy(this.playerCollider.end);
    this.renderer.render(this.scene, this.camera);
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
    // var gridHelper = new THREE.GridHelper(40, 40);
    // this.scene.add(gridHelper);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // this.camera.position.set(0, 1, 0); // Set camera position 0.1 units above the grid
    this.camera.position.set(4, 4, 0);

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
    this.camera.near = 0.003; // Set a smaller value, like 0.1
    this.camera.updateProjectionMatrix();

    this.addLight();
    this.setup();
  }

  addLight() {
    // LIGHTS

    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const directionalLightHelper = new THREE.DirectionalLightHelper(
      directionalLight,
      5
    );
    this.scene.add(directionalLightHelper);

    // const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
    // hemiLight.color.setHSL(0.6, 1, 0.6);
    // hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    // hemiLight.position.set(0, 50, 0);
    // this.scene.add(hemiLight);

    // const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
    // this.scene.add(hemiLightHelper);

    //

    // const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    // dirLight.color.setHSL(0.1, 1, 0.95);
    // dirLight.position.set(-1, 1.75, 1);
    // dirLight.position.multiplyScalar(30);
    // this.scene.add(dirLight);

    // dirLight.castShadow = true;

    // dirLight.shadow.mapSize.width = 2048;
    // dirLight.shadow.mapSize.height = 2048;

    // const d = 50;

    // dirLight.shadow.camera.left = -d;
    // dirLight.shadow.camera.right = d;
    // dirLight.shadow.camera.top = d;
    // dirLight.shadow.camera.bottom = -d;

    // dirLight.shadow.camera.far = 3500;
    // dirLight.shadow.bias = -0.0001;

    // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
    // this.scene.add(dirLightHelper);

    // GROUND

    // const groundGeo = new THREE.PlaneGeometry(10000, 10000);
    // const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    // groundMat.color.setHSL(0.095, 1, 0.75);

    // const ground = new THREE.Mesh(groundGeo, groundMat);
    // ground.position.y = -33;
    // ground.rotation.x = -Math.PI / 2;
    // ground.receiveShadow = true;
    // this.scene.add(ground);
  }

  setup() {
    // this.generateFloor();
    this.loadMap();

    setTimeout(() => {
      this.setuPlayer();
      this.addMorePlayer();
    }, 1000);
    this.listenKeyboard();

    this.addNPC(
      'assets/models/Demon.fbx',
      { x: 0.002, y: 0.002, z: 0.002 },
      'Bite_Front'
    );
  }

  // MARK:Update camera orbit
  updateCameraOrbit() {
    const offset = new THREE.Vector3(20, 18, 0); // Adjust the offset as needed
    const desiredPosition = this.playerCollider.start.clone().add(offset);
    if (!this.freeCamera) {
      this.camera.position.lerp(desiredPosition, 0.2); // Smoothly interpolate to the desired position
    }
    this.camera.lookAt(this.playerCollider.start); // Make the camera look at the player

    // Allow free pan and zoom
    this.controls.target.copy(this.playerCollider.start);
    this.controls.update();
  }

  setuPlayer() {
    this.playerCollider = new Capsule(
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0, 1, 0),
      0.35
    );

    const capsuleGeometry = new THREE.CapsuleGeometry(0.35, 0.65, 8, 16);
    const capsuleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
    });
    const capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
    capsuleMesh.position.copy(this.playerCollider.start);
    this.scene.add(capsuleMesh);

    // const npcCapsuleGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.65, 8);
    // const npcCapsuleMaterial = new THREE.MeshBasicMaterial({
    //   color: 0xff0000,
    //   wireframe: true,
    // });
    // const npcCapsuleMesh = new THREE.Mesh(
    //   npcCapsuleGeometry,
    //   npcCapsuleMaterial
    // );
    // npcCapsuleMesh.position.copy(this.playerCollider.start);
    this.playerCapsule = capsuleMesh;
    // this.scene.add(npcCapsuleMesh);
  }

  addNPC(
    modelPath: string,
    scale: { x: number; y: number; z: number },
    animation: string
  ) {
    const loader = new FBXLoader();
    loader.load(modelPath, (object: any) => {
      object.mixer = new THREE.AnimationMixer(object);

      object.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const npc = object;

      // npc.position.set(0, 0, 0);
      npc.scale.set(scale.x, scale.y, scale.z);
      npc.animations = object.animations;

      const npcCapsule = new Capsule(
        new THREE.Vector3(0, 0.35, 0),
        new THREE.Vector3(0, 1, 0),
        0.35
      );

      const npcCapsuleGeometry = new THREE.CylinderGeometry(
        0.35,
        0.35,
        0.65,
        8
      );
      const npcCapsuleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
      });
      const npcCapsuleMesh = new THREE.Mesh(
        npcCapsuleGeometry,
        npcCapsuleMaterial
      );
      npcCapsuleMesh.position.copy(npcCapsule.end);

      // this.scene.add(npcCapsuleMesh);

      this.npc = this.npc || [];
      this.npc.push({
        object: npc,
        capsule: npcCapsule,
        meshCapsule: npcCapsuleMesh,
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        onFloor: true,
      });

      this.scene.add(npc);
      this.playAnimation(animation, npc);
    });
  }

  //MARK: - Add More Player /NPC
  addMorePlayer() {
    const capsuleGeometry = new THREE.CapsuleGeometry(0.35, 0.65, 8, 16);
    const capsuleMaterial = new THREE.MeshBasicMaterial({
      color: Math.random() * 0xffffff,
      wireframe: true,
    });
    const capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
    capsuleMesh.position.copy(this.playerCollider.start).set(0, 0.5, 5);
    this.scene.add(capsuleMesh);
    this.worldOctree.fromGraphNode(capsuleMesh);
  }

  playAnimation(name: string, model: any) {
    if (!model || !model.mixer) {
      console.error('Model or mixer not loaded');
      return;
    }

    const clip = model.animations.find((clip: any) => clip.name.includes(name));
    if (clip) {
      const action = model.mixer.clipAction(clip);
      action.reset().play();
    } else {
    }
  }

  loadTextureForObj(obj: THREE.Object3D, texturePath: string) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(texturePath);

    obj.traverse((child: any) => {
      if (child.isMesh) {
        child.material.map = texture;
        child.material.needsUpdate = true;
      }
    });
  }

  loadMap() {
    // let map = './assets/models/collision-world.glb';
    let map = './assets/models/map_town/Town Map A.obj';

    const mtlLoader = new MTLLoader();
    mtlLoader.load('./assets/models/map_town/Town Map A.mtl', (materials) => {
      materials.preload();
      const loader = new OBJLoader();
      loader.setMaterials(materials);
      loader.load(map, (object) => {
        if (object) {
          let obj = object;
          this.scene.add(obj);
          obj.position.set(0, 0, -10);
          obj.scale.set(3.7, 5.2, 4.6);
          obj.rotateY(1.6);

          const gui = new GUI();
          const positionFolder = gui.addFolder('Position');
          positionFolder.add(obj.position, 'x', -10, 10);
          positionFolder.add(obj.position, 'y', -10, 10);
          positionFolder.add(obj.position, 'z', -10, 10);
          // positionFolder.open();

          const rotationFolder = gui.addFolder('Rotation');
          rotationFolder.add(obj.rotation, 'x', 0, Math.PI * 2);
          rotationFolder.add(obj.rotation, 'y', 0, Math.PI * 2);
          rotationFolder.add(obj.rotation, 'z', 0, Math.PI * 2);
          // rotationFolder.open();

          this.worldOctree.fromGraphNode(obj);

          obj.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              if (child.material.map) {
                child.material.map.anisotropy = 4;
              }
            }
          });
        }
      });
    });
  }

  generateFloor() {
    // Create a floor
    var floorGeometry = new THREE.PlaneGeometry(40, 40);
    var floorMaterial = new THREE.MeshBasicMaterial({ color: 0x303030 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -0.5 * Math.PI; // Rotate the floor 90 degrees
    floor.position.y = -0.01; // Set the floor position

    this.worldOctree.fromGraphNode(floor);

    // Create a box
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 0.5, 2); // Set the box position

    this.worldOctree.fromGraphNode(box);

    // Add the box to the scene
    this.scene.add(box);

    // Add the floor to the scene
    this.scene.add(floor);
  }

  onResize(event: Event) {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  //MARK: - Keyboard
  listenKeyboard() {
    document.addEventListener('keydown', (event) => {
      this.keyStates[event.code] = true;
    });

    document.addEventListener('keyup', (event) => {
      this.keyStates[event.code] = false;
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

    this.joystick.on('end', (event: any) => {
      // this.triggerAction(null);

      this.updateDirectionStatus([]);
    });
  }

  updateDirectionStatus(activeKeys: any) {
    this.keyStates['KeyW'] = activeKeys.includes('w');
    this.keyStates['KeyS'] = activeKeys.includes('s');
    this.keyStates['KeyA'] = activeKeys.includes('a');
    this.keyStates['KeyD'] = activeKeys.includes('d');
  }

  Jumpt() {
    this.keyStates['Space'] = true;
    setTimeout(() => {
      this.keyStates['Space'] = false;
    }, 100);
  }

  //MARK: - Movement
  movement(deltaTime: any) {
    // gives a bit of air control
    const speedDelta = deltaTime * (this.playerOnFloor ? 15 : 6);

    if (this.keyStates['KeyW']) {
      this.playerVelocity.add(
        this.getForwardVector().multiplyScalar(speedDelta)
      );
    }

    if (this.keyStates['KeyS']) {
      this.playerVelocity.add(
        this.getForwardVector().multiplyScalar(-speedDelta)
      );
    }

    if (this.keyStates['KeyA']) {
      this.playerVelocity.add(this.getSideVector().multiplyScalar(-speedDelta));
    }

    if (this.keyStates['KeyD']) {
      this.playerVelocity.add(this.getSideVector().multiplyScalar(speedDelta));
    }

    if (this.playerOnFloor) {
      if (this.keyStates['Space']) {
        this.playerVelocity.y = this.maxJumpHeight;
      }
    }
  }

  getForwardVector() {
    this.camera.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();

    return this.playerDirection;
  }

  getSideVector() {
    this.camera.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();
    this.playerDirection.cross(this.camera.up);

    return this.playerDirection;
  }

  //MARK: - Player
  updatePlayer(deltaTime: any) {
    let damping = -2 * deltaTime;
    if (!this.playerOnFloor) {
      this.playerVelocity.y -= this.GRAVITY * deltaTime;

      // small air resistance
      damping *= 0.01;
    }

    this.playerVelocity.addScaledVector(this.playerVelocity, damping);

    const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime);
    this.playerCollider.translate(deltaPosition);

    this.playerCollisions();

    this.playerCapsule.position.copy(this.playerCollider.start);
  }

  //MARK: - Player Collisions
  playerCollisions() {
    const result = this.worldOctree.capsuleIntersect(this.playerCollider);

    // console.log(result);

    if (result) {
      this.playerOnFloor = true;
      this.playerVelocity.y = 0;

      if (result.depth >= 1e-10) {
        this.playerCollider.translate(
          result.normal.multiplyScalar(result.depth)
        );
      }
    } else {
      this.playerOnFloor = false;
    }
  }

  //MARK: - NPC
  randomMoveNPC(deltaTime: number) {
    if (!this.npc || this.npc.length === 0) return;

    const speed = 2;
    const directionChangeInterval = 2; // Change direction every 2 seconds
    const directionChangeProbability = 0.02; // Probability of changing direction

    this.npc.forEach((npcData: any) => {
      if (!npcData.lastDirectionChangeTime) {
        npcData.lastDirectionChangeTime = performance.now();
      }

      const timeSinceLastChange =
        performance.now() - npcData.lastDirectionChangeTime;

      if (
        timeSinceLastChange > directionChangeInterval * 1000 ||
        Math.random() < directionChangeProbability
      ) {
        const angle = Math.random() * 2 * Math.PI;
        npcData.direction.set(Math.cos(angle), 0, Math.sin(angle));
        npcData.lastDirectionChangeTime = performance.now();
      }

      const moveDistance = speed * deltaTime;
      npcData.velocity.add(
        npcData.direction.clone().multiplyScalar(moveDistance)
      );

      const deltaPosition = npcData.velocity.clone().multiplyScalar(deltaTime);
      npcData.capsule.translate(deltaPosition);

      this.npcCollisions(npcData);

      npcData.object.position.copy(npcData.capsule.end);

      // Rotate NPC to face the direction of movement
      if (npcData.direction.length() > 0) {
        const targetRotation = Math.atan2(
          npcData.direction.x,
          npcData.direction.z
        );
        npcData.object.rotation.y = targetRotation;
      }
    });
  }

  npcCollisions(npcData: any) {
    if (!npcData || !npcData.capsule) return;

    const result = this.worldOctree.capsuleIntersect(npcData.capsule);

    npcData.onFloor = false;

    if (result) {
      npcData.onFloor = result.normal.y > 0;

      if (!npcData.onFloor) {
        npcData.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(npcData.velocity)
        );
      }

      if (result.depth >= 1e-10) {
        npcData.capsule.translate(result.normal.multiplyScalar(result.depth));
      }
    }
  }

  //NPC mengejar player
  npcChasePlayer(deltaTime: number) {
    if (!this.npc || this.npc.length === 0) return;

    const chaseSpeed = 5;
    const playerPosition = this.playerCapsule.position.clone();

    this.npc.forEach((npcData: any) => {
      const npcPosition = npcData.capsule.start.clone();
      const directionToPlayer = playerPosition.sub(npcPosition).normalize();
      const moveDistance = chaseSpeed * deltaTime;

      npcData.velocity.add(directionToPlayer.multiplyScalar(moveDistance));

      const deltaPosition = npcData.velocity.clone().multiplyScalar(deltaTime);
      npcData.capsule.translate(deltaPosition);

      this.npcCollisions(npcData);
      // npcData.object.lookAt(playerPosition);

      npcData.object.position.copy(npcData.capsule.start);
    });
  }
}
