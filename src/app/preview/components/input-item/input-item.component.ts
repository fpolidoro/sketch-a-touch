import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlContainer, ControlValueAccessor, FormArray, FormControl, FormGroup, UntypedFormArray, ValidationErrors } from '@angular/forms';
import { IItem, IViewport } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';
import { debounceTime, map, of, startWith, take, withLatestFrom } from 'rxjs';

@Component({
  selector: 'input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.scss']
})
export class InputItemComponent implements OnInit, OnDestroy {
  @Input() area?: IArea

  form: FormGroup = new FormGroup({
    gesture: new FormControl(),
    from: new FormControl(),
    to: new FormControl(),
    direction: new FormControl()
  })

  readonly areaType: IItem[] = [
    { icon: 'circle', label: 'Circle' },
    { icon: 'rectangle', label: 'Rectangle' }
  ]
  readonly direction: IItem[] = [
    { icon: 'swap_horiz', label: 'Row' },
    { icon: 'swap_vert', label: 'Column' }
  ]
  
  constructor(private _parent: ControlContainer, private _fileService: FileService) { }

  ngOnInit(): void {
    if(this.area === undefined){
      throw new Error(`Cannot initialize input-item component because @Input area is undefined`)
    }else{
      (this._parent.control as FormArray).push(this.form) //add form to parent, which is an array of input-item
      this.form.addAsyncValidators(this._asyncFormValidator)
    }
  }

  ngOnDestroy(): void {
    
  }

  private _asyncFormValidator = (control: AbstractControl) => {
    return control.valueChanges.pipe(
      withLatestFrom(this._fileService.viewportChanged$.pipe(
        startWith(<IViewport>{
          rows: 1,
          cols: 1
        })
      )),
      debounceTime(100),
      take(1),
      map(([values, viewport]) => {
        let result: ValidationErrors|null = null
        //console.log(values)
        if(Object.keys(values).every(k => values[k] === null || values[k] === undefined)){
          result = { required: true }
        }else{
          if(!values.gesture){
            result = { required: ['gesture'] }
          }

          if(+values.from < 0){
            result = Object.assign(result === null ? {} : result, { invalidStart: 'negativeFrame' })
          }else if(values.from === null || values.from === undefined){
            if(result !== null && result['required'] && result['required'].length > 0){
              result['required'].push('from')
            }else{
              result = Object.assign(result === null ? {} : result, { required: ['from'] })
            }
          }

          if(+values.to < 0){
            result = Object.assign(result === null ? {} : result, { invalidEnd: 'negativeFrame' })
          }else if(values.to === null || values.to === undefined){
            if(result !== null && result['required'] && result['required'].length > 0){
              result['required'].push('to')
            }else{
              result = Object.assign(result === null ? {} : result, { required: ['to'] })
            }
          }
          
          if(values.direction){
            if(values.direction.label === 'Row'){
              if(viewport.cols === 1){
                result = Object.assign(result === null ? {} : result, { invalidDirection: 'noHorizontalSpace' })
              }
              if(+values.to > viewport.cols){
                result = Object.assign(result === null ? {} : result, { invalidEnd: 'frameOverflow:col' })
              }
              if(+values.from > viewport.cols){
                result = Object.assign(result === null ? {} : result, { invalidStart: 'frameOverflow:col'})
              }
            }else if(values.direction.label === 'Column'){
              if(viewport.rows === 1){
                result = Object.assign(result === null ? {} : result, { invalidDirection: 'noVerticalSpace' })
              }
              if(+values.to > viewport.rows){
                result = Object.assign(result === null ? {} : result, { invalidEnd: 'frameOverflow:row' })
              }
              if(+values.from > viewport.rows){
                result = Object.assign(result === null ? {} : result, { invalidStart: 'frameOverflow:row'})
              }
            }
          }else{
            if(result !== null && result['required'] && result['required'].length > 0){
              result['required'].push('direction')
            }else{
              result = Object.assign(result === null ? {} : result, { required: ['direction'] })
            }
          }
        }

        console.log(result)
        return result
      })
    )
  }
}
