import { Component, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { ISize } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';
import { Subject, merge, tap, combineLatest, takeUntil, withLatestFrom } from 'rxjs';

@Component({
  selector: 'js-snippet',
  templateUrl: './js-snippet.component.html',
  styleUrls: ['./js-snippet.component.scss']
})
export class JsSnippetComponent implements OnInit {
  areas: IArea[] = []
  array: FormGroup[] = []
  formArray?: FormArray
  viewportSize: ISize = {width: 0, height: 0}

  private _onDestroy$: Subject<void> = new Subject<void>()

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    merge(  //observe the changes to interactive areas and store them into an array: these areas will be used to generate the CSS code
      this._fileService.interactiveAreaAnnounced$.pipe(
        tap((area: IArea) => this.areas.push(area)),
        tap(area => console.log(area))
      ),
      this._fileService.interactiveAreaDeleted$.pipe(
        tap((index: number) => this.areas.splice(index, 1))
      ),
      combineLatest([
        this._fileService.fileUploaded$,
        this._fileService.viewportChanged$
      ]).pipe(
        tap(([file, viewportSize]) => this.viewportSize = {width: file.width/viewportSize.cols, height: file.height/viewportSize.rows}),
      ),
      this._fileService.formArray$.pipe(
        tap((formArray) => {
          this.formArray = formArray
          this.array = formArray.controls as FormGroup[]
        })
      )
    ).pipe(
      withLatestFrom(this._fileService.formArray$),
      takeUntil(this._onDestroy$)
    ).subscribe(([_, array]) => {
      console.log(array)
      console.log(array.controls)
    })
  }

  ngOnDestroy(): void {
    this._onDestroy$.next()
    this._onDestroy$.complete()
  }
}