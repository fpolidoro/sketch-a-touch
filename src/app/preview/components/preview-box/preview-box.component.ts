import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Form, FormArray, FormControl, FormGroup } from '@angular/forms';
import { IImageFile, ISize, IViewport } from '@preview/interfaces/files';
import { IArea, ITile } from '@preview/interfaces/shapes';
import { FileService, IAreaDragged } from '@preview/services/file.service';
import { BehaviorSubject, Observable, ReplaySubject, Subject, combineLatest, debounce, debounceTime, filter, finalize, interval, map, merge, race, startWith, switchMap, take, takeUntil, takeWhile, tap, withLatestFrom } from 'rxjs';

@Component({
  selector: 'preview-box',
  templateUrl: './preview-box.component.html',
  styleUrls: ['./preview-box.component.scss']
})
export class PreviewBoxComponent implements OnInit, OnDestroy {

  viewportSize: ISize = { width: 0, height: 0 }
  tile: ITile = { c: -1, r: -1 }
  panelHeight: number = 0
  panelWidth: number = 0
  reductionPerc: number = 1.0
  image?: IImageFile
  originalViewport: IViewport = { cols: 0, rows: 0}
  selectedAreaForm?: FormGroup
  
  playPause$: Subject<void> = new Subject<void>()
  stop$: Subject<void> = new Subject<void>()
  isPlaying: boolean = false

  /** Keeps track the current position of the slider during slider drag (valueChanges in a FormControl would only update when the user releases the slider) */
  playPosition$: BehaviorSubject<number> = new BehaviorSubject<number>(0)
  /** Observable to update the `background-position` CSS style of the preview, so that it animates according to the position of the slider*/
  backgroundPosition$: Observable<ITile> = this.playPosition$.pipe(
    withLatestFrom(this._fileService.selectedInteractiveAreaChanged$.pipe(
      switchMap((selectedArea: number) => this._fileService.formArray$.pipe(
        map((formArray: FormArray) => formArray.controls[selectedArea] as FormGroup)  //take the form of the currently selected area because we'll need the direction later
      ))
    )),
    map(([position, areaForm]) => {  //compute the background position so it can be retrieved by the async pipe in the template
      let cssBackgroundPosition: ITile = { c: 0, r: 0}
      switch(areaForm.controls['direction'].value.label){
        case 'Row': //update the background-position-x value
          cssBackgroundPosition.c = -this.viewportSize.width*position
          break
        case 'Column': //update the background-position-x value
          cssBackgroundPosition.r = -this.viewportSize.height*position
          break
      }
      console.log(cssBackgroundPosition)
      return cssBackgroundPosition
    })
  )
  
  private _areas: IArea[] = []
  private _windowSize$: Subject<ISize> = new Subject<ISize>()
  private _onDestroy$: Subject<void> = new Subject<void>()
  
  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    combineLatest([
      this._fileService.fileUploaded$.pipe(
        tap((image: IImageFile) => {
          this.image = image
        })
      ),
      this._fileService.viewportChanged$,
      this._windowSize$.pipe(
        tap((size: ISize) => {
          this.panelHeight = size.height
          this.panelWidth = (size.width*0.2) - 24
        })
      )
    ]).pipe(
      takeUntil(this._onDestroy$)
    ).subscribe(([file, viewport, size]) => {
      this.originalViewport = viewport
      let w = file.width/(viewport.cols > 0 ? viewport.cols : 1)
      let h = file.height/(viewport.rows > 0 ? viewport.rows : 1)
      if(w > this.panelWidth){ //the width of the viewport is larger than panel's max-width
        this.viewportSize = {
          width: this.panelWidth, //...the preview must take panelWidth
          height: h*this.panelWidth/w //...and compute its height so to maintain the aspect ratio
        }
        this.reductionPerc = this.panelWidth/file.width
      }else{  //the viewport is smaller than the panel
        this.viewportSize = {
          width: w, //...use the width of the viewport
          height: h
        }
        this.reductionPerc = w/file.width
      }
    })

    merge(  //listen to the changes on the list of interactive areas so to find out which is currently selected
      this._fileService.interactiveAreaAnnounced$.pipe(tap((area: IArea) => this._areas.push(area))),
      this._fileService.interactiveAreaDragged$.pipe(tap((dragged: IAreaDragged) => this._areas[dragged.index] = dragged.area)),
      this._fileService.interactiveAreaDeleted$.pipe(tap((toDelete: number) => this._areas.splice(toDelete, 1))),
      this._fileService.selectedInteractiveAreaChanged$.pipe( //the selected area has changed, update the tile so that the preview shows the right starting tile for the animation
        filter((selectedArea: number) => !isNaN(selectedArea)),
        switchMap((selectedArea: number) => this._fileService.formArray$.pipe(  //get the form corresponding to the currently selected area: its values are needed to set up the slider
          tap((formArray: FormArray) => {
            this.selectedAreaForm = formArray.controls[selectedArea] as FormGroup
            this.tile = this._areas[selectedArea].pos
          }),
          map((formArray: FormArray) => formArray.controls[selectedArea] as FormGroup),
          switchMap((formGroup: FormGroup) => this.playPause$.pipe( //listen to the play/pause button
            tap(() => this.isPlaying = !this.isPlaying),  //toggle the icon for the template
            filter(() => this.isPlaying), //play the animation only if we clicked the play icon (and not the pause one)
            switchMap(() => interval(150).pipe( //emit a value every 150ms that updates the slider and emits a value to update the background-position
              withLatestFrom(this.playPosition$.pipe(map((position: number) => isNaN(position) ? 0 : position))),
              map(([_, position]) => {
                let pos = position+1
                //update the slider position (and the background) only if we have not reached the end frame yet 
                if(pos < Math.abs(1+formGroup.controls['to'].value-formGroup.controls['from'].value)){
                  this.playPosition$.next(pos)
                }else{  //we reached the end frame, so reset the slider to 0 to replay the animation (this is for when the slider is on the last frame and we click play again)
                  pos = 0
                  this.playPosition$.next(0)
                }

                return pos
              }),
              takeUntil(race(this.stop$, this.playPause$)), //stop the interval when the stop button is pressed or...
              takeWhile((position: number) => position < Math.abs(formGroup.controls['to'].value-formGroup.controls['from'].value), true),  //...take until the number of frames to play is reached
              filter((position: number) => position === Math.abs(formGroup.controls['to'].value-formGroup.controls['from'].value)), //if we reached the end frame...
              tap(() => this.isPlaying = false) //...reset the play button to display the arrow instead of pause
            )),
          ))
        ))
      ),
      this.stop$.pipe(
        debounceTime(100),
        tap(() => {
          this.playPosition$.next(0)
          this.isPlaying = false
        })
      )
    ).pipe(
      takeUntil(this._onDestroy$)
    ).subscribe()
    
    this.onResize(null)
  }

  ngOnDestroy(): void {
    this._onDestroy$.next()
    this._onDestroy$.complete()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this._windowSize$.next({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }
}
