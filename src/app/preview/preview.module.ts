import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {ClipboardModule} from '@angular/cdk/clipboard';
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
import { SnippetBoxComponent } from './components/snippet-box/snippet-box.component';
import { ErrorDetectorPipe } from './pipes/error-detector.pipe';
import { PreviewBoxComponent } from './components/preview-box/preview-box.component';
import { CssSnippetComponent } from './components/snippet-box/css-snippet/css-snippet.component';
import { HtmlSnippetComponent } from './components/snippet-box/html-snippet/html-snippet.component';
import { JsSnippetComponent } from './components/snippet-box/js-snippet/js-snippet.component';

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
    SnippetBoxComponent,
    ErrorDetectorPipe,
    PreviewBoxComponent,
    CssSnippetComponent,
    HtmlSnippetComponent,
    JsSnippetComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ClipboardModule,
    ReactiveFormsModule,
    DirectivesModule,
    PipesModule,
  ],
  exports: [
    LiveBoxComponent,
    SettingsBoxComponent,
    CodeBoxComponent,
    PreviewBoxComponent,
    CastShapePipe,
    ErrorTextPipe,
    ErrorDetectorPipe,
  ]
})
export class PreviewModule { }

