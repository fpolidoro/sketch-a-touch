import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-guide-dialog',
  templateUrl: './guide-dialog.component.html',
  styleUrls: ['./guide-dialog.component.scss']
})
export class GuideDialogComponent implements OnInit {

  constructor(private _dialogRef: MatDialogRef<GuideDialogComponent>) { }

  ngOnInit(): void {
  }

  close(): void {
    this._dialogRef.close()
  }
}