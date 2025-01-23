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

  controls: any;

  private Mainplayer!: THREE.Mesh;
  tommyGun: any;

  GRAVITY = 30;

  NUM_SPHERES = 100;
  SPHERE_RADIUS = 0.1;

  STEPS_PER_FRAME = 5;

  speed = 70;

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

  weaponPosisiton: any = {
    x: 0.032,
    y: -0.032,
    z: -0.09,
    pi: 0.04,
  };

  ammoCount = 24;

  isReload: boolean = false;

  npc_capsule: any;

  npc: any;

  npcMeshCapsule: any;

  constructor() {}

  ngOnInit() {
    this.initScene();
    this.animate();
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

      if (this.npc && this.npc_capsule) {
        this.updateNPC(deltaTime);
      }

      this.updateSpheres(deltaTime);

      this.teleportPlayerIfOob();

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
          this.tommyGun.translateZ(-0.04 * Math.sin(performance.now() * 0.01));
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

      // this.randomMoveNPC(deltaTime);
      this.npcChasePlayer(deltaTime);
      this.updateCapsuleMesh();
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateCapsuleMesh() {
    if (this.npcMeshCapsule && this.npc_capsule) {
      this.npcMeshCapsule.position.copy(this.npc_capsule.end);

      // console.log(this.npc_capsule.end);
    }
  }

  // MARK:HIT NPC
  checkSphereNpcCollision() {
    if (!this.npc || !this.npc_capsule) return;

    for (const sphere of this.spheres) {
      const distance = sphere.collider.center.distanceTo(this.npc_capsule.end);
      const combinedRadius = sphere.collider.radius + this.npc_capsule.radius;

      if (distance < combinedRadius) {
        this.removeNpc();
        break;
      }
    }
  }

  removeNpc() {
    if (this.npc) {
      this.scene.remove(this.npc);
      this.npc = null;
      this.npc_capsule = null;
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

  randomMoveNPC(deltaTime: number) {
    if (!this.npc || !this.npc_capsule) return;

    const speed = 8;
    const directionChangeProbability = 0.05;

    if (Math.random() < directionChangeProbability) {
      const angle = Math.random() * 2 * Math.PI;
      this.npcDirection.set(Math.cos(angle), 0, Math.sin(angle));
    }

    const moveDistance = speed * deltaTime;
    this.npcVelocity.add(
      this.npcDirection.clone().multiplyScalar(moveDistance)
    );

    const deltaPosition = this.npcVelocity.clone().multiplyScalar(deltaTime);
    this.npc_capsule.translate(deltaPosition);

    this.npcCollisions();

    this.npc.position.copy(this.npc_capsule.end);
  }

  npcChasePlayer(deltaTime: number) {
    if (!this.npc || !this.npc_capsule) return;

    const chaseSpeed = 5;
    const playerPosition = this.camera.position.clone();
    const npcPosition = this.npc_capsule.end.clone();

    const directionToPlayer = playerPosition.sub(npcPosition).normalize();
    const moveDistance = chaseSpeed * deltaTime;

    this.npcVelocity.add(directionToPlayer.multiplyScalar(moveDistance));

    const deltaPosition = this.npcVelocity.clone().multiplyScalar(deltaTime);
    this.npc_capsule.translate(deltaPosition);

    this.npcCollisions();

    this.npc.position.copy(this.npc_capsule.end);
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

    this.pointerLock();
    this.loadGun();

    for (let i = 0; i < this.NUM_SPHERES; i++) {
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

    this.loadMap();
    this.addLight();

    this.listenKeyboard();

    this.addRandomNPC(
      'assets/models/Demon.fbx',
      { x: 0.002, y: 0.002, z: 0.002 },
      'Bite_Front'
    );
    // for (let i = 0; i < 10; i++) {
    // }
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

    const objLoader = new OBJLoader();
    objLoader.load('./assets/models/gun/portal-gun.obj', (object) => {
      object.scale.set(0.01, 0.01, 0.01);
      this.scene.add(object);
      this.tommyGun = object;
    });
  }

  throwBall() {
    if (this.ammoCount > 0) {
      const sphere: any = this.spheres[this.sphereIdx];

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

      this.ammoCount--; // Decrease ammo count
      this.removeSphereAfterDelay(sphere, 2000);
    } else {
      console.log('Out of ammo!');
    }
  }

  removeSphereAfterDelay(sphere: any, delay: number) {
    setTimeout(() => {
      this.scene.remove(sphere.mesh);
      this.spheres = this.spheres.filter((s) => s !== sphere);
    }, delay);
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
    this.loader.load('./assets/models/collision-world.glb', (gltf: any) => {
      this.scene.add(gltf.scene);

      this.worldOctree.fromGraphNode(gltf.scene);

      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material.map) {
            child.material.map.anisotropy = 4;
          }
        }
      });

      const helper = new OctreeHelper(this.worldOctree);
      helper.visible = false;
      this.scene.add(helper);

      const gui = new GUI({ width: 300 });
      gui.add({ debug: false }, 'debug').onChange(function (value) {
        helper.visible = value;
      });

      gui
        .add({ GRAVITY: this.GRAVITY }, 'GRAVITY', 1, 100)
        .onChange((value) => {
          this.GRAVITY = value;
        });

      gui
        .add({ SPEED_BULLET: this.speed }, 'SPEED_BULLET', 20, 200)
        .onChange((value) => {
          this.speed = value;
        });

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
    });
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

    if (this.keyStates['KeyR']) {
      this.reloadWeapon();
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
    if (this.camera.position.y <= -25) {
      this.playerCollider.start.set(0, 0.35, 0);
      this.playerCollider.end.set(0, 1, 0);
      this.playerCollider.radius = 0.35;
      this.camera.position.copy(this.playerCollider.end);
      this.camera.rotation.set(0, 0, 0);
    }
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
      // npc.position.set(
      //   Math.random() * 100 - 50, // Random x position between -50 and 50
      //   0, // y position
      //   Math.random() * 100 - 50 // Random z position between -50 and 50
      // );
      // npc.scale.set(scale.x, scale.y, scale.z);
      // npc.animations = object.animations;

      npc.position.set(0, 0, 0);
      npc.scale.set(scale.x, scale.y, scale.z);
      npc.animations = object.animations;

      this.npc_capsule = new Capsule(
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
      npcCapsuleMesh.position.copy(this.npc_capsule.end);
      this.scene.add(npcCapsuleMesh);
      this.npcMeshCapsule = npcCapsuleMesh;

      this.npc = npc;
      this.playAnimation(animation, npc);
      this.scene.add(npc);
    });
  }

  //MARK:UPDATE NPC
  updateNPC(deltaTime: any) {
    let damping = Math.exp(-4 * deltaTime) - 1;

    if (!this.npcOnFloor) {
      this.npcVelocity.y -= 2 * deltaTime;

      // small air resistance
      damping *= 0.003;
    }

    this.npcVelocity.addScaledVector(this.npcVelocity, damping);

    const deltaPosition = this.npcVelocity.clone().multiplyScalar(deltaTime);
    this.npc_capsule.translate(deltaPosition);

    this.npcCollisions();

    this.npc.position.copy(this.npc_capsule.end);
  }

  npcCollisions() {
    if (!this.npc_capsule) return;

    const result = this.worldOctree.capsuleIntersect(this.npc_capsule);

    this.npcOnFloor = false;

    if (result) {
      this.npcOnFloor = result.normal.y > 0;

      if (!this.npcOnFloor) {
        this.npcVelocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.npcVelocity)
        );
      }

      // console.log(result.depth);
      if (result.depth >= 1e-10) {
        this.npc_capsule.translate(result.normal.multiplyScalar(result.depth));
      }
      // this.npc_capsule.translate(result.normal.multiplyScalar(result.depth));
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
}
