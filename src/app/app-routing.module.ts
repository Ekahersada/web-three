import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:'',  loadChildren: () => import("./game/game.module").then(m => m.GameModule)},
  {path:'portofolio',  loadChildren: () => import("./portofolio/portofolio.module").then(m => m.PortofolioModule)},
  {path:'game',  loadChildren: () => import("./game-rpg/game-rpg.module").then(m => m.GameRpgModule)},
  {path:'game-fps',  loadChildren: () => import("./game-fps/game-fps.module").then(m => m.GameFpsModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
