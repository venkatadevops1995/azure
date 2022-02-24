import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AttendenceSheetComponent } from './attendence-sheet.component';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { MatInputModule } from '@angular/material/input';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';


@NgModule({
  declarations: [AttendenceSheetComponent],
  bootstrap:    [AttendenceSheetComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    // NgxDaterangepickerMd.forRoot(),
    MatFormFieldModule,
    FileDownloadModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    SvgIconModule,
    ReactiveFormsModule,
    TooltipModule,
    AtaiDateRangeModule
  ]
})
export class AttendenceSheetModule { }
