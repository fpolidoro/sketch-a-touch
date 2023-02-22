import { Component, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { IImageFile, ISize } from '@preview/interfaces/files';
import { IArea, ITile } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';

import * as d3 from 'd3';
import { bufferToggle, debounceTime, filter, map, merge, Observable, startWith, Subscription, switchMap, take, tap, withLatestFrom } from 'rxjs';

@Component({
  selector: 'live-box',
  templateUrl: './live-box.component.html',
  styleUrls: ['./live-box.component.scss']
})
export class LiveBoxComponent implements OnInit {
  originalSize?: ISize
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

  formArray?: FormArray
  gridIndexes: ITileAsFrame[] = []

  private _subscription?: Subscription

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    this._subscription = this._fileService.viewportChanged$.pipe(
      withLatestFrom(this._fileService.fileUploaded$),
      withLatestFrom(this._fileService.selectedInteractiveAreaChanged$.pipe(startWith(NaN))),
      filter(([viewport, file]) => file !== null),
    ).subscribe(([[viewport, file], selectedAreaIndex]) => {
      console.log(`viepowrt changed`)
      this.originalSize = {
        width: file.width,
        height: file.height
      }
      this.viewportSize = {
        width: file.width/(+viewport.cols > 0 ? +viewport.cols : 1),
        height: file.height/(+viewport.rows > 0 ? +viewport.rows : 1)
      }
      this.gridIndexes.splice(0, this.gridIndexes.length)
      
      //generate the indexes for the tiles of the grid that help the user numbering the frames
      for(let i=0; i<+viewport.cols*+viewport.rows; i++){
        this.gridIndexes.push()
      }
      for(let i=0; i<+viewport.rows; i++){
        for(let j=0; j<+viewport.cols; j++){
          this.gridIndexes.push({
            c: j,
            r: i,
            is_frame: false
          })
        }
      }

      //since the viewport (thus grid tiles) changed, it is necessary to recompute to which tile each area belong so that the frames are highlighted correctly
      this.areas.forEach(a => {
        switch(a.type){
          case 'circle':
            a = Object.assign(a, {
              pos: {
                c: Math.floor(a.x/(file.width/(+viewport.cols > 0 ? +viewport.cols : 1))),
                r: Math.floor(a.y/(file.height/(+viewport.rows > 0 ? +viewport.rows : 1)))
              }
            })
            console.log(`${file!.height}/${viewport.rows}/${a.y}`)
            break
          case 'rectangle':
            a = Object.assign(a, {
              pos: {
                c: Math.floor(a.x/(file.width/(+viewport.cols > 0 ? +viewport.cols : 1))),
                r: Math.floor(a.y/(file.height/(+viewport.rows > 0 ? +viewport.rows : 1)))
              }
            })
        }
      })
      //now recompute the tiles that must be highlighted as frames
      this._findFrames()
      // console.log(this.gridIndexes)
    })
    this._subscription.add(this._fileService.interactiveAreaAnnounced$.subscribe((area: IArea) => {
      this.areas.push(area)
      //console.log(area)
    }))
    this._subscription.add(this._fileService.selectedInteractiveAreaChanged$.subscribe((index: number) => {
      this.selectedAreaIndex = index
      this._findFrames()
    }))
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
    this._subscription.add(this._fileService.interactiveAreaDeleted$.pipe(  //observe whether there are areas to delete
      filter((selection: number) => selection >= 0 && !isNaN(selection)), //there is an area to delete...
      tap((selection: number) => {
        this.areas.splice(selection, 1) //...remove it from the list of SVGs
        this._fileService.deleteInteractiveArea(NaN)  //...and notify settings-box that deletion here is done, and it can proceed to delete the item from its side
      })
    ).subscribe())

    this._fileService.formArray$.pipe(
      take(1),
      switchMap((array: FormArray) => {
        this.formArray = array

        return merge(
            this.formArray.statusChanges,
            this._fileService.viewportChanged$
          ).pipe(withLatestFrom(this._fileService.selectedInteractiveAreaChanged$))
      })
    ).subscribe(() => this._findFrames())
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }

  selectArea(index: number){
    this._fileService.selectInteractiveArea(index)
  }

  /** Recompute the tiles that must be highlighted as frames based on the currently selected interactive area identified by {@link selectedAreaIndex} */
  private _findFrames(): void {
    if(this.selectedAreaIndex !== NaN && this.selectedAreaIndex >= 0){
      let control = this.formArray?.controls[this.selectedAreaIndex] as FormGroup
      if(control){
        let from = control.controls['from'].value
        let to = control.controls['to'].value
        let direction = control.controls['direction'].value

        this.gridIndexes.forEach(gi => {  //for each frame of the grid...
          if(direction === undefined || direction === null){//...if the direction is defined...
            gi.is_frame = false
          }else{
            if(direction.label === 'Column'){ //...and it is a column (i.e. vertical direction)...
              if(this.areas[this.selectedAreaIndex].pos.c === gi.c){  //...and the current frame is on the column which the selected interactive area belongs to...
                gi.is_frame = from !== undefined && from !== null && to !== undefined && to !== null && ((+from > +to && +from >= gi.r && +to <= gi.r) || (+from <= +to && +from <= gi.r && +to >= gi.r))
                //set the frame as "belongs to animation" if its index is part of the range of rows identified by the from-to fields
                console.log(`[${gi.c},${gi.r}] f: ${+from} ${+from <= +to ? '<=' : '>'} t: ${+to}, tile.r: ${gi.r}\nf>=r && t<=r: ${+from > +to && +from <= +to && +from >= gi.r && +to <= gi.r}\nf<=r && t>=r: ${+from <= +to && +from <= gi.r && +to >= gi.r}\n=    ${gi.is_frame}`)
              }else{
                gi.is_frame = false
              }
            }else if(direction.label === 'Row'){
              if(this.areas[this.selectedAreaIndex].pos.r === gi.r){
                gi.is_frame = from !== undefined && from !== null && to !== undefined && to !== null && ((+from > +to && +from >= gi.c && +to <= gi.c) || (+from <= +to && +from <= gi.c && +to >= gi.c))
              }else{
                gi.is_frame = false
              }
            }
          }
        })
      }
    }else{
      this.gridIndexes.forEach(gi => gi.is_frame = false)
    }
  }
}

interface ITileAsFrame extends ITile {
  is_frame: boolean
}