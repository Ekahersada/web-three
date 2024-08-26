import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameRpgComponent } from './game-rpg.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

const routes : Routes = [
  {path:'', component:GameRpgComponent}
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [GameRpgComponent]
})
export class GameRpgModule { }
