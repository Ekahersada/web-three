import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTestComponent } from './game-test.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:'', component:GameTestComponent}
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [GameTestComponent]
})
export class GameTestModule { }
