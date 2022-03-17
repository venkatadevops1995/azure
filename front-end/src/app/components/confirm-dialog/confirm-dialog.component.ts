import { Component, OnInit, Inject, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

  fcText : FormControl = new FormControl('') 

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { confirmMessage: string, template:TemplateRef<any>, showTextbox ?: boolean, placeholderTextField:string, onlyForAlert?:boolean   }
  ) { 
    console.log(data)
  }

  ngOnInit(): void {
    
  }

}
