import { EventEmitter, Injectable } from '@angular/core';
import * as THREE from 'three';
import {
  OrbitControls,
  GLTFLoader,
  PointerLockControls,
  FBXLoader,
} from 'three/examples/jsm/Addons.js';

@Injectable({
  providedIn: 'root',
})
export class LoadersService {
  private loadingManager?: THREE.LoadingManager;
  private loader?: THREE.TextureLoader;
  private totalObjects: number = 0;
  private loadedObjects: number = 0;

  public onLoadComplete: EventEmitter<void> = new EventEmitter<void>();
  public onProgress: EventEmitter<number> = new EventEmitter<number>();

  constructor() {}

  initLoader() {
    this.loadingManager = new THREE.LoadingManager(
      () => {
        this.onLoadComplete.emit();
      },
      (url, itemsLoaded, itemsTotal) => {
        this.loadedObjects = itemsLoaded;
        this.totalObjects = itemsTotal;
        const progress = (itemsLoaded / itemsTotal) * 100;
        this.onProgress.emit(progress);
      }
    );

    this.loader = new THREE.TextureLoader(this.loadingManager);
  }

  public loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.loader?.load(
        url,
        (texture) => {
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  public loadFBX(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const fbxLoader = new FBXLoader(this.loadingManager);
      fbxLoader.load(
        url,
        (object) => {
          resolve(object);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  public getProgress(): number {
    return (this.loadedObjects / this.totalObjects) * 100;
  }
}
