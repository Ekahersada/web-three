import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameGridComponent } from './game-grid.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: GameGridComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [GameGridComponent],
})
export class GameGridModule {}
