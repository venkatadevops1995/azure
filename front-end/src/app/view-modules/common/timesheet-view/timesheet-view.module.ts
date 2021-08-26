import { TimeSheetService } from './../time-sheet/time-sheet.service';
import { ModalPopupModule } from './../../../components/modal-popup/modal-popup.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { ButtonModule } from './../../../components/button/button.module';
import { ReactiveFormsModule } from '@angular/forms';
import { TimeSheetModule } from './../time-sheet/time-sheet.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetViewComponent } from './timesheet-view.component';



@NgModule({
  declarations: [TimesheetViewComponent],
  imports: [
    CommonModule,
    TimeSheetModule,
    ReactiveFormsModule,
    ButtonModule,
    SvgIconModule,
    ModalPopupModule
  ],
  exports:[
    TimesheetViewComponent
  ]

})
export class TimesheetViewModule { }
