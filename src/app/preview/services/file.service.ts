import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  private _fileUploadSource: ReplaySubject<String> = new ReplaySubject<String>(1)

  uploadFile(base64file: String): void {
    this._fileUploadSource.next(base64file)
  }

  fileUploaded$: Observable<String> = this._fileUploadSource.asObservable()
}
