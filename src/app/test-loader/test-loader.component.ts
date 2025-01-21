import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import { LoadersService } from '../shared/loaders.service';

@Component({
  selector: 'app-test-loader',
  templateUrl: './test-loader.component.html',
  styleUrls: ['./test-loader.component.scss'],
})
export class TestLoaderComponent implements OnInit {
  public progress: number = 0;
  public loadingComplete: boolean = false;

  anims = [
    'ascend-stairs',
    'gather-objects',
    'look-around',
    'push-button',
    'run',
    'dancing',
    'punch',
  ];

  assets: any[] = [
    `assets/lotus/fbx/environment.fbx`,
    `assets/lotus/fbx/girl-walk.fbx`,
    `assets/lotus/fbx/usb.fbx`,
  ];

  constructor(private threeLoaderService: LoadersService) {}

  ngOnInit() {
    this.threeLoaderService.initLoader();
    this.loadTextures();
  }

  private loadTextures(): void {
    this.anims.map((anim) => this.assets.push(`assets/lotus/fbx/${anim}.fbx`));

    this.assets.forEach((url) => {
      // this.threeLoaderService.loadTexture(url).then((texture) => {
      //   console.log('Texture loaded:', texture);
      // });

      this.threeLoaderService.loadFBX(url).then((object) => {
        console.log('Object loaded:', object);
      });
    });

    this.threeLoaderService.onProgress.subscribe((progress) => {
      this.progress = progress;
    });

    this.threeLoaderService.onLoadComplete.subscribe(() => {
      this.loadingComplete = true;
    });
  }
}
