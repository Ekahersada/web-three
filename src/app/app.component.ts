import { AfterViewInit, Component, HostListener } from '@angular/core';

import * as THREE from 'three';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'web-three';

  camera:any;
  renderer:any;
  scene:any;
  mesh:any;

  constructor(
    // private window:Window
  ){

  }

  ngAfterViewInit(): void {


// const width = window.innerWidth, height = window.innerHeight;

// // init


// //setting camera
// this.camera = new THREE.PerspectiveCamera( 45, width / height, 0.01, 10 );
// this.camera.position.z = 5;

// this.scene = new THREE.Scene();

// const geometry = new THREE.SphereGeometry( 0.2, 0.2, 0.2 );
// const material = new THREE.MeshNormalMaterial();

// this.mesh = new THREE.Mesh( geometry, material );
// // const mesh2 = new THREE.Mesh( geometry, material );
// this.mesh.position.set(0,0.5,0);
// this.scene.add( this.mesh );
// // scene.add( mesh2 );

// this.renderer = new THREE.WebGLRenderer( { antialias: true } );
// this.renderer.setSize( width, height );
// this.renderer.setAnimationLoop( this.animate );
// document.body.appendChild( this.renderer.domElement );

// window.addEventListener('resize', ()=>{
//   this.renderer.setSize( this.window.innerWidth, this.window.innerHeight );
//   this.camera.aspect = this.window.innerWidth / this.window.innerHeight;
//   this.camera.updateProjectionMatrix();
// })



  // function animate( time:number ) {

  //   mesh.rotation.x = time / 2000;
  //   mesh.rotation.y = time / 1000;
  //   // mesh2.rotation.y = time / 1000;

  //   let camera = this.camera
  //   rendererer.renderer( scene,  );

  // }

}


// private animate = () => {
//   // requestAnimationFrame(this.animate);

//   // // Rotate the cube
//   // this.cube.rotation.x += 0.01;
//   // this.cube.rotation.y += 0.01;

//   // Render the scene
//   this.renderer.render(this.scene, this.camera);
// };


//-----------------Controls --------------//
// @HostListener('document:keydown', ['$event'])
// handleKeyboardEvent(event: KeyboardEvent) {
//   console.log(event.key);

//   let key = event.key;

//   if(key == 'ArrowRight'){
//     this.camera.position.x += 0.03;
//   }

//   if(key == 'ArrowLeft'){
//     this.camera.position.x -= 0.03;
//   }
// }



}
