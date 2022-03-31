import { Component, OnInit, ElementRef } from '@angular/core';

@Component({
    selector: 'app-svg',
    template: `
  `,
  styles: []
})
export class SvgComponent implements OnInit {

    constructor(
        private _el: ElementRef
    ) { }

    get el(): ElementRef {
        return this._el;
    }

    ngOnInit() {
    }

}
