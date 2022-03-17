import { Component, HostBinding, Inject, OnInit, Optional, Self, TemplateRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


type PopUpData = { heading?: any, hideFooterButtons?: boolean, showCloseButton?: boolean, maxWidth?: any, template ?:TemplateRef<any> }
@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.scss']
})
export class PopUpComponent implements OnInit {

  // default settings data for the pop up
  defaultData: PopUpData = {
    heading: 'Heading',
    hideFooterButtons: false,
    showCloseButton: true,
    maxWidth: '420px',
    template:null
  }

  /* merged data passed with default data */
  dataMerged: PopUpData = this.defaultData;


  constructor(@Inject(MAT_DIALOG_DATA) public data: PopUpData) {
    console.log(data)
    this.dataMerged = { ...this.defaultData, ...data }
  }

  ngOnInit(): void {
  }

  @HostBinding('style.max-width') get maxWidth() {
    return this.dataMerged.maxWidth;
  }

}
