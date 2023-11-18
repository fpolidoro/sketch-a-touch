import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, FormControlStatus, FormGroup } from '@angular/forms';

@Pipe({
  name: 'errorDetector',
})
export class ErrorDetectorPipe implements PipeTransform {

  /** Define whether the control specified by formControlName must be highlighted in red to signal the error
   * @param status The status of the parent control. This is the trigger for this pipe: the pipe is called whenever the status of the control changes
   * @param control The parent control that contains the formControls named by formControlName
   * @param formControlName The name of the formControl to be checked and, if necessary, highlighted in red
   * @returns True if the control must be highlighted in red, false otherwise
   */
  transform(status: FormControlStatus|null, control: FormGroup, formControlName: string): boolean {
    let shouldSetRedColor = false
    
    if(status !== null && control && formControlName){
      if(control.errors !== null){
        if(Object.keys(control.controls).includes(formControlName)){
          if(control.hasError('required') && control.errors['required'].includes(formControlName) && control.dirty){
            shouldSetRedColor = true
          }/*else if(formControlName === 'from' && (control.hasError('invalidStart') || control.hasError('invalidRange'))){
            shouldSetRedColor = true
          }*/else if(formControlName === 'to' && (control.hasError('invalidEnd') || control.hasError('invalidRange'))){
            shouldSetRedColor = true
          }else if(formControlName === 'direction' && control.hasError('invalidDirection')){
            shouldSetRedColor = true
          }
        }
      }
    }

    return shouldSetRedColor;
  }

}
