import { Component, OnDestroy, OnInit } from '@angular/core';
import { FileService } from '@preview/services/file.service';
import { debounceTime, filter, Subject, Subscription, switchMap, withLatestFrom } from 'rxjs';

@Component({
  selector: 'code-box',
  templateUrl: './code-box.component.html',
  styleUrls: ['./code-box.component.scss']
})
export class CodeBoxComponent implements OnInit, OnDestroy {
  closeDrawer$: Subject<void> = new Subject<void>()

  private _subscription?: Subscription

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    this._subscription = this.closeDrawer$.pipe(
      debounceTime(100),
      switchMap(() => {
        this._fileService.toggleCodeDrawer(false)
        return this._fileService.drawerStatusChanged$.pipe(
          filter((opened: boolean) => !opened)
        )
      })
    ).subscribe()
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }

}
