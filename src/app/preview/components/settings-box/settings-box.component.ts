import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, defer, exhaustMap, filter, finalize, fromEvent, iif, map, mergeMap, Observable, of, Subject, Subscription, switchMap, take, tap } from 'rxjs';
import { FileService } from '@preview/services/file.service';
import { IImageFile, IViewport } from '@preview/interfaces/files';
import { IInteractiveArea } from '@preview/interfaces/shapes';

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
    })
  })

  areas: IInteractiveArea[] = []
  tmpArea?: FormGroup

  drawing: boolean = false
  showShapes: boolean = false

  selectFile$: Subject<void> = new Subject<void>()
  addInteractiveArea$: Subject<void> = new Subject<void>()
  selectAreaType$: Subject<[Event, 'circle'|'rect']> = new Subject<[Event, 'circle'|'rect']>()
  doneDrawing$: Subject<[Event, 'ok'|'reset'|'cancel']> = new Subject<[Event, 'ok'|'reset'|'cancel']>()

  private _subscriptions?: Subscription[]

  constructor(private _fileService: FileService) { }

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
        tap(() => this.showShapes = true),
        exhaustMap(() => this.selectAreaType$.pipe( //click on shape type
          tap(([event, what]) => {
            event.stopPropagation() //prevent the event to bubble up to parent, or it will trigger again the addInteractiveArea$
            console.log(`requested a ${what}`)
            this.drawing = true
          }),
          exhaustMap(() => this.doneDrawing$.pipe(  //click on the done buttons
            tap(([event, outcome]) => {
              event.stopPropagation()
              console.log(outcome)
            }),
            mergeMap(([event, outcome]) => iif( //reset the view based on the clicked button
              () => outcome === 'reset',
              defer(() => of(true).pipe(
                tap(() => console.log(`area must be reset`))
              )),
              defer(() => of(false).pipe(
                tap(() => {
                  this.drawing = false
                }),
                /*filter(() => outcome === 'ok'),
                tap(() => console.log(`Area was ok`))*/
              ))
            ))
          )),
        )),
        tap((shouldShow: boolean) => this.showShapes = shouldShow)
      ).subscribe()
    ]
  }

  ngOnDestroy(){
    this._subscriptions?.forEach(s => s.unsubscribe())
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