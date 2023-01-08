import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiveBoxComponent } from './components/live-box/live-box.component';
import { SettingsBoxComponent } from './components/settings-box/settings-box.component';
import { MaterialModule } from '@shared/material/material.module';

@NgModule({
  declarations: [
    LiveBoxComponent,
    SettingsBoxComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  exports: [
    LiveBoxComponent,
    SettingsBoxComponent,
  ]
})
export class PreviewModule { }

