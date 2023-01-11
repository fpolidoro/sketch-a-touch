import { Component, Input, OnInit } from '@angular/core';
import { IItem } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';

@Component({
  selector: 'input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.scss']
})
export class InputItemComponent implements OnInit {
  @Input() area?: IArea

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
    if(this.area === undefined){
      throw new Error(`Cannot initialize input-item component because @Input area is undefined`)
    }else{
      
    }
  }

}
