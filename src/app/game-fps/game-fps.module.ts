import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameFpsComponent } from './game-fps.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:'', component:GameFpsComponent}
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [GameFpsComponent]
})
export class GameFpsModule { }
