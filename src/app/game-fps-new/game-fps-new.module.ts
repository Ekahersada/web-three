import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameFpsNewComponent } from './game-fps-new.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: GameFpsNewComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [GameFpsNewComponent],
})
export class GameFpsNewModule {}
