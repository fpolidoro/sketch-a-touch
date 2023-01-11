import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[flex]'
})
export class FlexDirective implements OnInit {
  @Input('flex') direction: 'row'|'column'|'reverse-row'|'reverse-column'|'' = ''
  @Input('gap') gap?: string


  constructor(private _el: ElementRef, private _renderer: Renderer2) { }

  ngOnInit(): void {
    let element = this._el.nativeElement
    this._renderer.setStyle(element, 'display', 'flex')
    this._renderer.setStyle(element, 'flex-direction', !this.direction ? 'row' : this.direction);
    if(this.gap !== undefined)
      this._renderer.setStyle(element, 'gap', `${+this.gap}px`)
  }
}
