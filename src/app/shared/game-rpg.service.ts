import { Injectable } from '@angular/core';
import * as THREE from 'three';


@Injectable({
  providedIn: 'root'
})
export class GameRpgService {

constructor() { }

onCharacterHit(health:number,damage: number) {
  health = Math.max(health - damage, 0);
  return health;
}


 drawHealthBar(context: CanvasRenderingContext2D, healthPercentage: number) {
  context.clearRect(0, 0, 128, 16);
  context.fillStyle = 'grey';
  context.fillRect(0, 0, 128, 16);

  context.fillStyle = 'green';
  context.fillRect(0, 0, (128 * healthPercentage) / 100, 16);

  context.strokeStyle = 'black';
  context.strokeRect(0, 0, 128, 16);
}

 createHealthBarSprite(health?:any) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const context = canvas.getContext('2d')!;
  this.drawHealthBar(context, health ? health : 0); // Menggambar health bar penuh (100%)
    let bar:any;
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  bar = new THREE.Sprite(spriteMaterial);

  bar.scale.set(2, 0.25, 1); // Sesuaikan skala sprite
  bar.position.set(0, 2.5, 0); // Posisi di atas pemain

  return bar;
  // this.character.add(this.healthBarSprite); // Tambahkan sprite ke karakter
}

updateHealth(sprite:THREE.Sprite ,health: any) {

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const context = canvas.getContext('2d')!;
 
   // Bersihkan canvas sebelumnya dan gambar teks baru
   context!.clearRect(0, 0, canvas.width, canvas.height);

  this.drawHealthBar(context, Number(health));

  const texture = new THREE.CanvasTexture(canvas);
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;

    sprite.scale.set(2, 0.25, 1); // Sesuaikan skala sprite

}


}
