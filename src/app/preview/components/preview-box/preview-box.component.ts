import { Component, HostListener, OnInit } from '@angular/core';
import { IImageFile, ISize, IViewport } from '@preview/interfaces/files';
import { IArea, ITile } from '@preview/interfaces/shapes';
import { FileService, IAreaDragged } from '@preview/services/file.service';
import { Subject, combineLatest, filter, merge, tap } from 'rxjs';

@Component({
  selector: 'preview-box',
  templateUrl: './preview-box.component.html',
  styleUrls: ['./preview-box.component.scss']
})
export class PreviewBoxComponent implements OnInit {

  viewportSize: ISize = { width: 0, height: 0 }
  tile: ITile = { c: -1, r: -1 }
  panelHeight: number = 0
  panelWidth: number = 0
  reductionPerc: number = 1.0
  image?: IImageFile
  originalViewport: IViewport = { cols: 0, rows: 0}
  
  private _areas: IArea[] = []
  private _windowSize$: Subject<ISize> = new Subject<ISize>()

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
    ]).subscribe(([file, viewport, size]) => {
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
        tap((selectedArea: number) => console.log(`Selected area: ${selectedArea}`)),
        filter((selectedArea: number) => !isNaN(selectedArea)),
        tap((selectedArea: number) => this.tile = this._areas[selectedArea].pos))
    ).subscribe()
    
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
