import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isNan'
})
export class IsNanPipe implements PipeTransform {

  transform(value: any): boolean {
    return isNaN(value);
  }

}
