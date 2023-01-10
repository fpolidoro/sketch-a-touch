import { NgModule } from '@angular/core';
import { FlexDirective } from './flex.directive';



@NgModule({
  declarations: [
    FlexDirective
  ],
  exports: [
    FlexDirective
  ]
})
export class DirectivesModule { }
