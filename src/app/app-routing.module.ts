import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:'',  loadChildren: () => import("./game/game.module").then(m => m.GameModule)},
  {path:'portofolio',  loadChildren: () => import("./portofolio/portofolio.module").then(m => m.PortofolioModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
