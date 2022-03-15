import { ModalPopupModule } from './../../../components/modal-popup/modal-popup.module';
import { ButtonModule } from './../../../components/button/button.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApproveTimesheetsComponent } from './approve-timesheets.component';
import {MatPaginatorModule} from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { TimeSheetModule } from '../time-sheet/time-sheet.module';



@NgModule({
  declarations: [ApproveTimesheetsComponent],
  imports: [
    CommonModule,
    ButtonModule,
    MatPaginatorModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    ModalPopupModule,
    MatSelectModule,
    SvgIconModule,
    FileDownloadModule,
    TimeSheetModule
  ]
})
export class ApproveTimesheetsModule { }
