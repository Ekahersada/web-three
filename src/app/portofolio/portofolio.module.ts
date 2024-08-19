import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortofolioComponent } from './portofolio.component';
import { RouterModule, Routes } from '@angular/router';

const routes:Routes = [
  {path:'', component:PortofolioComponent}
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PortofolioComponent]
})
export class PortofolioModule { }
