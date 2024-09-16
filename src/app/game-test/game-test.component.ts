import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as THREE from 'three';
import * as io from 'socket.io-client';
import { GUI } from 'dat.gui';
import { OrbitControls, GLTFLoader, PointerLockControls, FirstPersonControls  } from 'three/examples/jsm/Addons.js'
import nipplejs from 'nipplejs';

@Component({
  selector: 'app-game-test',
  templateUrl: './game-test.component.html',
  styleUrls: ['./game-test.component.css']
})
export class GameTestComponent implements OnInit {

  @ViewChild('renderer2', { static: true }) rendererContainer!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  controls:any;
  clock = new THREE.Clock();


  constructor() { }

  ngOnInit() {
    this.initThree();
    this.animate()
  }


  initThree(){

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    
    this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
    this.camera.position.set(0, 1, 0);// Set camera position 0.1 units above the grid
  

    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);


    // Create a grid
    var gridHelper = new THREE.GridHelper(40, 40);
    this.scene.add(gridHelper);

    this.controls = new FirstPersonControls( this.camera, this.renderer.domElement );
    this.controls.movementSpeed = 5;
    this.controls.lookSpeed = 0.8;

  }


  animate(){
    requestAnimationFrame(() => this.animate());

    let mixerUpdateDelta = this.clock.getDelta();

    this.controls.update( mixerUpdateDelta );
    this.renderer.render(this.scene, this.camera);
  }



}
