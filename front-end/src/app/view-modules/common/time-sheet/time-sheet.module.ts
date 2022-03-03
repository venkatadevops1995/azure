import { TimeSheetService } from './time-sheet.service';
import { TimeFieldComponent } from './time-field/time-field.component';
import { ModalPopupModule } from './../../../components/modal-popup/modal-popup.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSheetComponent } from './time-sheet.component';
import { ButtonModule } from './../../../components/button/button.module'; 
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogModule } from 'src/app/components/confirm-dialog/confirm-dialog.module';



@NgModule({
  declarations: [TimeSheetComponent,TimeFieldComponent],
  imports: [
    CommonModule,
    ButtonModule, 
    SvgIconModule,
    ReactiveFormsModule,
    ModalPopupModule,
    MatIconModule,
    ConfirmDialogModule
  ],
  exports:[TimeSheetComponent],
  providers:[TimeSheetService]
})
export class TimeSheetModule { }
