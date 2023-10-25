import { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { IImageFile, ISize } from '@preview/interfaces/files';
import { IArea, ICircle, IRect, ITile } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';

import { bufferToggle, exhaustMap, filter, last, map, merge, Observable, race, repeat, startWith, Subject, Subscription, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs';

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

  clickArea$: Subject<number> = new Subject<number>()
  /** Emits the id of the area that is about to be dragged */
  dragStart$: Subject<number> = new Subject<number>()
  /** Emits the CdkDragMove event of the area that is being dragged */
  dragMove$: Subject<CdkDragMove> = new Subject<CdkDragMove>()
  /** Emits the CdkDragEnd event of the area that has just been dragged.
   * 
   * Note: after dragEnd, thanks to cdkDropList, the evend CdkDragDrop is emitted. This concludes
   * the drag action and prevents clicks from being triggered when the mouse button is released
   */
  dragEnd$: Subject<CdkDragEnd> = new Subject<CdkDragEnd>()
  

  areas: IArea[] = []
  selectedUndoArea?: IArea
  selectedAreaIndex: number = NaN
  drawBoxPointerEvents: 'none'|'initial' = 'none'

  formArray?: FormArray
  gridIndexes: ITileAsFrame[] = []
  /** Defines the icon to be displayed on frames, to indicate the direction of the animation */
  arrow: string|undefined

  point: IArea|undefined
  /** Stores the index of the area that is currently being dragged. This is used to draw the preview of the area as it is dragged on the viewport */
  draggedAreaIndex: number = NaN

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
            //console.log(`${file!.height}/${viewport.rows}/${a.y}`)
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
    
    this._subscription.add(this._fileService.formArray$.pipe(
      take(1),
      switchMap((array: FormArray) => {
        this.formArray = array

        return merge(
            this.formArray.statusChanges,
            this._fileService.viewportChanged$
          ).pipe(withLatestFrom(this._fileService.selectedInteractiveAreaChanged$))
      })
    ).subscribe(() => this._findFrames()))

    //observe click and drag actions, which must be mutually exclusive, hence race
    this._subscription.add(race(
      this.clickArea$.pipe(
        tap(() => console.warn('Click')),
        tap((index: number) => {
          let area = this.areas[index]
          console.log('Selected area')

          switch(area.type){
            case 'circle':
              this.point = Object.assign({}, {
                x: area.x,
                y: area.y,
                type: area.type
              }) as IArea
              break
            case 'rectangle':
              this.point = Object.assign({}, {
                x: ((area as IRect).x + (area as IRect).w)/2,
                y: ((area as IRect).y + (area as IRect).h)/2,
                type: area.type
              }) as IArea
              console.log(`(${area.x}, ${area.y}) ${(area as IRect).w} x ${(area as IRect).h}\n(${this.point.x}, ${this.point.y})`)
              console.info(`${(area as IRect).w - area.x},${(area as IRect).h - area.y}`)
              break
          }
          this._fileService.selectInteractiveArea(index)
        }),
        take(1)
      ),
      this.dragStart$.pipe(
        tap(() => console.warn('Drag START')),
        tap((index: number) => {
          this.draggedAreaIndex = index
          let area = this.areas[index]
          this.selectedAreaIndex = index
          this._fileService.selectInteractiveArea(index)

          this.point = Object.assign({}, {
            x: area.x,
            y: area.y,
            type: area.type
          }) as IArea

          switch(area.type){
            case 'circle':
              this.point = Object.assign(this.point as ICircle, {
                r: (area as ICircle).r
              })
              break
            case 'rectangle':
              this.point = Object.assign(this.point as IRect, {
                // x: /*(area as IRect).w - (area as IRect).x < 0 ? (area as IRect).w : */((area as IRect).x + (area as IRect).w)/2,
                // y: /*(area as IRect).h - (area as IRect).y < 0 ? (area as IRect).h :*/ ((area as IRect).y + (area as IRect).h)/2,
                w: (area as IRect).w,
                h: (area as IRect).h
              });
              console.log(`point: (${this.point!.x}, ${this.point!.y}) ${(this.point! as IRect).w} x ${(this.point! as IRect).h}`)
              break
          }
        }),
        take(1),
        exhaustMap((index: number) => this.dragMove$.pipe(
          tap((event: CdkDragMove) => {
            //console.log(event)
            let area = this.areas[index]

            switch(area.type){
              case 'circle':
                this.point!.x = area.x + event.distance.x
                this.point!.y = area.y + event.distance.y
                break
              case 'rectangle':
                let centralInitial = {  //point at the center of the rectangle before dragStart
                  x: ((area as IRect).w + area.x)/2,
                  y: ((area as IRect).h + area.y)/2
                }
                let offset = {  //width and height of the rectangle before dragStart
                  x: Math.abs((area as IRect).w - area.x),
                  y: Math.abs((area as IRect).h - area.y)
                };
                (this.point as IRect).w = event.distance.x + offset.x + area.x;
                (this.point as IRect).h = event.distance.y + offset.y + area.y
                this.point!.x = area.x + event.distance.x// - centralInitial.x
                this.point!.y = area.y + event.distance.y// - centralInitial.y
                break
            }

            //console.log(`${this.areas[index].x} -> ${this.point!.x}, ${this.areas[index].y} -> ${this.point!.y}`)
          }),
          takeUntil(this.dragEnd$.pipe(
            tap(() => console.info('Drag END')),
            tap((event: CdkDragEnd) => {
              this.draggedAreaIndex = NaN
              let area = this.areas[this.selectedAreaIndex]

              //check that the drop point is within the viewport bounds, otherwise set it to the closest point on the edge
              let dropPoint = Object.assign({}, {
                x: event.dropPoint.x < 0 ? 0 : event.dropPoint.x > this.originalSize!.width ? this.originalSize!.width : event.dropPoint.x,
                y: event.dropPoint.y < 0 ? 0 : event.dropPoint.y > this.originalSize!.height ? this.originalSize!.height : event.dropPoint.y
              })
      
              // console.log(area)
              // console.log(`${this.selectedAreaIndex}, ${event.dropPoint.x}, ${event.dropPoint.y}`)
              // console.log(event)

              switch(this.point!.type){
                case 'circle':
                  this.point!.x = dropPoint.x
                  this.point!.y = dropPoint.y
                  console.log(event.dropPoint)
                  
                  area.x = dropPoint.x
                  area.y = dropPoint.y
                  break
                case 'rectangle':
                  let centralInitial = {  //point at the center of the rectangle before dragStart
                    x: ((area as IRect).w + area.x)/2,
                    y: ((area as IRect).h + area.y)/2
                  }
                  let offset = {  //width and height of the rectangle before dragStart
                    x: Math.abs((area as IRect).w - area.x),
                    y: Math.abs((area as IRect).h - area.y)
                  };

                  (area as IRect).w = dropPoint.x + offset.x/2;
                  (area as IRect).h = dropPoint.y + offset.y/2
                  area.x = area.x + dropPoint.x - centralInitial.x,
                  area.y = area.y + dropPoint.y - centralInitial.y

                  console.log(`(${area.x}, ${area.y}) ${(area as IRect).w} x ${(area as IRect).h}\n(${this.point!.x}, ${this.point!.y})`)
                  console.info(`${(area as IRect).w - area.x},${(area as IRect).h - area.y}`)
                  break
              }
      
              console.log(area)
            }),
            withLatestFrom(this._fileService.viewportChanged$), //get the viewport
            withLatestFrom(this._fileService.fileUploaded$),  //and the file
            tap(([[dragEnd, viewport], file]) => {  //then compute the new position of the area, as it might have been dragged onto another tile
              let area = this.areas[index]
              area.pos.c = Math.floor(area.x/(file.width/(+viewport.cols > 0 ? +viewport.cols : 1)))
              area.pos.r = Math.floor(area.y/(file.height/(+viewport.rows > 0 ? +viewport.rows : 1)))

              this._fileService.interactiveAreaDragEnded(area, this.selectedAreaIndex)  //announce the changes to the dragged area
            })
          ))
        ))
      )
    ).pipe(
      repeat()
    ).subscribe())

    this._subscription.add( //observe the changes to selected and dragged areas so to update the animated tiles accordingly
      merge(
        this._fileService.selectedInteractiveAreaChanged$.pipe(
          tap((index: number) => this.selectedAreaIndex = index)
        ),
        this._fileService.interactiveAreaDragged$ //this is triggered by this component, once dragEnd emitted
      ).subscribe(() => this._findFrames())
    )
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }

  /** Handles clicks on interactive areas and announces their selection to other components
   * @param index The index of the area being selected
   */
  /*selectArea(index: number){
    this._fileService.selectInteractiveArea(index)
    console.log('Selected area')
    this.point = {
      x: this.areas[index].x,
      y: this.areas[index].y
    }
  }*/

  /** Recompute the tiles that must be highlighted as frames based on the currently selected interactive area identified by {@link selectedAreaIndex} */
  private _findFrames(): void {
    if(!Number.isNaN(this.selectedAreaIndex) && this.selectedAreaIndex >= 0){
      let area = this.areas[this.selectedAreaIndex]
      let control = this.formArray?.controls[this.selectedAreaIndex] as FormGroup
      if(control){
        let from = control.controls['from'].value
        let to = control.controls['to'].value
        let direction = control.controls['direction'].value
        let hasUndo = control.controls['allowUndo'].value
        let maxTileIndex = -1
        this.arrow = undefined

        this.gridIndexes.forEach(gi => {  //for each frame of the grid...
          if(direction === undefined || direction === null){//...if the direction is defined...
            this.arrow = undefined
            gi.is_frame = false //direction not defined, so the tile can't be a frame
          }else{
            if(direction.label === 'Column'){ //...and it is a column (i.e. vertical direction)...
              if(area.pos.c === gi.c){  //...and the current frame is on the column which the selected interactive area belongs to...
                gi.is_frame = from !== undefined && from !== null && to !== undefined && to !== null && ((+from > +to && +from >= gi.r && +to <= gi.r) || (+from <= +to && +from <= gi.r && +to >= gi.r))
                //set the frame as "belongs to animation" if its index is part of the range of rows identified by the from-to fields
                //console.log(`[${gi.c},${gi.r}] f: ${+from} ${+from <= +to ? '<=' : '>'} t: ${+to}, tile.r: ${gi.r}\nf>=r && t<=r: ${+from > +to && +from <= +to && +from >= gi.r && +to <= gi.r}\nf<=r && t>=r: ${+from <= +to && +from <= gi.r && +to >= gi.r}\n=    ${gi.is_frame}`)
                if(gi.is_frame){
                  this.arrow = +from > +to ? "arrow_upward" : "arrow_downward"
                  maxTileIndex = Math.max(maxTileIndex, gi.r)
                }
              }else{
                gi.is_frame = false
              }
            }else if(direction.label === 'Row'){
              if(area.pos.r === gi.r){
                gi.is_frame = from !== undefined && from !== null && to !== undefined && to !== null && ((+from > +to && +from >= gi.c && +to <= gi.c) || (+from <= +to && +from <= gi.c && +to >= gi.c))
                if(gi.is_frame){
                  this.arrow = +from > +to ? "arrow_back" : "arrow_forward"
                  maxTileIndex = Math.max(maxTileIndex, gi.c)
                }
              }else{
                gi.is_frame = false
              }
            }
          }
        })

        //create undo area
        let pos: ITile
        let x: number
        let y: number
        let w: number = 0
        let h: number = 0
        
        
        if(direction?.label === 'Row'){
          pos = {
            c: maxTileIndex,
            r: area.pos.r
          }
          x = (to-from)*this.viewportSize.width + area.x
          y = area.y
          w = ((area as IRect).w ?? 0) + (to-from)*this.viewportSize.width
          h = (area as IRect).h ?? 0
        }else if(direction?.label === 'Column'){
          pos = {
            c: area.pos.c,
            r: maxTileIndex
          }
          x = area.x
          y = (to-from)*this.viewportSize.height + area.y
          w = (area as IRect).w ?? 0
          h = ((area as IRect).h ?? 0) + (to-from)*this.viewportSize.height
        }


        this.selectedUndoArea = hasUndo && direction && (direction.label=== 'Row' || direction.label=== 'Column') ? {
          pos: pos!,
          type: area.type,
          x: x!,
          y: y!
        } : undefined

        if(this.selectedUndoArea !== undefined){
          if(area.type === 'circle'){
            this.selectedUndoArea = Object.assign((this.selectedUndoArea as IArea), {
              r: (area as ICircle).r
            })
          }else if(area.type === 'rectangle'){
            this.selectedUndoArea = Object.assign((this.selectedUndoArea as IArea), {
              w: w,
              h: h
            })
            console.log(`w: ${(this.selectedUndoArea as IRect).w}, x: ${(this.selectedUndoArea as IRect).x}`)
          }
        }
      }
    }else{
      this.selectedUndoArea = undefined //hide the undo area as it might still be visible
      this.gridIndexes.forEach(gi => gi.is_frame = false)
    }
  }

  /** Handle cdkDragEnded event on an interactive area
   * @param event The cdkDragEnd event, which contains the coordinates of the drop location
   */
}

interface ITileAsFrame extends ITile {
  is_frame: boolean
}