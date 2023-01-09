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
    mouseDownStream.pipe(
      map((event: Event) => event as MouseEvent),
      tap((event: MouseEvent) => {
        //this.ctx!.beginPath();
        this.ctx!.strokeStyle = 'red';
        this.ctx!.lineWidth = 5;
        //this.ctx!.lineJoin = 'round';
        //this.ctx!.moveTo(event.offsetX, event.offsetY);
        startX = event.offsetX
        startY = event.offsetY
        endX = 0
        endY = 0
        this.ctx!.strokeRect(startX, startY, endX, endY)
      }),
      switchMap(() => mouseMoveStream.pipe(
        map((event: Event) => event as MouseEvent),
        tap((event: MouseEvent) => {
          this.ctx?.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height)
          endX = event.offsetX-startX
          endY = event.offsetY-startY
          //this.ctx!.lineTo(event.offsetX, event.offsetY);
          this.ctx?.strokeRect(startX, startY, endX, endY)
          this.ctx!.stroke();
        }),
        takeUntil(mouseUpStream),
        finalize(() => {
          //this.ctx!.closePath();
          this.area = {
            x: startX,
            y: startY,
            w: endX,
            h: endY
          }
          console.log(this.area)
        })
      ))
    ).subscribe(console.log);
  }

  ngOnDestroy(): void {
      this._subscription?.unsubscribe()
  }
}
