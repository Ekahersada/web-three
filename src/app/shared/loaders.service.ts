import { EventEmitter, Injectable } from '@angular/core';
import * as THREE from 'three';
import {
  OrbitControls,
  GLTFLoader,
  OBJLoader,
  PointerLockControls,
  FBXLoader,
} from 'three/examples/jsm/Addons.js';

@Injectable({
  providedIn: 'root',
})
export class LoadersService {
  private loadingManager?: THREE.LoadingManager;
  private loader?: THREE.TextureLoader;
  private fbxLoader?: FBXLoader;
  private gltfLoader?: GLTFLoader;
  private objLoader?: OBJLoader;

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

        // this.updateProgressWithDelay(itemsLoaded, itemsTotal);
        const progress = (itemsLoaded / itemsTotal) * 100;
        this.onProgress.emit(progress);
      }
    );

    // this.loader = new THREE.TextureLoader(this.loadingManager);

    this.fbxLoader = new FBXLoader(this.loadingManager);
    this.objLoader = new OBJLoader(this.loadingManager);
    this.gltfLoader = new GLTFLoader(this.loadingManager);
  }

  private updateProgressWithDelay(itemsLoaded: number, itemsTotal: number) {
    const progress = (itemsLoaded / itemsTotal) * 100;

    // Delay untuk memperlambat pembaruan progress
    setTimeout(() => {
      this.onProgress.emit(progress);
    }, 2000); // Delay 100ms
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
      this.fbxLoader?.load(
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

  public loadOBJ(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.objLoader?.load(
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

  public loadGLTF(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader?.load(
        url,
        (object: any) => {
          resolve(object);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  public loadMultipleFbx(urls: string[]): Promise<THREE.Group[]> {
    return Promise.all(urls.map((url) => this.loadFBX(url)));
  }

  public loadMultipleObj(urls: string[]): Promise<THREE.Group[]> {
    return Promise.all(urls.map((url) => this.loadOBJ(url)));
  }

  public loadMultipleGltf(
    urls: { path: string; name: string }[]
  ): Promise<{ name: string; object: THREE.Group }[]> {
    return Promise.all(
      urls.map((url) =>
        this.loadGLTF(url.path).then((object) => ({
          name: url.name,
          object: object,
        }))
      )
    );
  }

  public getProgress(): number {
    return (this.loadedObjects / this.totalObjects) * 100;
  }
}
