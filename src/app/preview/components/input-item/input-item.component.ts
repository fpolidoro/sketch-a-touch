import { Component, OnInit } from '@angular/core';
import { IItem } from '@preview/interfaces/files';

@Component({
  selector: 'input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.scss']
})
export class InputItemComponent implements OnInit {

  readonly areaType: IItem[] = [
    { icon: 'circle', label: 'Circle' },
    { icon: 'rectangle', label: 'Rectangle' }
  ]
  readonly direction: IItem[] = [
    { icon: 'swap_horiz', label: 'Row' },
    { icon: 'swap_vert', label: 'Column' }
  ]
  
  constructor() { }

  ngOnInit(): void {
  }

}
