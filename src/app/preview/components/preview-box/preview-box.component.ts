import { Component, HostListener, OnInit } from '@angular/core';
import { ISize, IViewport } from '@preview/interfaces/files';
import { FileService } from '@preview/services/file.service';
import { Observable, Subject, combineLatest, merge, tap } from 'rxjs';

@Component({
  selector: 'preview-box',
  templateUrl: './preview-box.component.html',
  styleUrls: ['./preview-box.component.scss']
})
export class PreviewBoxComponent implements OnInit {

  viewportSize: ISize = { width: 0, height: 0 }
  panelHeight: number = 0
  panelWidth: number = 0

  private _windowSize$: Subject<ISize> = new Subject<ISize>()

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    combineLatest([
      this._fileService.fileUploaded$,
      this._fileService.viewportChanged$,
      this._windowSize$.pipe(
        tap((size: ISize) => {
          let aspectRatio = size.height/size.width
          this.panelHeight = size.height
          this.panelWidth = (size.width*0.2) - 24

          console.log(`${this.panelWidth}x${this.panelHeight}, ar: ${aspectRatio}`)
        })
      )
    ]).subscribe(([file, viewport, size]) => {
      let w = file.width/(viewport.cols > 0 ? viewport.cols : 1)
      let h = file.height/(viewport.rows > 0 ? viewport.rows : 1)
      // if(w > this.panelWidth){ //the width of the viewport is larger than panel's max-width

      // }
      this.viewportSize = {
        width: Math.min(w, this.panelWidth),
        height: w*file.height/file.width
      }
    })
    
    this.onResize(null)
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this._windowSize$.next({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }
}
