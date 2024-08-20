import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameRpgComponent } from './game-rpg.component';
import { RouterModule, Routes } from '@angular/router';

const routes : Routes = [
  {path:'', component:GameRpgComponent}
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [GameRpgComponent]
})
export class GameRpgModule { }
