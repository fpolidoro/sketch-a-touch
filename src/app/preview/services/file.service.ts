import { Injectable } from '@angular/core';
import { IImageFile, ISize, IViewport } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  private _fileUploadSource: ReplaySubject<IImageFile> = new ReplaySubject<IImageFile>(1)
  private _viewportSource: ReplaySubject<IViewport> = new ReplaySubject<IViewport>(1)
  private _interactiveAreaSource: ReplaySubject<IArea> = new ReplaySubject<IArea>(1)
  private _interactiveAreaRequestSource: ReplaySubject<'circle'|'rect'> = new ReplaySubject<'circle'|'rect'>(1)

  /** Notifies the selection of a file
   * @param base64file The image to announce, encoded with base64
   */
  uploadFile(base64file: IImageFile): void {
    this._fileUploadSource.next(base64file)
  }

  /** Observes the changes on the selected image
   * @returns The selected image
   */
  fileUploaded$: Observable<IImageFile> = this._fileUploadSource.asObservable()

  /** Notifies the changes in the size of the viewport (width and height)
   * @param viewport The new size of the viewport
   */
  viewportChange(viewport: IViewport): void {
    this._viewportSource.next(viewport)
  }

  /** Observes the size changes of the viewport */
  viewportChanged$ = this._viewportSource.asObservable()

  announceInteractiveArea(area: IArea): void {
    this._interactiveAreaSource.next(area)
  }

  interactiveAreaAnnounced$ = this._interactiveAreaSource.asObservable()

  requestInteractiveArea(request: 'circle'|'rect'): void {
    this._interactiveAreaRequestSource.next(request)
  }

  interactiveAreaRequested$ = this._interactiveAreaRequestSource.asObservable()
}
