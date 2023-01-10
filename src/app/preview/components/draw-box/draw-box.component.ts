import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ISize } from '@preview/interfaces/files';
import { IRect } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';
import { fromEvent, tap, switchMap, takeUntil, finalize, map, Subscription, withLatestFrom, filter } from 'rxjs';

@Component({
  selector: 'draw-box',
  templateUrl: './draw-box.component.html',
  styleUrls: ['./draw-box.component.scss']
})
export class DrawBoxComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', {static: true}) canvas!: ElementRef<HTMLCanvasElement>
  viewport?: ISize
  area?: IRect
  radius: number = 0
  startX: number = 0
  startY: number = 0
  endX: number = 0
  endY: number = 0

  type: 'rect'|'circle' = 'rect'

  private _subscription?: Subscription

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    this._subscription = this._fileService.viewportChanged$.pipe(
      withLatestFrom(this._fileService.fileUploaded$),
      filter(([viewport, file]) => file !== null),
    ).subscribe(([viewport, file]) => {
      this.viewport = {
        width: file.width/(+viewport.cols > 0 ? +viewport.cols : 1),
        height: file.height/(+viewport.rows > 0 ? +viewport.rows : 1)
      }
      console.warn(this.viewport)
    })
  }

  ngAfterViewInit() {
    const mouseDownStream = fromEvent(this.canvas.nativeElement, 'mousedown')
    const mouseMoveStream = fromEvent(this.canvas.nativeElement, 'mousemove')
    const mouseUpStream = fromEvent(window, 'mouseup')
    mouseDownStream.pipe(
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
            case 'rect':
              this.endX = event.offsetX
              this.endY = event.offsetY
              break
          }
        }),
        takeUntil(mouseUpStream),
        finalize(() => {
          this.area = {
            type: 'rect',
            x: this.startX,
            y: this.startY,
            w: this.endX,
            h: this.endY
          }
          console.log(this.area)
        })
      ))
    ).subscribe();
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }
}
