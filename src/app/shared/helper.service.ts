import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  lock: any;
  constructor() {}

  lockFrame() {
    let key = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');

    this.lock = key;
    console.log('Lock key:', key);
  }
}
