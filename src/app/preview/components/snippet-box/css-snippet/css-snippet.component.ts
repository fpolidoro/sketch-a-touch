import { Component, OnDestroy, OnInit } from '@angular/core';
import { ISize } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';
import { Subject, tap, takeUntil, merge, combineLatest } from 'rxjs';

@Component({
  selector: 'css-snippet',
  templateUrl: './css-snippet.component.html',
  styleUrls: ['./css-snippet.component.scss']
})
export class CssSnippetComponent implements OnInit, OnDestroy {

  areas: IArea[] = []
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
      )
    ).pipe(
      takeUntil(this._onDestroy$)
    ).subscribe()
  }

  ngOnDestroy(): void {
    this._onDestroy$.next()
    this._onDestroy$.complete()
  }
}
