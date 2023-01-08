import { Component, OnInit } from '@angular/core';
import { debounceTime, exhaustMap, filter, finalize, fromEvent, map, Observable, Subject, Subscription, take, tap } from 'rxjs';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'settings-box',
  templateUrl: './settings-box.component.html',
  styleUrls: ['./settings-box.component.scss']
})
export class SettingsBoxComponent implements OnInit {
  selectedFiles: any
  currentFile: any
  upload$: Subject<void> = new Subject<void>()

  uploadingData: boolean = false

  private _subscriptions?: Subscription

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    this._subscriptions = this.upload$.pipe(
      debounceTime(100),
      filter(() => this.selectedFiles),
      tap(() => {
        this.uploadingData = true
        const file: File | null = this.selectedFiles.item(0)
      
        if (file) {
          this.currentFile = file;
    
          const reader = new FileReader();
    
          reader.onload = (e: any) => {
            this._fileService.uploadFile(e.target.result)
          };
    
          reader.readAsDataURL(this.currentFile)
        }
    
        this.selectedFiles = undefined
        this.uploadingData = false
      })
      //exhaustMap(() => )
    ).subscribe()
  }

  ngOnDestroy(){
    this._subscriptions?.unsubscribe()
  }

  selectFile(event: any): void {
    this.selectedFiles = event.target.files
  }

  upload(): void {
    if (this.selectedFiles) {
      const file: File | null = this.selectedFiles.item(0)
  
      if (file) {
        this.currentFile = file;
  
        const reader = new FileReader();
  
        reader.onload = (e: any) => {
          //console.log(e.target.result)
          this._fileService.uploadFile(e.target.result)
        };
  
        reader.readAsDataURL(this.currentFile)
      }
  
      this.selectedFiles = undefined
    }
  }
  

  /*getImgSize(imageSrc: string): Observable<ISize> {
    var image = new Image();
    let loadedImg$ = fromEvent(image, "load").pipe(
      take(1),
      map((event): ISize => {
        return {
          width: event.target.width,
          height: event.target.height
        };
      })
    );
    image.src = imageSrc;
    return loadedImg$;
  }*/

}

interface ISize { width: number; height: number; }