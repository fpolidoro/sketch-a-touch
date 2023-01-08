import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SettingsBoxComponent } from './preview/components/settings-box/settings-box.component';
import { LiveBoxComponent } from './preview/components/live-box/live-box.component';
import { PreviewModule } from './preview/preview.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    PreviewModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
