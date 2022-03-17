import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopUpComponent } from './pop-up.component';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ButtonModule } from '../button/button.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';

@NgModule({
  declarations: [
    PopUpComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    ButtonModule,
    SvgIconModule
  ],
  exports: [PopUpComponent],
  providers: [{ provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} }]
})
export class PopUpModule { }
