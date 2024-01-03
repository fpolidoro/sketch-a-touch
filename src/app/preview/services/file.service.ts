import { Injectable } from '@angular/core';
import { FormArray } from '@angular/forms';
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
  private _interactiveAreaRequestSource: ReplaySubject<'circle'|'rectangle'> = new ReplaySubject<'circle'|'rectangle'>(1)
  private _interactiveAreaActionSource: ReplaySubject<'ok'|'reset'|'cancel'|null> = new ReplaySubject<'ok'|'reset'|'cancel'|null>(1)
  private _interactiveAreaSelectSource: ReplaySubject<number> = new ReplaySubject<number>(1)
  private _interactiveAreaDraggedSource: ReplaySubject<IAreaDragged> = new ReplaySubject<IAreaDragged>(1)
  private _deleteInteractiveAreaSource: ReplaySubject<number> = new ReplaySubject<number>(1)
  private _formArraySource: ReplaySubject<FormArray> = new ReplaySubject<FormArray>(1)
  private _toggleCodeDrawerSource: ReplaySubject<boolean> = new ReplaySubject<boolean>(1)
  private _drawerStatusSource: ReplaySubject<boolean> = new ReplaySubject<boolean>(1)
  private _deployModeSource: ReplaySubject<boolean> = new ReplaySubject<boolean>(1)

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

  /** Advertises the successful creation of an interactive area
   * @param area The area to advertise
   */
  announceInteractiveArea(area: IArea): void {
    this._interactiveAreaSource.next(area)
    console.log(area)
  }

  /** Observes the changes of the interactive area drawn on the sprite sheet */
  interactiveAreaAnnounced$ = this._interactiveAreaSource.asObservable()

  /** Requests the creation of an interactive area
   * @param request The shape of the area that must be drawn on the sprite sheet
  */
  requestInteractiveArea(request: 'circle'|'rectangle'): void {
    this._interactiveAreaRequestSource.next(request)
  }
  /** Listens to the requests issued by {@link requestInteractiveArea} */
  interactiveAreaRequested$ = this._interactiveAreaRequestSource.asObservable()

  /** Announces the end of the dragging action on a specific interactive area
   * @param area The area being dragged
   * @param index The position of the area within the list of interactive areas
   */
  interactiveAreaDragEnded(area: IArea, index: number): void {
    this._interactiveAreaDraggedSource.next({area: area, index: index})
  }

  /** Observes the release event of the area being dragged */
  interactiveAreaDragged$ = this._interactiveAreaDraggedSource.asObservable()  

  /** Tells whether the interactive area should be saved, discarded or reset
   * @param action The action that defines what will happen to the interactive area:
   * - `ok`, if the area is valid and it should be accepted
   * - `reset`, if the area is to be discarded so that the user can draw another one
   * - `cancel`, if the user decided to stop drawing the area on the sprite sheet
   */
  actionForInteractiveArea(action: 'ok'|'cancel'|'reset'|null): void {
    this._interactiveAreaActionSource.next(action)
  }
  /** Observes the action that should be taken after the interactive area has been
   * drawn on the sprite sheet */
  interactiveAreaActionChanged$ = this._interactiveAreaActionSource.asObservable()

  /** Notifies a change in the selection of interactive areas
   * @param index The index of the interactive area that is currently selected
   */
  selectInteractiveArea(index: number): void {
    this._interactiveAreaSelectSource.next(index)
  }

  /** Observes selection changes in the list of the interactive areas */
  selectedInteractiveAreaChanged$ = this._interactiveAreaSelectSource.asObservable()

  /** Issue the command to delete the interactive area specified by {@link selected}
   * @param selected The index of the interactive area to delete
  */
  deleteInteractiveArea(selected: number): void {
    this._deleteInteractiveAreaSource.next(selected)
  }

  /** Observes the index of the interactive area to be deleted */
  interactiveAreaDeleted$ = this._deleteInteractiveAreaSource.asObservable()

  /** Used by {@link SettingsBoxComponent} to share its FormArray */
  shareFormArray(array: FormArray): void {
    this._formArraySource.next(array)
  }
  /** Allows components to watch the FormArray defined in {@link SettingsBoxComponent}, which contains
   * all the {@link InputItemComponent} corresponding to interactive areas drawn on {@link LiveBoxComponent}
   */
  formArray$ = this._formArraySource.asObservable()

  toggleCodeDrawer(open: boolean): void {
    this._toggleCodeDrawerSource.next(open)
  }

  codeDrawerOpened$ = this._toggleCodeDrawerSource.asObservable()

  changeDrawerStatus(opened: boolean): void {
    this._drawerStatusSource.next(opened)
  }

  drawerStatusChanged$ = this._drawerStatusSource.asObservable()

  /** Change the deploy mode of the prototype: if the prototype is deployed locally, the HTML file will be
   * changed to refer to the CSS and JS files generated by the application; if the prototype is to be 
   * deployed online, the connection between files will be done by the online platform
   * @param deployLocally Whether the prototype should be deployed locally or online
   */
  changeDeployMode(deployLocally: boolean): void {
    this._deployModeSource.next(deployLocally)
  }

  /** Observes the changes to deploy mode. If true, the prototype will be deployed locally so the HTML file will be
   * changed accordingly
   */
  deployModeChanged$ = this._deployModeSource.asObservable()
}

/** Bundle for the interactive area being dragged */
export interface IAreaDragged {
  /** The area being dragged */
  area: IArea,
  /** Position of the area within the list of interactive areas drawn on the canvas */
  index: number
}