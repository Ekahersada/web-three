import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestLoaderComponent } from './test-loader.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: TestLoaderComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [TestLoaderComponent],
})
export class TestLoaderModule {}
