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

import nipplejs from 'nipplejs';
import { LoadersService } from '../shared/loaders.service';
import { ResourcesTemp } from './resource';

@Component({
  selector: 'app-game-fps-new',
  templateUrl: './game-fps-new.component.html',
  styleUrls: ['./game-fps-new.component.css'],
})
export class GameFpsNewComponent implements OnInit {
  @ViewChild('rendererContainer2', { static: true })
  rendererContainer!: ElementRef;

  @ViewChild('joystickContainer', { static: true })
  joystickContainer!: ElementRef;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  private axesHelper!: THREE.AxesHelper;
  renderer = new THREE.WebGLRenderer();

  public progress: number = 0;
  public loadingComplete: boolean = false;

  controls: any;

  private Mainplayer!: THREE.Mesh;
  tommyGun: any;

  GRAVITY = 30;

  NUM_SPHERES = 100;
  SPHERE_RADIUS = 0.1;

  STEPS_PER_FRAME = 5;

  speed = 120;

  worldOctree = new Octree();

  sphereGeometry = new THREE.IcosahedronGeometry(this.SPHERE_RADIUS, 5);
  sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xdede8d });

  spheres: any[] = [];
  sphereIdx = 0;

  loader = new GLTFLoader();

  playerCollider = new Capsule(
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 1, 0),
    0.35
  );

  playerVelocity = new THREE.Vector3();
  playerDirection = new THREE.Vector3();

  playerOnFloor = false;

  mouseTime = 0;

  clock = new THREE.Clock();

  vector1 = new THREE.Vector3();
  vector2 = new THREE.Vector3();
  vector3 = new THREE.Vector3();

  npcVelocity = new THREE.Vector3();
  npcDirection = new THREE.Vector3();
  npcOnFloor = false;

  keyStates: any = {};

  weaponPosisiton_portal: any = {
    x: 0.032,
    y: -0.032,
    z: -0.09,
    pi: 0.04,
  };

  weaponPosisiton: any = {
    x: 0.032,
    y: -1.41,
    z: -0.09,
    pi: 0.04,
  };

  ammoCount = 24;

  isReload: boolean = false;

  npc: {
    object: any;
    capsule: any;
    meshCapsule: any;
    velocity: any;
    direction: any;
    onFloor: false;
  }[] = [];

  npcMeshCapsule: any;

  spawnPosition: boolean = false;
  kill: number = 0;

  private joystick: any;

  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } | null = null;

  meshShow: boolean = false;
  isDead: boolean = false;

  obj_glb: any[] = [];

  constructor(private LoaderService: LoadersService) {
    this.LoaderService.onProgress.subscribe((progress) => {
      this.progress = progress.toFixed(2) as any;
    });

    this.LoaderService.onLoadComplete.subscribe(() => {
      setTimeout(() => {
        this.loadingComplete = true;
        this.initScene();
        this.animate();
      }, 1000);
      // this.setupTouchControls();
    });
  }

  ngOnInit() {
    this.LoaderService.initLoader();
    this.LoaderService.loadMultipleObj(ResourcesTemp.assets_obj);
    this.LoaderService.loadMultipleFbx(ResourcesTemp.assets_fbx);
    this.LoaderService.loadMultipleGltf(ResourcesTemp.assets_glb).then(
      (res) => {
        this.obj_glb = res;
      }
    );
    this.initJoystick();
    this.setupTouchControls();

    // this.initScene();
    // this.animate();
  }

  //MARK:ANIMATE
  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime =
      Math.min(0.05, this.clock.getDelta()) / this.STEPS_PER_FRAME;

    // console.log(deltaTime);

    for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
      this.movement(deltaTime);

      this.updatePlayer(deltaTime);

      if (this.npc.length > 0) {
        this.updateNPC(deltaTime);
      }

      this.updateSpheres(deltaTime);

      // this.teleportPlayerIfOob();

      if (this.tommyGun) {
        // Match tommy gun to player camera position
        this.tommyGun.position.copy(this.camera.position);
        this.tommyGun.rotation.copy(this.camera.rotation);
        this.tommyGun.updateMatrix();
        this.tommyGun.translateZ(this.weaponPosisiton.z);
        this.tommyGun.translateY(this.weaponPosisiton.y);
        this.tommyGun.translateX(this.weaponPosisiton.x);
        this.tommyGun.rotateY(Math.PI / this.weaponPosisiton.pi);

        if (this.isReload) {
          // Apply reload effect, e.g., hide the gun or play reload animation
          this.tommyGun.translateZ(-0.01 * Math.sin(performance.now() * 0.01));
          this.tommyGun.rotateX(Math.random() * 0.1 - 0.05); // Randomly rotate the gun around the X-axis
          this.tommyGun.rotateY(Math.random() * 0.1 - 0.05); // Randomly rotate the gun around the Y-axis
          this.tommyGun.rotateZ(Math.random() * 0.1 - 0.05); // Randomly rotate the gun around the Z-axis
        }
      }

      this.applyCameraBounce(deltaTime);

      this.checkSphereNpcCollision();

      // PLAY ANIMATION NPC
      if (this.scene.children.length > 0) {
        for (let i = 0; i < this.scene.children.length; i++) {
          const child = this.scene.children[i] as any;
          if ((child as any).mixer) {
            (child as any).mixer.update(deltaTime);
          }
        }
      }

      this.randomMoveNPC(deltaTime);
      // console.log(this.kill);
      // this.npcChasePlayer(deltaTime);

      if (this.meshShow) {
        this.updateCapsuleMesh();
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  updateCapsuleMesh() {
    if (this.npc.length === 0) return;

    this.npc.forEach((npcData: any) => {
      if (npcData.meshCapsule && npcData.capsule) {
        npcData.meshCapsule.position.copy(npcData.capsule.end);
      }
    });
  }

  // MARK:HIT NPC
  checkSphereNpcCollision() {
    if (!this.npc || this.npc.length === 0) return;

    for (const npcData of this.npc) {
      for (const sphere of this.spheres) {
        const distance = sphere.collider.center.distanceTo(npcData.capsule.end);
        const combinedRadius = sphere.collider.radius + npcData.capsule.radius;

        if (distance < combinedRadius) {
          this.kill++;
          this.removeNpc(npcData);
          break;
        }
      }
    }
  }

  removeNpc(npcData?: any) {
    if (npcData && this.npc.length > 0) {
      if (npcData.object) {
        this.scene.remove(npcData.object);
        this.npc = this.npc.filter((npc) => npc !== npcData);
        console.log('NPC removed');

        // Add a new NPC after removing the old one
        setTimeout(() => {
          this.addRandomNPC(
            'assets/models/Demon.fbx',
            { x: 0.002, y: 0.002, z: 0.002 },
            'Bite_Front'
          );
        }, 2000);
      }
    }
  }

  private setupTouchControls(): void {
    const element = this.rendererContainer.nativeElement;

    element.addEventListener('touchstart', (event: TouchEvent) =>
      this.handleTouchStart(event)
    );
    element.addEventListener('touchmove', (event: TouchEvent) =>
      this.handleTouchMove(event)
    );
    element.addEventListener('touchend', (event: TouchEvent) =>
      this.handleTouchEnd(event)
    );
  }

  private handleTouchStart(event: TouchEvent): void {
    // console.log(event.touches);
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.isDragging && this.previousMousePosition) {
      const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

      console.log(deltaX, deltaY);
      // Update posisi kamera berdasarkan gerakan sentuh
      this.camera.rotation.y -= deltaX * 0.01; // Sensitivitas gerakan horizontal
      // this.camera.rotation.x -= deltaY * 0.0001; // Sensitivitas gerakan vertikal

      const newRotationX = this.camera.rotation.x - deltaY * 0.01;
      const maxRotationX = 4; // Limit for looking up
      const minRotationX = -1; // Limit for looking down

      // Apply the limits
      this.camera.rotation.x = Math.max(
        minRotationX,
        Math.min(maxRotationX, newRotationX)
      );

      // this.controls.update();

      // Simpan posisi mouse sebelumnya
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.isDragging = false;
  }

  randomMoveNPC(deltaTime: number) {
    if (!this.npc || this.npc.length === 0) return;

    const speed = 10;
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

  //NPC mengejar player
  npcChasePlayer(deltaTime: number) {
    if (!this.npc || this.npc.length === 0) return;

    const chaseSpeed = 5;
    const playerPosition = this.camera.position.clone();

    this.npc.forEach((npcData: any) => {
      const npcPosition = npcData.capsule.end.clone();
      const directionToPlayer = playerPosition.sub(npcPosition).normalize();
      const moveDistance = chaseSpeed * deltaTime;

      npcData.velocity.add(directionToPlayer.multiplyScalar(moveDistance));

      const deltaPosition = npcData.velocity.clone().multiplyScalar(deltaTime);
      npcData.capsule.translate(deltaPosition);

      this.npcCollisions(npcData);

      npcData.object.position.copy(npcData.capsule.end);
    });
  }
  //MARK:INIT SCENE
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
    // var gridHelper = new THREE.GridHelper(40, 40);
    // this.scene.add(gridHelper);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1, 0); // Set camera position 0.1 units above the grid

    // Adjust the camera's near clipping plane value
    this.camera.near = 0.015; // Set a smaller value, like 0.1
    this.camera.updateProjectionMatrix();

    for (let i = 0; i <= this.ammoCount; i++) {
      const sphere = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
      sphere.castShadow = true;
      sphere.receiveShadow = true;

      this.scene.add(sphere);

      this.spheres.push({
        mesh: sphere,
        collider: new THREE.Sphere(
          new THREE.Vector3(0, -100, 0),
          this.SPHERE_RADIUS
        ),
        velocity: new THREE.Vector3(),
      });
    }
    this.addLight();
    this.pointerLock();
    this.loadMap();
    this.loadGun();

    this.listenKeyboard();

    // setTimeout(() => {
    //   for (let i = 0; i < 20; i++) {
    //     this.addRandomNPC(
    //       'assets/models/Demon.fbx',
    //       { x: 0.002, y: 0.002, z: 0.002 },
    //       'Bite_Front'
    //     );
    //   }
    // }, 8000);
  }

  listenKeyboard() {
    document.addEventListener('keydown', (event) => {
      this.keyStates[event.code] = true;
    });

    document.addEventListener('keyup', (event) => {
      this.keyStates[event.code] = false;
    });
  }

  pointerLock() {
    // Add PointerLockControls
    this.renderer.domElement.addEventListener('click', () => {
      this.controls.lock();
    });

    document.addEventListener('mouseup', () => {
      if (document.pointerLockElement !== null) this.throwBall();
    });

    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());
  }

  //--------------------------------------MARK:MODEL ------------------//

  loadGun() {
    // const loader = new GLTFLoader();
    // loader.load('./assets/models/Gun.glb', (gltf) => {
    //   gltf.scene.scale.set(0.25, 0.25, 0.25);
    //   gltf.scene.position.set(
    //     this.camera.position.x,
    //     this.camera.position.y,
    //     this.camera.position.z - 2
    //   );
    //   const model = gltf.scene;

    //   this.tommyGun = gltf.scene;
    //   this.scene.add(model);
    // });

    // const objLoader = new OBJLoader();
    // objLoader.load('./assets/models/gun/portal-gun.obj', (object) => {
    //   object.scale.set(0.01, 0.01, 0.01);
    //   this.scene.add(object);
    //   this.tommyGun = object;
    // });

    this.loadGunMP5();
  }

  loadGunMP5() {
    const object = this.obj_glb.find((o) => o.name == 'mp5');
    if (object) {
      let obj = object.object;
      // obj.scene.scale.set(0.01, 0.01, 0.01);
      obj.scene.position.set(
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z - 2
      );
      const model = obj.scene;

      console.log(obj.scene);

      this.tommyGun = obj.scene;
      this.scene.add(model);

      const gui = new GUI({ width: 300 });

      const config = gui.addFolder('CONFIG WEAPON');
      config.add(this.weaponPosisiton, 'x', -10, 10).onChange((value: any) => {
        this.weaponPosisiton.x = value;
      });
      config.add(this.weaponPosisiton, 'y', -10, 10).onChange((value: any) => {
        this.weaponPosisiton.y = value;
      });
      config.add(this.weaponPosisiton, 'z', -10, 10).onChange((value: any) => {
        this.weaponPosisiton.z = value;
      });
      config.add(this.weaponPosisiton, 'pi', -10, 10).onChange((value: any) => {
        this.weaponPosisiton.pi = value;
      });
    }
  }

  throwBall() {
    if (this.ammoCount > 0) {
      const sphere: any = this.spheres[this.sphereIdx];
      this.ammoCount--;
      console.log(this.spheres);
      this.camera.getWorldDirection(this.playerDirection);

      sphere.collider.center
        .copy(this.playerCollider.end)
        .addScaledVector(
          this.playerDirection,
          this.playerCollider.radius * 1.5
        );

      // throw the ball with more force if we hold the button longer, and if we move forward

      const impulse =
        this.speed *
        (1 - Math.exp((this.mouseTime - performance.now()) * 0.001));

      sphere.velocity.copy(this.playerDirection).multiplyScalar(impulse);
      sphere.velocity.addScaledVector(this.playerVelocity, 2);

      this.sphereIdx = (this.sphereIdx + 1) % this.spheres.length;

      // Decrease ammo count
      this.removeSphereAfterDelay(sphere, 2000);
    } else {
      console.log('Out of ammo!');
    }
  }

  removeSphereAfterDelay(sphere: any, delay: number) {
    // setTimeout(() => {
    //   this.scene.remove(sphere.mesh);
    //   this.spheres = this.spheres.filter((s) => s !== sphere);
    // }, delay);
  }

  updateSpheres(deltaTime: any) {
    this.spheres.forEach((sphere) => {
      sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

      const result = this.worldOctree.sphereIntersect(sphere.collider);

      if (result) {
        sphere.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(sphere.velocity) * 1.5
        );
        sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
      } else {
        sphere.velocity.y -= this.GRAVITY * deltaTime;
      }

      const damping = Math.exp(-1.5 * deltaTime) - 1;
      sphere.velocity.addScaledVector(sphere.velocity, damping);

      this.playerSphereCollision(sphere);
    });

    this.spheresCollisions();

    for (const sphere of this.spheres) {
      sphere.mesh.position.copy(sphere.collider.center);
    }
  }

  spheresCollisions() {
    for (let i = 0, length = this.spheres.length; i < length; i++) {
      const s1 = this.spheres[i];

      for (let j = i + 1; j < length; j++) {
        const s2 = this.spheres[j];

        const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
        const r = s1.collider.radius + s2.collider.radius;
        const r2 = r * r;

        if (d2 < r2) {
          const normal = this.vector1
            .subVectors(s1.collider.center, s2.collider.center)
            .normalize();
          const v1 = this.vector2
            .copy(normal)
            .multiplyScalar(normal.dot(s1.velocity));
          const v2 = this.vector3
            .copy(normal)
            .multiplyScalar(normal.dot(s2.velocity));

          s1.velocity.add(v2).sub(v1);
          s2.velocity.add(v1).sub(v2);

          const d = (r - Math.sqrt(d2)) / 2;

          s1.collider.center.addScaledVector(normal, d);
          s2.collider.center.addScaledVector(normal, -d);
        }
      }
    }
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

    //

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

    // GROUND

    const groundGeo = new THREE.PlaneGeometry(10000, 10000);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    groundMat.color.setHSL(0.095, 1, 0.75);

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -33;
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  loadMap() {
    // let map = './assets/models/collision-world.glb';
    let map = './assets/models/map_tdm.glb';

    const object = this.obj_glb.find((o) => o.name == 'map');
    if (object) {
      let obj = object.object;
      this.scene.add(obj.scene);
      obj.scene.position.set(-1, -3, -5);
      obj.scene.scale.set(3.7, 5.2, 4.6);

      this.worldOctree.fromGraphNode(obj.scene);

      obj.scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material.map) {
            child.material.map.anisotropy = 4;
          }
        }
      });
    }

    // this.loader.load(map, (gltf: any) => {
    //   this.scene.add(gltf.scene);
    //   gltf.scene.position.set(-1, -3, -5);
    //   gltf.scene.scale.set(3.7, 5.2, 4.6);

    //   this.worldOctree.fromGraphNode(gltf.scene);

    //   gltf.scene.traverse((child: any) => {
    //     if (child.isMesh) {
    //       child.castShadow = true;
    //       child.receiveShadow = true;

    //       if (child.material.map) {
    //         child.material.map.anisotropy = 4;
    //       }
    //     }
    //   });

    //   const helper = new OctreeHelper(this.worldOctree);
    //   helper.visible = false;
    //   this.scene.add(helper);

    //   const gui = new GUI({ width: 300 });

    //   const mapScale = { x: 1, y: 1, z: 1 }; // Default scale values

    //   const mapFolder = gui.addFolder('Map Scale');
    //   mapFolder.add(mapScale, 'x', 0.1, 10).onChange((value: any) => {
    //     gltf.scene.scale.x = value;
    //   });
    //   mapFolder.add(mapScale, 'y', 0.1, 10).onChange((value: any) => {
    //     gltf.scene.scale.y = value;
    //   });
    //   mapFolder.add(mapScale, 'z', 0.1, 10).onChange((value: any) => {
    //     gltf.scene.scale.z = value;
    //   });
    //   mapFolder.open();

    //   const mapPosition = { x: 0, y: 0, z: 0 }; // Default position values

    //   const positionFolder = gui.addFolder('Map Position');
    //   positionFolder.add(mapPosition, 'x', -100, 100).onChange((value: any) => {
    //     gltf.scene.position.x = value;
    //   });
    //   positionFolder.add(mapPosition, 'y', -100, 100).onChange((value: any) => {
    //     gltf.scene.position.y = value;
    //   });
    //   positionFolder.add(mapPosition, 'z', -100, 100).onChange((value: any) => {
    //     gltf.scene.position.z = value;
    //   });
    //   positionFolder.open();

    //   gui.add({ debug: false }, 'debug').onChange(function (value) {
    //     helper.visible = value;
    //   });

    //   gui
    //     .add({ GRAVITY: this.GRAVITY }, 'GRAVITY', 1, 100)
    //     .onChange((value) => {
    //       this.GRAVITY = value;
    //     });

    //   gui
    //     .add({ SPEED_BULLET: this.speed }, 'SPEED_BULLET', 20, 200)
    //     .onChange((value) => {
    //       this.speed = value;
    //     });

    //   const config = gui.addFolder('CONFIG WEAPON');
    //   config.add(this.weaponPosisiton, 'x', -10, 10).onChange((value: any) => {
    //     this.weaponPosisiton.x = value;
    //   });
    //   config.add(this.weaponPosisiton, 'y', -10, 10).onChange((value: any) => {
    //     this.weaponPosisiton.y = value;
    //   });
    //   config.add(this.weaponPosisiton, 'z', -10, 10).onChange((value: any) => {
    //     this.weaponPosisiton.z = value;
    //   });
    //   config.add(this.weaponPosisiton, 'pi', -10, 10).onChange((value: any) => {
    //     this.weaponPosisiton.pi = value;
    //   });
    // });
  }

  playerCollisions() {
    const result = this.worldOctree.capsuleIntersect(this.playerCollider);

    this.playerOnFloor = false;

    if (result) {
      this.playerOnFloor = result.normal.y > 0;

      // console.log(result);

      if (!this.playerOnFloor) {
        this.playerVelocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.playerVelocity)
        );
      }

      if (result.depth >= 1e-10) {
        this.playerCollider.translate(
          result.normal.multiplyScalar(result.depth)
        );
      }

      // CASE NPC TABRAK pLAYER

      if (this.npc.length > 0) {
        const playerCenter = this.vector1
          .addVectors(this.playerCollider.start, this.playerCollider.end)
          .multiplyScalar(0.5);

        for (const npcData of this.npc) {
          const npcCenter = this.vector2
            .addVectors(npcData.capsule.start, npcData.capsule.end)
            .multiplyScalar(0.5);

          const distance = playerCenter.distanceTo(npcCenter);
          const combinedRadius =
            this.playerCollider.radius + npcData.capsule.radius;

          // if (!this.spawnPosition) {
          //   if (distance < combinedRadius) {
          //     this.isDead = true;
          //     setTimeout(() => {
          //       this.spawnPosition = true;
          //       this.teleportPlayerIfOob();
          //     }, 3000);
          //     break;
          //   }
          // }
        }
      }
    }
  }

  updatePlayer(deltaTime: any) {
    let damping = Math.exp(-4 * deltaTime) - 1;

    if (!this.playerOnFloor) {
      this.playerVelocity.y -= this.GRAVITY * deltaTime;

      // small air resistance
      damping *= 0.1;
    }

    this.playerVelocity.addScaledVector(this.playerVelocity, damping);

    const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime);
    this.playerCollider.translate(deltaPosition);

    this.playerCollisions();

    this.camera.position.copy(this.playerCollider.end);
  }

  playerSphereCollision(sphere: any) {
    const center = this.vector1
      .addVectors(this.playerCollider.start, this.playerCollider.end)
      .multiplyScalar(0.5);

    const sphere_center = sphere.collider.center;

    const r = this.playerCollider.radius + sphere.collider.radius;
    const r2 = r * r;

    // approximation: player = 3 spheres

    for (const point of [
      this.playerCollider.start,
      this.playerCollider.end,
      center,
    ]) {
      const d2 = point.distanceToSquared(sphere_center);

      if (d2 < r2) {
        const normal = this.vector1
          .subVectors(point, sphere_center)
          .normalize();
        const v1 = this.vector2
          .copy(normal)
          .multiplyScalar(normal.dot(this.playerVelocity));
        const v2 = this.vector3
          .copy(normal)
          .multiplyScalar(normal.dot(sphere.velocity));

        this.playerVelocity.add(v2).sub(v1);
        sphere.velocity.add(v1).sub(v2);

        const d = (r - Math.sqrt(d2)) / 2;
        sphere_center.addScaledVector(normal, -d);
      }
    }
  }

  movement(deltaTime: any) {
    // gives a bit of air control
    const speedDelta = deltaTime * (this.playerOnFloor ? 20 : 8);
    if (this.isDead) return;

    if (this.keyStates['KeyR']) {
      this.reloadWeapon();
    }

    if (this.keyStates['KeyF']) {
      this.teleportPlayerIfOob();
    }

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
        this.playerVelocity.y = 15;
      }
    }

    // console.log(this.keyStates);
  }

  getForwardVector() {
    this.camera.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();

    return this.playerDirection;
  }

  applyCameraBounce(deltaTime: number) {
    const bounceSpeed = 2;
    const bounceHeight = 1.5;

    if (
      this.playerOnFloor &&
      (this.keyStates['KeyW'] ||
        this.keyStates['KeyS'] ||
        this.keyStates['KeyA'] ||
        this.keyStates['KeyD'])
    ) {
      const bounce =
        Math.sin(performance.now() * 0.005 * bounceSpeed) *
        bounceHeight *
        deltaTime;
      this.tommyGun.position.y += bounce;
    }
  }

  reloadWeapon() {
    if (this.tommyGun) {
      // Play reload animation or sound here if available
      console.log('Reloading weapon...');
      this.isReload = true;

      this.spheres = [];

      for (let i = 0; i <= 24; i++) {
        const sphere = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
        sphere.castShadow = true;
        sphere.receiveShadow = true;

        this.scene.add(sphere);

        this.spheres.push({
          mesh: sphere,
          collider: new THREE.Sphere(
            new THREE.Vector3(0, -100, 0),
            this.SPHERE_RADIUS
          ),
          velocity: new THREE.Vector3(),
        });
      }

      // Simulate reload time
      setTimeout(() => {
        console.log('Weapon reloaded');
        this.ammoCount = 24;
        this.isReload = false;
        // Reset ammo count or any other necessary state here
      }, 2000); // Example reload time of 2 seconds
    }
  }

  getSideVector() {
    this.camera.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();
    this.playerDirection.cross(this.camera.up);

    return this.playerDirection;
  }

  teleportPlayerIfOob() {
    // if (this.camera.position.y <= -25) {
    this.playerCollider.start.set(0, 0.35, 0);
    this.playerCollider.end.set(0, 1, 0);
    this.playerCollider.radius = 0.35;
    this.camera.position.copy(this.playerCollider.end);
    this.camera.rotation.set(0, 0, 0);
    this.kill = 0;

    // const randomX = Math.random() * 10 - 10; // Random x position between -50 and 50
    // const randomZ = Math.random() * 10 - 10; // Random z position between -50 and 50
    // this.playerCollider.start.set(randomX, 0.35, randomZ);
    // this.playerCollider.end.set(randomX, 1, randomZ);
    // this.camera.position.copy(this.playerCollider.end);

    this.isDead = false;
    setTimeout(() => {
      this.spawnPosition = false;
    }, 3000);
    // }
  }

  // MARK:ADD NPC
  addRandomNPC(
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
        onFloor: false,
      });

      this.playAnimation(animation, npc);
      this.scene.add(npc);
    });
  }

  //MARK:UPDATE NPC
  updateNPC(deltaTime: any) {
    if (!this.npc || this.npc.length === 0) return;

    this.npc.forEach((npcData: any) => {
      let damping = Math.exp(-4 * deltaTime) - 1;

      if (!npcData.onFloor) {
        npcData.velocity.y -= 2 * deltaTime;

        // small air resistance
        damping *= 0.003;
      }

      npcData.velocity.addScaledVector(npcData.velocity, damping);

      const deltaPosition = npcData.velocity.clone().multiplyScalar(deltaTime);
      npcData.capsule.translate(deltaPosition);

      this.npcCollisions(npcData);

      npcData.object.position.copy(npcData.capsule.end);
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
    console.log(activeKeys);
    this.keyStates['KeyW'] = activeKeys.includes('w');
    this.keyStates['KeyS'] = activeKeys.includes('s');
    this.keyStates['KeyA'] = activeKeys.includes('a');
    this.keyStates['KeyD'] = activeKeys.includes('d');
  }
}
