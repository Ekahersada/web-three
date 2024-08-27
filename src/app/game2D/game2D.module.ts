import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game2DComponent } from './game2D.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:'', component:Game2DComponent}
]


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [Game2DComponent]
})
export class Game2DModule { }
