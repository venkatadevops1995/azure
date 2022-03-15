import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopUpComponent } from './pop-up.component';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ButtonModule } from '../button/button.module';

@NgModule({
  declarations: [
    PopUpComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    ButtonModule
  ],
  exports: [PopUpComponent],
  providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }]
})
export class PopUpModule { }
