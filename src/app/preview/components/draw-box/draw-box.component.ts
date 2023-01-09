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
  ctx: CanvasRenderingContext2D|null = null
  viewport?: ISize
  area?: IRect

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
    this.ctx = this.canvas.nativeElement.getContext('2d')
    const mouseDownStream = fromEvent(this.canvas.nativeElement, 'mousedown')
    const mouseMoveStream = fromEvent(this.canvas.nativeElement, 'mousemove')
    const mouseUpStream = fromEvent(window, 'mouseup')
    let startX: number
    let startY: number
    let endX: number
    let endY: number
    let path: Path2D// = new Path2D()
    mouseDownStream.pipe(
      map((event: Event) => event as MouseEvent),
      tap((event: MouseEvent) => {
        this.ctx?.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height)
        this.ctx!.beginPath();
        this.ctx!.strokeStyle = 'red';
        this.ctx!.lineWidth = 5;
        this.ctx!.moveTo(event.offsetX, event.offsetY);
        startX = event.offsetX
        startY = event.offsetY
        endX = 0
        endY = 0
        path = new Path2D()
        path.arc(startX, startY, 1, 0, 2*Math.PI)
        this.ctx!.stroke(path)
      }),
      switchMap(() => mouseMoveStream.pipe(
        map((event: Event) => event as MouseEvent),
        tap((event: MouseEvent) => {
          this.ctx?.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height)
          endX = event.offsetX
          endY = event.offsetY
          path = new Path2D()
          this.ctx?.beginPath()
          let xx = Math.pow(endX-startX, 2)
          let yy = Math.pow(endY-startY, 2)
          let distance = Math.sqrt(xx + yy)
          path.arc(startX, startY, distance, 0, 2*Math.PI)
          this.ctx!.stroke(path)
        }),
        takeUntil(mouseUpStream),
        finalize(() => {
          this.area = {
            x: startX,
            y: startY,
            w: endX,
            h: endY
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
