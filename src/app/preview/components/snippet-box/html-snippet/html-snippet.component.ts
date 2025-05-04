import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray } from '@angular/forms';
import { FileService } from '@preview/services/file.service';
import { Observable, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'html-snippet',
  templateUrl: './html-snippet.component.html',
  styleUrls: ['./html-snippet.component.scss']
})
export class HtmlSnippetComponent implements OnInit, OnDestroy {

  areas: AbstractControl[] = []
  deployLocally$: Observable<boolean> = this._fileService.deployModeChanged$

  private _onDestroy$: Subject<void> = new Subject<void>()

  constructor(private _fileService: FileService) { }

  ngOnInit(): void {
    this._fileService.formArray$.pipe(
      tap((formArray: FormArray) => this.areas = formArray.controls),
      takeUntil(this._onDestroy$)
    ).subscribe()
  }

  ngOnDestroy(): void {
    this._onDestroy$.next()
    this._onDestroy$.complete()
  }
}
