import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveHistoryComponent } from './leave-history.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { MatTableModule } from '@angular/material/table';
import { MonthYearModule } from '../month-year/month-year.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { ShowTableModule } from '../show-table/show-table.module';



@NgModule({
  declarations: [LeaveHistoryComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    SvgIconModule,
    MatIconModule,
    MatInputModule,
    FileDownloadModule,
    MatTableModule,
    NgxDaterangepickerMd.forRoot(),
    MonthYearModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSortModule,
    ShowTableModule
  ]
})
export class LeaveHistoryModule { }
