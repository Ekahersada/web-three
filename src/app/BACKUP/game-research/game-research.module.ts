import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameResearchComponent } from './game-research.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: GameResearchComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [GameResearchComponent],
})
export class GameResearchModule {}
