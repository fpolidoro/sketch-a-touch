import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, defer, delay, EMPTY, exhaustMap, filter, finalize, fromEvent, iif, map, mergeMap, Observable, of, race, startWith, Subject, Subscription, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs';
import { FileService } from '@preview/services/file.service';
import { IImageFile, IViewport } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { MatDialog } from '@angular/material/dialog';
import { GuideDialogComponent } from '../guide-dialog/guide-dialog.component';

@Component({
  selector: 'settings-box',
  templateUrl: './settings-box.component.html',
  styleUrls: ['./settings-box.component.scss']
})
export class SettingsBoxComponent implements OnInit {
  currentFile?: IImageFile

  settings: FormGroup = new FormGroup({
    file: new FormControl(),
    viewport: new FormGroup({
      rows: new FormControl(),
      cols: new FormControl()
    }),
    areas: new FormArray([])
  })

  areas: IArea[] = []
  tmpArea?: FormGroup
  selectedAreaIndex: number = NaN

  drawing: boolean = false
  showShapes: boolean = false

  selectFile$: Subject<void> = new Subject<void>()
  addInteractiveArea$: Subject<void> = new Subject<void>()
  selectAreaType$: Subject<[Event, 'circle'|'rectangle']> = new Subject<[Event, 'circle'|'rectangle']>()
  doneDrawing$: Subject<[Event, 'ok'|'reset'|'cancel']> = new Subject<[Event, 'ok'|'reset'|'cancel']>()
  deleteItem$: Subject<void> = new Subject<void>()
  openGuide$: Subject<void> = new Subject<void>()
  toggleDrawer$: Subject<void> = new Subject<void>()

  action$ = this._fileService.interactiveAreaActionChanged$.pipe(startWith(null))

  private _drawerStatus: boolean = false
  private _subscriptions?: Subscription[]
  private _areasForm: FormArray = this.settings.controls['areas'] as FormArray

  constructor(private _fileService: FileService, private _dialog: MatDialog) { }

  ngOnInit(): void {
    this.settings.controls['viewport'].patchValue({
      cols: 1,
      rows: 1
    })

    this._subscriptions = [
      this.selectFile$.pipe(
        debounceTime(100),
        switchMap(() => {
          const inputNode: any = document.querySelector('#file')
          let file = inputNode.files[0]
          this.settings.controls['file'].setValue(file?.name ?? undefined)

          const reader = new FileReader()
          let observable$ = file ? fromEvent(reader, 'load').pipe(
            switchMap((e: any) => this._getImgSize$(e.target.result).pipe(
              tap((result: IImageFile) => {
                this.currentFile = result
                this._fileService.uploadFile(result)  //notify live-box
                this.settings.controls['viewport'].patchValue({ //reset columns and rows
                  cols: 1,
                  rows: 1
                })
              })
            ))
          ) : of(1)

          if(file) reader.readAsDataURL(file) //trigger the fromEvent above

          return observable$
        }),
      ).subscribe(),
      this.settings.controls['viewport'].valueChanges.pipe(
        debounceTime(100)
      ).subscribe((values: IViewport) => this._fileService.viewportChange(values)),
      this.addInteractiveArea$.pipe(  //click on add new interaction area
        debounceTime(100),
        tap(() => {
          this.showShapes = true
          this.selectArea(NaN)
        }),
        exhaustMap(() => this.selectAreaType$.pipe( //click on shape type
          tap(([event, what]) => {
            event.stopPropagation() //prevent the event to bubble up to parent, or it will trigger again the addInteractiveArea$
            //console.log(`requested a ${what}`)
            this._fileService.requestInteractiveArea(what)  //send the selected shape to the draw-box component
            this.drawing = true
          }),
          exhaustMap(([event, what]) => this.doneDrawing$.pipe(  //click on the done buttons
            tap(([event, outcome]) => {
              event.stopPropagation()
              //console.log(outcome)
            }),
            mergeMap(([event, outcome]) => {
              this._fileService.actionForInteractiveArea(outcome)
              return iif( //reset the view based on the clicked button
              () => outcome === 'reset',
              defer(() => of(true)/*.pipe(tap(() => console.log(`area must be reset`)))*/),
              defer(() => of(false).pipe( //action was either 'ok' or 'cancel', so box must return to the 'add new area' state
                tap(() => this.drawing = false)
              ))
            )}),
            tap(() => this._fileService.actionForInteractiveArea(null)) //the action has been registered by the listening components, so we can reset it
          )),
        )),
        tap((shouldShow: boolean) => this.showShapes = shouldShow)
      ).subscribe(),
      this._fileService.interactiveAreaAnnounced$.pipe(
        tap((area: IArea) => this.areas.push(area))
      ).subscribe(),
      this._fileService.selectedInteractiveAreaChanged$.subscribe((index: number) => this.selectedAreaIndex = index),
      this.deleteItem$.pipe(  //delete the selected interactive area
        debounceTime(100),
        exhaustMap(() => race(
          this._fileService.selectedInteractiveAreaChanged$.pipe(take(1)),  //take the selected area
          of(-1).pipe(delay(1000))  //this is just in case the previous emitter doesn't emit anything because nothing has been selected yet
        ).pipe(
          filter((selection: number) => selection >= 0 && !isNaN(selection)), //proceed only if there is a true selection
          switchMap((selection: number) => {
            this._fileService.deleteInteractiveArea(selection)  //issue the deletion command so that live-box can remove the SVG
            return this._fileService.interactiveAreaDeleted$.pipe(  //wait for live-box to transmit a NaN...
              filter((sselection: number) => isNaN(sselection)),  //...meaning live-box completed the deletion on its side
              take(1),
              tap(() => {
                this.areas.splice(selection, 1) //delete the item from the list
                this._areasForm.controls.splice(selection,1)
                this._fileService.selectInteractiveArea(-1) //reset the selected item
              })
            )
          })
        )),
      ).subscribe(),
      this.openGuide$.pipe(
        exhaustMap(() => this._dialog.open(GuideDialogComponent).afterClosed())
      ).subscribe(),
      this.toggleDrawer$.pipe(
        debounceTime(100),
        switchMap(() => {
          console.log(`Toggling drawer: curr=${this._drawerStatus}`)
          this._fileService.toggleCodeDrawer(!this._drawerStatus)
          return this._fileService.drawerStatusChanged$.pipe(
            filter((status: boolean) => status !== this._drawerStatus)
          )
        })
      ).subscribe((updatedStatus: boolean) => this._drawerStatus = updatedStatus)
    ]

    this._fileService.shareFormArray(this._areasForm) //share areasForm with live-box, so that it can draw the right patter on the SVGs
  }

  ngOnDestroy(){
    this._subscriptions?.forEach(s => s.unsubscribe())
  }

  ngAfterViewInit(): void {
    this._fileService.shareFormArray(this._areasForm)
  }

  selectArea(index: number): void {
    this._fileService.selectInteractiveArea(index)
  }

  /** Get the size of the image
   * @param imageSrc The image whose size is to be retrieved, encoded with base64
   * @returns An {@link IImageFile} object containing the original image (base64), and its width and height
   */
  private _getImgSize$(imageSrc: string): Observable<IImageFile> {
    var image = new Image();
    let loadedImg$ = fromEvent(image, "load").pipe(
      take(1),
      map((event: any): IImageFile => {
        return {
          base64: imageSrc,
          width: event.target?.width ?? NaN,
          height: event.target?.height ?? NaN
        };
      })
    );
    image.src = imageSrc;
    return loadedImg$;
  }

}