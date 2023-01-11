import { Component, OnInit } from '@angular/core';
import { IImageFile, ISize } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';

import * as d3 from 'd3';
import { bufferToggle, filter, map, Observable, Subscription, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';

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

  areas: IArea[] = []
  selectedAreaIndex: number = NaN
  drawBoxPointerEvents: 'none'|'initial' = 'none'

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
    this._subscription.add(this._fileService.interactiveAreaAnnounced$.subscribe((area: IArea) => {
      this.areas.push(area)
      console.log(area)
    }))
    this._subscription.add(this._fileService.selectedInteractiveAreaChanged$.subscribe((index: number) => this.selectedAreaIndex = index))
    this._subscription.add(this._fileService.interactiveAreaRequested$.pipe(  //observe when the drawing mode is active:
      //when an area is requested, it means the user wants to draw something
      tap(() => { //therefore allow the draw-box component to capture the pointer events
        this.drawBoxPointerEvents = 'initial'
      }),
      //now observe the status of the drawing process: after drawing a shape, the user is prompted with the three buttons ('ok','reset','cancel')
      bufferToggle(
        this._fileService.interactiveAreaActionChanged$.pipe( //the first emission of interactiveAreaActionChanged$ will be one of these three outcomes, and this is toggles the start of the buffer
          filter((action) => action !== null && action !== 'reset')
        ),
        () => this._fileService.interactiveAreaActionChanged$.pipe( //right after the user made their choice, the action is reset...
          filter((action) => action === null) //...and this is where this buffer should stop listening
        )
      ),
      tap(() => { //the buffer stopped, therefore the drawing session is completed...
        this.drawBoxPointerEvents = 'none'  //stop the draw-box component from capturing pointer events so to allow the user to select the previously drawn shapes
      })
    ).subscribe())
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }

  selectArea(index: number){
    this._fileService.selectInteractiveArea(index)
  }
}
