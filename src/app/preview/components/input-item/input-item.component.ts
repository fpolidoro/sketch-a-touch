import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlContainer, ControlValueAccessor, FormArray, FormControl, FormControlStatus, FormGroup, UntypedFormArray, ValidationErrors } from '@angular/forms';
import { IItem, INestedItem, IViewport } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';
import { Subject, debounceTime, filter, map, of, startWith, take, takeUntil, withLatestFrom } from 'rxjs';

@Component({
  selector: 'input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.scss']
})
export class InputItemComponent implements OnInit, OnDestroy {
  @Input() area?: IArea

  form: FormGroup = new FormGroup({
    gesture: new FormControl(),
    from: new FormControl<number>(NaN),
    to: new FormControl<number>(NaN),
    direction: new FormControl(),
    allowUndo: new FormControl(true)
  })

  readonly areaType: IItem[] = [
    { icon: 'circle', label: 'Circle', value: 'circle' },
    { icon: 'rectangle', label: 'Rectangle', value: 'rect' }
  ]
  readonly direction: IItem[] = [
    { icon: 'swap_horiz', label: 'Row', value: 'row' },
    { icon: 'swap_vert', label: 'Column', value: 'col' }
  ]
  readonly gestures: INestedItem[] = [
    { label: 'Tap', value: 'tap' },
    { label: 'Double tap', value: 'double-tap' },
    { label: 'Long press', value: 'long-press' },
    { label: 'Swipe', items: [
      { label: 'Swipe left',value: 'swipe-left'  },
      { label: 'Swipe right', value: 'swipe-right' },
    ] },
    { label: 'Pinch', items: [
      { label: 'Pinch in', value: 'pinch-in' },
      { label: 'Pinch out', value: 'pinch-out' },
    ]}
  ]

  private _destroy$: Subject<void> = new Subject<void>()
  
  constructor(private _parent: ControlContainer, private _fileService: FileService) { }

  ngOnInit(): void {
    if(this.area === undefined){
      throw new Error(`Cannot initialize input-item component because @Input area is undefined`)
    }else{
      (this._parent.control as FormArray).push(this.form) //add form to parent, which is an array of input-item
      this.form.addAsyncValidators(this._asyncFormValidator)
      this._fileService.viewportChanged$.pipe(  //observe changes on viewport size...
        debounceTime(200),
        takeUntil(this._destroy$)
      ).subscribe(() => this.form.updateValueAndValidity()) //...and update the validity of the form

      // this.form.statusChanges.pipe(
      //   takeUntil(this._destroy$),
      //   filter((status: FormControlStatus) => status === 'INVALID')
      // ).subscribe(() => {
      //   console.log(`reviewing validity of children`)
      //   if(this.form.errors !== null){
      //     console.log(Object.keys(this.form.controls))
      //     for(let key in Object.keys(this.form.controls)){
      //       if(this.form.controls[key] !== undefined) this.form.controls[key].setErrors(null, {emitEvent: false})
      //     }

      //     if(this.form.errors['invalidStart'] !== undefined || (this.form.errors['required'] !== undefined && this.form.errors['required'].includes('from') && this.form.dirty)){
      //       this.form.controls['from'].setErrors({ invalid: true }, {emitEvent: false})
      //     }
      //     if(this.form.errors['invalidEnd'] !== undefined || (this.form.errors['required'] !== undefined && this.form.errors['required'].includes('to') && this.form.dirty)){
      //       this.form.controls['to'].setErrors({ invalid: true }, {emitEvent: false})
      //     }
      //     if(this.form.errors['invalidRange'] !== undefined){
      //       this.form.controls['from'].setErrors({ invalid: true }, {emitEvent: false})
      //       this.form.controls['to'].setErrors({ invalid: true }, {emitEvent: false})
      //     }
      //     if(this.form.errors['invalidDirection'] !== undefined || (this.form.errors['required'] !== undefined && this.form.errors['required'].includes('direction') && this.form.dirty)){
      //       this.form.controls['direction'].setErrors({ invalid: true }, {emitEvent: false})
      //     }
      //     if(this.form.errors['required'] !== undefined && this.form.errors['required'].includes('gesture') && this.form.dirty){
      //       this.form.controls['gesture'].setErrors({ invalid: true }, {emitEvent: false})
      //     }
      //   }
      // })
    }
  }

  ngOnDestroy(): void {
    //send the destroy signal to all the observers
    this._destroy$.next()
    this._destroy$.complete()
  }

  private _asyncFormValidator = (control: AbstractControl) => {
    return control.valueChanges.pipe(
      withLatestFrom(this._fileService.viewportChanged$),
      debounceTime(100),
      take(1),
      map(([values, viewport]) => {
        let result: ValidationErrors|null = null
        console.log(`validating form`)
        if(Object.keys(values).every(k => values[k] === null || values[k] === undefined)){
          result = { required: true }
        }else{
          if(!values.gesture){
            result = { required: ['gesture'] }
          }

          if(+values.from < 0){
            result = Object.assign(result === null ? {} : result, { invalidStart: 'negativeFrame' })
          }else if(values.from === null || values.from === undefined || isNaN(values.from)){
            if(result !== null && result['required'] && result['required'].length > 0){
              result['required'].push('from')
            }else{
              result = Object.assign(result === null ? {} : result, { required: ['from'] })
            }
          }

          if(+values.to < 0){
            result = Object.assign(result === null ? {} : result, { invalidEnd: 'negativeFrame' })
          }else if(values.to === null || values.to === undefined || isNaN(values.to)){
            if(result !== null && result['required'] && result['required'].length > 0){
              result['required'].push('to')
            }else{
              result = Object.assign(result === null ? {} : result, { required: ['to'] })
            }
          }

          //the two frames are the same, so the animation would be a single frame, thus invalid
          if(!isNaN(values.from) && !isNaN(values.to) &&  +values.from === +values.to){
            result = Object.assign(result === null ? {} : result, { invalidRange: 'sameFrame' })
          }
          
          if(values.direction){
            if(values.direction.label === 'Row'){
              if(viewport.cols === 1){
                result = Object.assign(result === null ? {} : result, { invalidDirection: 'noHorizontalSpace' })
              }
              if(+values.to >= viewport.cols){
                result = Object.assign(result === null ? {} : result, { invalidEnd: 'frameOverflow:col' })
              }
              if(+values.from >= viewport.cols){
                result = Object.assign(result === null ? {} : result, { invalidStart: 'frameOverflow:col'})
              }
            }else if(values.direction.label === 'Column'){
              if(viewport.rows === 1){
                result = Object.assign(result === null ? {} : result, { invalidDirection: 'noVerticalSpace' })
              }
              if(+values.to >= viewport.rows){
                result = Object.assign(result === null ? {} : result, { invalidEnd: 'frameOverflow:row' })
              }
              if(+values.from >= viewport.rows){
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
