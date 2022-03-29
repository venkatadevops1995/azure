import { Component, OnInit, Inject, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

type ConfirmPopUpData = { heading: string, confirmMessage?: string, hideFooterButtons?: boolean, showCloseButton?: boolean, maxWidth?: any, template?: TemplateRef<any>, minWidth: any, onlyForAlert?: boolean, showTextbox?: boolean, placeholderTextField?:any }
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

  // default settings data for the pop up
  defaultData: ConfirmPopUpData = {
    heading: 'Confirm',
    confirmMessage: 'Are you sure you want to continue ?',
    hideFooterButtons: false,
    maxWidth: '420px',
    template: null,
    minWidth: '420px',
    showTextbox: false,
    placeholderTextField:'Enter comments'
  }
  
  /* merged data passed with default data */
  dataMerged: ConfirmPopUpData = this.defaultData;

  fcText: FormControl = new FormControl('')

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmPopUpData
  ) {
    this.dataMerged = { ...this.defaultData, ...data }
  }

  ngOnInit(): void {

  }

}
