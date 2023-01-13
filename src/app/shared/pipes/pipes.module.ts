import { NgModule } from '@angular/core';
import { IsNanPipe } from './is-nan.pipe';



@NgModule({
  declarations: [
    IsNanPipe
  ],
  exports: [
    IsNanPipe
  ]
})
export class PipesModule { }
