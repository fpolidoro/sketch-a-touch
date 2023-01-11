import { Pipe, PipeTransform } from '@angular/core';
import { IArea, ICircle, IRect } from '@preview/interfaces/shapes';

@Pipe({
  name: 'castShape'
})
export class CastShapePipe implements PipeTransform {

  transform(value: IArea, ...args: unknown[]): any {
    let result
    switch(value.type){
      case 'circle':
        result = value as ICircle
        break
      case 'rectangle':
        result = value as IRect
        break
      default:
        result = value as IArea
    }

    return result;
  }

}
