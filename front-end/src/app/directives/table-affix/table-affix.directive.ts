import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, Inject, Input, Renderer2, SimpleChanges } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { SingletonService } from 'src/app/services/singleton.service';
import { WindowReferenceService } from 'src/app/services/window-reference.service';

interface tableAffix {
  disable?: boolean,
  scrollX?: number
}
@Directive({
  selector: '[tableAffix]'
})
export class TableAffixDirective {

  // declare the property of the directive to access the input value 
  @Input() tableAffix: tableAffix;

  destroy$: Subject<any> = new Subject();

  // the mutation observer of for auto update
  observer: MutationObserver;

  clone: HTMLElement;

  wrapperTable: HTMLTableElement;

  wrapperDiv: HTMLElement;

  originalTable: HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private windowRef: WindowReferenceService,
    @Inject(DOCUMENT) private doc: Document,
    private ss: SingletonService) { }


  ngOnChanges(values: SimpleChanges) {
    if (values.tableAffix && (values.tableAffix.currentValue != values.tableAffix.previousValue)) {

    }
  }


  setCloneTableWidth() {
    // for each table header cell set the width of the table header cell in the clone 
    let originalWidth = this.originalTable.getBoundingClientRect().width;
    this.wrapperTable.style.width = originalWidth + 'px';
  }

  ngAfterViewInit() {

    this.ss.sideBarToggle$.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      setTimeout(() => {
        let width = getComputedStyle(this.el.nativeElement).width;
        this.setCloneTableWidth()
        this.wrapperDiv.style.width = width
        this.renderer.setStyle(this.wrapperDiv, 'width', width + 'px')
      }, 450)
    })
    this.wrapperDiv = document.createElement('div');
    this.wrapperTable = document.createElement('table');
    let targetNode = this.el.nativeElement.querySelector('thead');
    this.originalTable = this.el.nativeElement.querySelector('table');
    this.wrapperTable.appendChild(targetNode.cloneNode(true));
    this.wrapperDiv.appendChild(this.wrapperTable);

    this.setCloneTableWidth() 
    this.renderer.insertBefore(this.el.nativeElement.parentNode, this.wrapperDiv, this.el.nativeElement);
    this.wrapperDiv.style.display = 'none';

    this.wrapperDiv.style.overflowX = 'hidden'

    fromEvent(this.el.nativeElement, 'scroll').pipe(takeUntil(this.destroy$)).subscribe(e => {
      this.wrapperDiv.scrollLeft = this.el.nativeElement.scrollLeft
    });

    fromEvent(this.windowRef.nativeWindow, 'scroll').pipe(takeUntil(this.destroy$)).subscribe(e => {


      let reference = this.originalTable;

      let target = (<HTMLElement>this.wrapperTable.querySelector('thead'));

      let targetRect = target.getBoundingClientRect();

      let referenceRect = reference.getBoundingClientRect();

      let width = getComputedStyle(this.el.nativeElement).width;
      this.wrapperDiv.style.width = width


      if (referenceRect.top < 0 && (referenceRect.bottom - targetRect.height) > 0) {
        console.log('in range')
        this.wrapperDiv.classList.add('affix-target');
        this.wrapperDiv.style.display = reference.style.display;
      } else {
        console.log('out of range')
        this.wrapperDiv.classList.remove('affix-target')
        this.wrapperDiv.style.display = 'none'
      }

    })
  }

  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete();
  }



  cloneElement() {
    // if (!this.clone) {
    //   this.wrapperTable = document.createElement('table');
    //   this.wrapperTable.insertAdjacentHTML('afterbegin','<thead></thead>')
    //   // let clone = (<HTMLElement>this.el.nativeElement).cloneNode(true);
    //   // this.clone = (<HTMLElement>clone);
    //   // this.wrapperDiv.appendChild(this.clone);
    //   // this.wrapperDiv.style.display = 'none';
    //   this.renderer.insertBefore(this.el.nativeElement.parentNode, this.wrapperTable, this.el.nativeElement)
    // } else {
    //   this.renderer.removeChild(this.wrapperTable.parentNode, this.wrapperTable);
    //   this.clone = undefined;
    //   this.wrapperTable = undefined
    //   this.cloneElement();
    // }
  }
}
