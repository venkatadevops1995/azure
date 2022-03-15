import { Component, Inject, OnInit, TemplateRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.scss']
})
export class PopUpComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: { heading: string   }) { }

  ngOnInit(): void {
  }

}
