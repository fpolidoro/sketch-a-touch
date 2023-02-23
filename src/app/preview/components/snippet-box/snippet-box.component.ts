import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'snippet-box',
  templateUrl: './snippet-box.component.html',
  styleUrls: ['./snippet-box.component.scss']
})
export class SnippetBoxComponent implements OnInit, OnDestroy {
  @Input() title!: string
  @Input() code!: string

  copy$: Subject<void> = new Subject<void>()

  private _subscription?: Subscription

  constructor() { }

  ngOnInit(): void {
    if(this.title === undefined || this.code === undefined){
      throw new Error(`Cannot initialize snippet-box component as one or more @Input are undefined`)
    }else{
  
    }
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
  }

}
