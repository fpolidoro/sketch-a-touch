import { Component } from '@angular/core';
import { FileService } from '@preview/services/file.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'q-generator';

  openDrawer$ = this._fileService.codeDrawerOpened$.pipe(
    tap((opened: boolean) => this._fileService.changeDrawerStatus(opened))
  )

  constructor(private _fileService: FileService){ }
}
