import { TitleCasePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Pipe({
  name: 'errorText'
})
export class ErrorTextPipe implements PipeTransform {

  /** Print the text corresponding to the priority list defined by the body of this function
   * @param errors The errors object from the form control
   * @returns The text to be displayed
   */
  transform(errors: ValidationErrors): string {
    let text: string = ''

    if(errors['required']){
      let required = errors['required']
      if(typeof required === 'string'){
        if(required === 'area'){
          text = `Fill in the fields to set up the interactive area`
        }else if(required === 'viewport'){
          text = `Fill in the fields to set up the grid`
        }
      }else{
        required = required as string[]
        if(required.length > 1){
          text = 'Some fields are empty'
        }else if(required.length === 1){
          text = `${required[0]} field is empty`
        }
      }      
    }else if(errors['invalidViewport']){
      text = `The grid must have at least two cells`
    }else if(errors['invalidCols']){
      switch(errors['invalidCols']){
        case 'tooFew':
          text = `Columns cannot be less than 1`
          break
        case 'tooMany':
          text = `Columns are too many`
          break
      }
    }else if(errors['invalidRows']){
      switch(errors['invalidRows']){
        case 'tooFew':
          text = `Rows cannot be less than 1`
          break
        case 'tooMany':
          text = `Rows are too many`
          break
      }
    }else if(errors['invalidStart']){
      switch(errors['invalidStart']){
        case 'negativeFrame':
          text = `Start frame cannot be a negative number`
          break
        case 'frameOverflow:col':
          text = `Start frame cannot be higher than columns number`
          break
        case 'frameOverflow:row':
          text = `Start frame cannot be higher than rows number`
          break
        case 'areaNotOnStartTile':
          text = `The area is not on the start tile`
          break
      }
    }else if(errors['invalidEnd']){
      switch(errors['invalidEnd']){
        case 'negativeFrame':
          text = `End frame cannot be a negative number`
          break
        case 'frameOverflow:col':
          text = `End frame cannot be higher than columns number`
          break
        case 'frameOverflow:row':
          text = `End frame cannot be higher than rows number`
          break
      }
    }else if(errors['invalidRange']){
      switch(errors['invalidRange']){
        case 'sameFrame':
          text = `Start and end frames cannot be the same`
          break
      }
    }else if(errors['invalidDirection']){
      switch(errors['invalidDirection']){
        case 'noHorizontalSpace':
          text = `Cannot move sheet horizontally, columns is 1`
          break
        case 'noVerticalSpace':
          text = `Cannot move sheet vertically, rows is 1`
          break
      }
    }

    return text;
  }

}
