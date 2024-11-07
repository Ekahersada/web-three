import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls, GLTFLoader, PointerLockControls  } from 'three/examples/jsm/Addons.js';

@Component({
  selector: 'app-game-new-rpg',
  templateUrl: './game-new-rpg.component.html',
  styleUrls: ['./game-new-rpg.component.css']
})
export class GameNewRpgComponent implements OnInit {
  @ViewChild('rendererContainer2', { static: true }) rendererContainer!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  constructor() { }

  ngOnInit() {
  }

}
