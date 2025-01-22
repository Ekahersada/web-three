import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import {
  OrbitControls,
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

  keyStates: any = {};

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

      this.updateSpheres(deltaTime);

      this.teleportPlayerIfOob();

      if (this.tommyGun) {
        // Match tommy gun to player camera position
        // this.tommyGun.position.copy(this.camera.position);
        // this.tommyGun.rotation.copy(this.camera.rotation);
        // this.tommyGun.updateMatrix();
        // this.tommyGun.translateZ(-0.05);
        // this.tommyGun.translateY(-0.05);
        // this.tommyGun.translateX(-0.025);
        // this.tommyGun.rotateY(Math.PI / 2); // Rotate the model by 180 degrees
      }

      this.applyCameraBounce(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
  }

  //MARK:INIT SCENE
  initScene() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);

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

      setTimeout(() => {
        this.tommyGun.position.copy(this.camera.position);
        this.tommyGun.rotation.copy(this.camera.rotation);
        this.tommyGun.updateMatrix();
        this.tommyGun.translateZ(-0.05);
        this.tommyGun.translateY(-0.05);
        this.tommyGun.translateX(-0.03);
        this.tommyGun.rotateY(Math.PI / 3);
        this.tommyGun.rotation.y = -3.1;

        const gui = new GUI({ width: 300 });

        const rotationFolder = gui.addFolder('Rotation');
        rotationFolder
          .add(object.rotation, 'x', -Math.PI, Math.PI)
          .onChange((value: any) => {
            this.tommyGun.rotation.x = value;
          });
        rotationFolder
          .add(object.rotation, 'y', -Math.PI, 10)
          .onChange((value: any) => {
            this.tommyGun.rotation.y = value;
          });
        rotationFolder
          .add(object.rotation, 'z', -Math.PI, Math.PI)
          .onChange((value: any) => {
            this.tommyGun.rotation.z = value;
          });
        rotationFolder.open();

        // const scaleFolder = gui.addFolder('Scale');
        // scaleFolder.add(object.scale, 'x', -10, 2).onChange((value: any) => {
        //   this.tommyGun.scale.x = value;
        // });
        // scaleFolder.add(object.scale, 'y', -10, 2).onChange((value: any) => {
        //   this.tommyGun.scale.y = value;
        // });
        // scaleFolder.add(object.scale, 'z', -10, 2).onChange((value: any) => {
        //   this.tommyGun.scale.z = value;
        // });
        // scaleFolder.open();

        const positionFolder = gui.addFolder('Position');
        gui.add(object.position, 'x', 0.01, 10).onChange((value: any) => {
          this.tommyGun.position.x = value;
        });
        gui.add(object.position, 'y', 0.01, 10).onChange((value: any) => {
          this.tommyGun.position.y = value;
        });
        gui.add(object.position, 'z', 0.01, 10).onChange((value: any) => {
          this.tommyGun.position.z = value;
        });

        positionFolder.open();
      }, 2000);
    });
  }

  throwBall() {
    const sphere: any = this.spheres[this.sphereIdx];

    this.camera.getWorldDirection(this.playerDirection);

    sphere.collider.center
      .copy(this.playerCollider.end)
      .addScaledVector(this.playerDirection, this.playerCollider.radius * 1.5);

    // throw the ball with more force if we hold the button longer, and if we move forward

    const impulse =
      this.speed * (1 - Math.exp((this.mouseTime - performance.now()) * 0.001));

    sphere.velocity.copy(this.playerDirection).multiplyScalar(impulse);
    sphere.velocity.addScaledVector(this.playerVelocity, 2);

    this.sphereIdx = (this.sphereIdx + 1) % this.spheres.length;

    this.removeSphereAfterDelay(sphere, 2000);
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
    });
  }

  playerCollisions() {
    const result = this.worldOctree.capsuleIntersect(this.playerCollider);

    this.playerOnFloor = false;

    if (result) {
      this.playerOnFloor = result.normal.y > 0;

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
    const bounceSpeed = 5;
    const bounceHeight = 0.1;

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
}
