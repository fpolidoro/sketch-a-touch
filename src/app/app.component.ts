import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileService } from '@preview/services/file.service';
import { debounceTime, Subject, tap, withLatestFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'sketch-a-touch';

  /** Defines the state of the drawer (open/closed) */
  openDrawer$ = this._fileService.codeDrawerOpened$.pipe(
    tap((opened: boolean) => this._fileService.changeDrawerStatus(opened))  //notify the observers that the change has been well received
  )
  /** Emits whenever the drawer issues a `closedStart` event */
  closeDrawer$ = new Subject<void>()

  constructor(private _fileService: FileService, private _snackBar: MatSnackBar){ }

  ngOnInit(): void {
    //this._fileService.toggleCodeDrawer(true)  //debug
    this.closeDrawer$.pipe(
      debounceTime(100),
      withLatestFrom(this._fileService.codeDrawerOpened$) //get the current status of the drawer (on template)
    ).subscribe(([_, status]) => {
      if(status){ //if the current status is open, it means that we clicked on the backdrop...
        this._fileService.toggleCodeDrawer(false) //...so trigger a change on the codeDrawerOpened$
      }else{  //the status of the drawer is already the right one, notify everyone that it changed
        this._fileService.changeDrawerStatus(false)
      }
    })

    this._fileService.notImplementedSnackbar$.pipe(
      debounceTime(100)
    ).subscribe(() => this._snackBar.open('Not yet implemented', 'OK', {duration: 2000}))
  }
}
