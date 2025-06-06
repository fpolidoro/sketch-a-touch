import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ISize, IViewport } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';
import { fromEvent, tap, switchMap, takeUntil, finalize, map, Subscription, withLatestFrom, filter, take } from 'rxjs';

@Component({
  selector: 'draw-box',
  templateUrl: './draw-box.component.html',
  styleUrls: ['./draw-box.component.scss']
})
export class DrawBoxComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', {static: true}) canvas!: ElementRef<HTMLCanvasElement>
  type?: 'rectangle'|'circle'

  viewport?: ISize
  area?: IArea
  radius: number = 0
  startX: number = 0
  startY: number = 0
  endX: number = 0
  endY: number = 0

  private _subscriptions: Subscription[] = []
  private _grid?: IViewport

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    this._subscriptions.push(this._fileService.viewportChanged$.pipe(
      withLatestFrom(this._fileService.fileUploaded$),
      filter(([viewport, file]) => file !== null),
    ).subscribe(([viewport, file]) => {
      this.viewport = {
        width: file.width,///(+viewport.cols > 0 ? +viewport.cols : 1),
        height: file.height///(+viewport.rows > 0 ? +viewport.rows : 1)
      }
      this._grid = viewport
      console.warn(this.viewport)
    }))
  }

  ngAfterViewInit(): void {
    const mouseDownStream = fromEvent(this.canvas.nativeElement, 'mousedown')
    const mouseMoveStream = fromEvent(this.canvas.nativeElement, 'mousemove')
    const mouseUpStream = fromEvent(window, 'mouseup')
    
    this._subscriptions.push(this._fileService.interactiveAreaRequested$.pipe(
      //tap((type) => eg(`Received a request for a ${type}`)),
      tap((type: 'circle'|'rectangle') => this.type = type),
      switchMap((type: 'circle'|'rectangle') => mouseDownStream.pipe(
        map((event: Event) => event as MouseEvent),
        tap((event: MouseEvent) => {
          this.startX = event.offsetX
          this.startY = event.offsetY
          this.endX = 0
          this.endY = 0
        }),
        switchMap(() => mouseMoveStream.pipe(
          map((event: Event) => event as MouseEvent),
          tap((event: MouseEvent) => {
            switch(this.type){
              case 'circle':
                this.endX = event.offsetX - this.startX
                this.endY = event.offsetY - this.startY
                let xx = Math.pow(this.endX, 2)
                let yy = Math.pow(this.endY, 2)
                this.radius = Math.sqrt(xx + yy)
                break
              case 'rectangle':
                this.endX = event.offsetX
                this.endY = event.offsetY
                break
            }
          }),
          takeUntil(mouseUpStream),
          switchMap(() => this._fileService.interactiveAreaActionChanged$.pipe(
            filter((action) => action !== null),
            take(1),
            tap((action) => {
              if(action === 'ok'){
                let area = {
                  type: type,
                  x: this.startX,
                  y: this.startY,
                  pos: {
                    c: -1,
                    r: -1
                  }
                }
                switch(type){
                  case 'circle':
                    area = Object.assign(area, {
                      r: this.radius,
                      pos: {
                        c: Math.floor(this.startX/(this.viewport!.width/(+this._grid!.cols > 0 ? +this._grid!.cols : 1))),
                        r: Math.floor(this.startY/(this.viewport!.height/(+this._grid!.rows > 0 ? +this._grid!.rows : 1)))
                      }
                    })
                    console.log(`${this.viewport!.height}/${this._grid!.rows}/${this.startY}`)
                    break
                  case 'rectangle':
                    area = Object.assign(area, {
                      w: this.endX,
                      h: this.endY,
                      pos: {
                        c: Math.floor(this.startX/(this.viewport!.width/(+this._grid!.cols > 0 ? +this._grid!.cols : 1))),
                        r: Math.floor(this.startY/(this.viewport!.height/(+this._grid!.rows > 0 ? +this._grid!.rows : 1)))
                      }
                    })
                }
                this._fileService.announceInteractiveArea(area)
              }
              if(action !== 'reset'){
                this.type = undefined
              }
              //reset the shape
              this.startX = 0
              this.startY = 0
              this.endX = 0
              this.endY = 0
              this.radius = 0
            })
          ))
          /*finalize(() => {
            this.area = {
              type: 'rectangle',
              x: this.startX,
              y: this.startY,
              w: this.endX,
              h: this.endY
            }
            console.log(this.area)
          })*/
        ))
      ))
    ).subscribe())
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe())
  }
}
