import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiveBoxComponent } from './components/live-box/live-box.component';
import { SettingsBoxComponent } from './components/settings-box/settings-box.component';
import { MaterialModule } from '@shared/material/material.module';
import { DrawBoxComponent } from './components/draw-box/draw-box.component';
import { InputItemComponent } from './components/input-item/input-item.component';

@NgModule({
  declarations: [
    LiveBoxComponent,
    SettingsBoxComponent,
    DrawBoxComponent,
    InputItemComponent,
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

