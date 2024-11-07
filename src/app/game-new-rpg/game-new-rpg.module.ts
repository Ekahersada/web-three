import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameNewRpgComponent } from './game-new-rpg.component';
import { RouterModule, Routes } from '@angular/router';

const routes : Routes = [
  {path:'', component:GameNewRpgComponent}
]


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [GameNewRpgComponent]
})
export class GameNewRpgModule { }
