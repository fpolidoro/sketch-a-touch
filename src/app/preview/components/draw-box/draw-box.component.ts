import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ISize } from '@preview/interfaces/files';
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
    mouseDownStream.pipe(
      map((event: Event) => event as MouseEvent),
      tap((event: MouseEvent) => {
        this.ctx!.beginPath();
        this.ctx!.strokeStyle = 'red';
        this.ctx!.lineWidth = 5;
        this.ctx!.lineJoin = 'round';
        this.ctx!.moveTo(event.offsetX, event.offsetY);
      }),
      switchMap(() => mouseMoveStream.pipe(
        map((event: Event) => event as MouseEvent),
        tap((event: MouseEvent) => {
          this.ctx!.lineTo(event.offsetX, event.offsetY);
          this.ctx!.stroke();
        }),
        takeUntil(mouseUpStream),
        finalize(() => {
          this.ctx!.closePath();
        })
      ))
    ).subscribe(console.log);
  }

  ngOnDestroy(): void {
      this._subscription?.unsubscribe()
  }
}
