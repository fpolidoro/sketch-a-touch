import { Component, OnInit } from '@angular/core';
import { IImageFile, ISize } from '@preview/interfaces/files';
import { FileService } from '@preview/services/file.service';

import * as d3 from 'd3';
import { filter, map, Observable, startWith, Subscription, tap, withLatestFrom } from 'rxjs';

@Component({
  selector: 'live-box',
  templateUrl: './live-box.component.html',
  styleUrls: ['./live-box.component.scss']
})
export class LiveBoxComponent implements OnInit {
  viewportSize: ISize = {
    width: 1,
    height: 1
  }
  image$: Observable<string> = this._fileService.fileUploaded$.pipe(
    map((img: IImageFile) => img.base64)
  )

  private _subscription?: Subscription

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    this._subscription = this._fileService.viewportChanged$.pipe(
      withLatestFrom(this._fileService.fileUploaded$),
      filter(([viewport, file]) => file !== null),
    ).subscribe(([viewport, file]) => {
      this.viewportSize = {
        width: file.width/(+viewport.cols > 0 ? +viewport.cols : 1),
        height: file.height/(+viewport.rows > 0 ? +viewport.rows : 1)
      }
      console.log(this.viewportSize)
    })
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }
}
