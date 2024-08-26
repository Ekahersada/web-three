import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameRpgComponent } from './game-rpg.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../shared/library/material.module';
import { ModalSettingComponent } from '../modals/modal-setting/modal-setting.component';

const routes : Routes = [
  {path:'', component:GameRpgComponent}
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    RouterModule.forChild(routes)
  ],
  declarations: [GameRpgComponent, ModalSettingComponent]
})
export class GameRpgModule { }
