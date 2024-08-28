import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameShootComponent } from './game-shoot.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:'', component:GameShootComponent}
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [GameShootComponent]
})
export class GameShootModule { }
