export class City {
  private data: any[] = [];

  constructor() {}

  createCity(size: any) {
    for (let x = 0; x < size; x++) {
      const column = [];
      for (let y = 0; y < size; y++) {
        let tile: any = {
          x,
          y,
          building: undefined,
          update() {
            console.log(`update tile ${this.x}, ${this.y}`);
          },
        };

        if (Math.random() > 0.7) {
          tile.building = 'building';
        }
        column.push(tile);
      }
      this.data.push(column);
    }

    return this.data;
  }

  updateCity() {
    for (let x = 0; x < this.data.length; x++) {
      for (let y = 0; y < this.data.length; y++) {
        this.data[x][y].update();

        console.log('update city');
      }
    }
  }
}
