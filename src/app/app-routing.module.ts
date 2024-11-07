import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [

  {path:'game-dev',  loadChildren: () => import("./game/game.module").then(m => m.GameModule)},
  {path:'',  loadChildren: () => import("./portofolio/portofolio.module").then(m => m.PortofolioModule)},
  {path:'portofolio',  loadChildren: () => import("./portofolio/portofolio.module").then(m => m.PortofolioModule)},
  {path:'game',  loadChildren: () => import("./game-rpg/game-rpg.module").then(m => m.GameRpgModule)},
  {path:'game-2d',  loadChildren: () => import("./game2D/game2D.module").then(m => m.Game2DModule)},
  {path:'game-fps',  loadChildren: () => import("./game-fps/game-fps.module").then(m => m.GameFpsModule)},
  {path:'game-fps2',  loadChildren: () => import("./game-shoot/game-shoot.module").then(m => m.GameShootModule)},
  {path:'game-test',  loadChildren: () => import("./game-test/game-test.module").then(m => m.GameTestModule)},
  {path:'game-new',  loadChildren: () => import("./game-new-rpg/game-new-rpg.module").then(m => m.GameNewRpgModule)},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
