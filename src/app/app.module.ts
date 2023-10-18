import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreviewModule } from './preview/preview.module';
import { DirectivesModule } from '@shared/directives/directives.module';
import { PipesModule } from '@shared/pipes/pipes.module';
import { MaterialModule } from '@shared/material/material.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    PreviewModule,
    DirectivesModule,
    PipesModule,
    MaterialModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
