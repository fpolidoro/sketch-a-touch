import { Component, OnInit } from '@angular/core';
import { FileService } from '@preview/services/file.service';

import * as d3 from 'd3';
import { Observable, Subscription, tap } from 'rxjs';

@Component({
  selector: 'live-box',
  templateUrl: './live-box.component.html',
  styleUrls: ['./live-box.component.scss']
})
export class LiveBoxComponent implements OnInit {
  image$: Observable<String> = this._fileService.fileUploaded$.pipe(
    tap((i) => console.log(`image received: ${i ? 'OK' : 'NULL'}`))
  )

  private _subscription?: Subscription

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }
}
