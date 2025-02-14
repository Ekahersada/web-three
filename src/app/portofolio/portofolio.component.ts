import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import SplitType from 'split-type';

//  declare var SplitType: any;

@Component({
  selector: 'app-portofolio',
  templateUrl: './portofolio.component.html',
  styleUrls: ['./portofolio.component.scss'],
})
export class PortofolioComponent implements OnInit {
  private sphere: THREE.Mesh | undefined;
  private renderer: THREE.WebGLRenderer | undefined;
  private scene: THREE.Scene | undefined;
  private camera: THREE.PerspectiveCamera | undefined;
  // private camera: THREE.OrthographicCamera | undefined;

  constructor() {}

  ngOnInit() {
    gsap.registerPlugin(ScrollTrigger);

    this.initThreeJS();
    this.animateSections();
  }

  private initThreeJS(): void {
    const container = document.getElementById('three-canvas-container')!;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth - 29, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // const aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera(-aspect * 10, aspect * 10, 10, -10, 0.1, 1000);
    // this.camera.position.z = 1;

    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);

    this.animate();
    this.onWindowResize();
    this.loadAssets();
  }

  loadAssets() {
    const loader = new SVGLoader();

    loader.load(
      './assets/textures/SVG/cloud_01.svg',
      (data) => {
        const paths = data.paths;
        const group = new THREE.Group();

        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];

          const material = new THREE.MeshBasicMaterial({
            color: path.color,
            side: THREE.DoubleSide,
            depthWrite: false,
          });

          const shapes = SVGLoader.createShapes(path);

          for (let j = 0; j < shapes.length; j++) {
            const shape = shapes[j];
            const geometry = new THREE.ShapeGeometry(shape);
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
          }
        }

        this.scene!.add(group);

        console.log(group);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      }
    );
  }

  onWindowResize() {
    window.addEventListener('resize', () => {
      this.renderer!.setSize(window.innerWidth, window.innerHeight);
      this.camera!.aspect = window.innerWidth / window.innerHeight;
      this.camera!.updateProjectionMatrix();
    });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    if (this.sphere) {
      // You can add additional animations here

      this.sphere.rotation.y -= 10;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private animateSections(): void {
    gsap.from('.welcome-section h1', { opacity: 0, y: -50, duration: 1.5 });

    gsap.from('.data-about', {
      opacity: 0,
      y: 100,
      // duration: 1,
      stagger: 1,
      ease: 'power2.out',
      scrollTrigger: {
        // markers:true,
        trigger: '.about-section',
        start: 'top 80%',
        scrub: 3,
      },
    });

    gsap.from('.contact-section', {
      opacity: 0,
      y: 100,
      duration: 1,
      scrollTrigger: {
        trigger: '.contact-section',
        start: 'top 80%',
      },
    });

    // Scroll-triggered mesh animation
    gsap.to(this.sphere!.position, {
      // x: Math.PI * 2,  // Rotate 360 degrees
      // y: Math.PI * 2,
      z: Math.PI * 2,
      scrollTrigger: {
        trigger: '.about-section', // Start animation when ".about-section" enters the viewport
        start: 'top 100%',
        end: 'top 20%',
        scrub: true, // Sync animation with scroll
      },
    });

    gsap.to(this.camera!.position, {
      z: 10,
      scrollTrigger: {
        trigger: '.contact-section',
        start: 'top 80%',
        end: 'top 20%',
        scrub: true,
      },
    });

    document.querySelectorAll('.split-type').forEach((char: any) => {
      const text = new SplitType(char, { types: ['chars', 'words'] });

      console.log(text);
      gsap.from(text.chars, {
        opacity: 0.2,
        // y: 100,
        // duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.contact-section',
          start: 'top 40%',
          end: 'top 10%',
          scrub: true,
          // markers: true,
        },
      });
    });
  }
}
