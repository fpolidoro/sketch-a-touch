import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LiveBoxComponent } from './components/live-box/live-box.component';
import { SettingsBoxComponent } from './components/settings-box/settings-box.component';
import { MaterialModule } from '@shared/material/material.module';
import { DrawBoxComponent } from './components/draw-box/draw-box.component';
import { InputItemComponent } from './components/input-item/input-item.component';
import { DirectivesModule } from '@shared/directives/directives.module';
import { CastShapePipe } from './pipes/cast-shape.pipe';
import { PipesModule } from '@shared/pipes/pipes.module';
import { ErrorTextPipe } from './pipes/error-text.pipe';
import { GuideDialogComponent } from './components/guide-dialog/guide-dialog.component';
import { CodeBoxComponent } from './components/code-box/code-box.component';

@NgModule({
  declarations: [
    LiveBoxComponent,
    SettingsBoxComponent,
    DrawBoxComponent,
    InputItemComponent,
    CastShapePipe,
    ErrorTextPipe,
    GuideDialogComponent,
    CodeBoxComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DirectivesModule,
    PipesModule,
  ],
  exports: [
    LiveBoxComponent,
    SettingsBoxComponent,
    CodeBoxComponent,
    CastShapePipe,
    ErrorTextPipe,
  ]
})
export class PreviewModule { }

