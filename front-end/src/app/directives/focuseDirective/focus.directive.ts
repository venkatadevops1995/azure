import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appFocus]'
})
export class FocusDirective implements AfterViewInit{

  constructor(private el:ElementRef) { }
  ngAfterViewInit(): void {
    setTimeout(()=>{
      this.el.nativeElement.focus();
    },1000)
 
  }

}
