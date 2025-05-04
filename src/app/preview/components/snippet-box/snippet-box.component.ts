import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FileService } from '@preview/services/file.service';
import { Subject, Subscription, tap } from 'rxjs';

@Component({
  selector: 'snippet-box',
  templateUrl: './snippet-box.component.html',
  styleUrls: ['./snippet-box.component.scss']
})
export class SnippetBoxComponent implements OnInit, OnDestroy {
  @Input() title!: string
  @Input() type!: 'html' | 'css' | 'js'

  copy$: Subject<void> = new Subject<void>()

  private _subscription?: Subscription

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    if(this.title === undefined || this.type === undefined){
      throw new Error(`Cannot initialize snippet-box component as one or more @Input are undefined`)
    }else{
      this._subscription = this.copy$.pipe(
        tap(() => this._fileService.notImplementedSnackbar()),
      ).subscribe()
    }
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }

}
