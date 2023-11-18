import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlContainer, FormArray, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { IItem, INestedItem } from '@preview/interfaces/files';
import { IArea } from '@preview/interfaces/shapes';
import { FileService } from '@preview/services/file.service';
import { Subject, debounceTime, defer, filter, iif, map, merge, take, takeUntil, tap, withLatestFrom } from 'rxjs';

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
      this.form.controls['from'].disable()  //disable it because it is automatically filled by direction
      this.form.addAsyncValidators(this._asyncFormValidator)
      merge(
        this._fileService.viewportChanged$,
        this._fileService.interactiveAreaDragged$.pipe(
          filter(area => area.area === this.area),
        )
      ).pipe(  //observe changes on viewport size...
        debounceTime(200),
        takeUntil(this._destroy$)
      ).subscribe(() => this.form.updateValueAndValidity()) //...and update the validity of the form
    }
  }

  ngOnDestroy(): void {
    //send the destroy signal to all the observers
    this._destroy$.next()
    this._destroy$.complete()
  }

  private _asyncFormValidator = (control: AbstractControl) => {
    return control.valueChanges.pipe(
      tap((values) => { //before validation...
        values.from = this.form.controls['from'].value  //add the from field to the values to be validated, because, being from disabled, its value is not included in values
        let direction = values.direction
        if(direction !== null && direction !== undefined){  //if direction has changed, update the value of from so that it displays the index of the tile where the area is
          let from = this.form.controls['from'] as FormControl
          if(direction.value === 'row'){
             //the event is not emitted because it would trigger the validation again. OnlySelf is to prevent the parent group from being told that from changed. If onlySelf were false,
             //the validation would stop
            from.setValue(this.area?.pos.c, { emitEvent: false, onlySelf: true })
          }else if(direction.value === 'col'){
            from.setValue(this.area?.pos.r, { emitEvent: false, onlySelf: true })
          }
        }
      }),
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
            /*if(result !== null && result['required'] && result['required'].length > 0){
              result['required'].push('from')
            }else{
              result = Object.assign(result === null ? {} : result, { required: ['from'] })
            }*/
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

          //check whether the area is on the start tile
          if(result === null && values.direction !== null &&
            ((values.direction.label === 'Row' && +values.from !== this.area?.pos.c) ||
            (values.direction.label === 'Column' && +values.from !== this.area?.pos.r))
          ){
            result = { invalidStart: 'areaNotOnStartTile' }
          }
        }

        //console.log(result)
        return result
      })
    )
  }
}
