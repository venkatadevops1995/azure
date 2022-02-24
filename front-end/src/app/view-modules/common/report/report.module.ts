import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
// import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { ReportComponent } from './report.component';



@NgModule({
  declarations: [ReportComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    // NgxDaterangepickerMd.forRoot(),
    FileDownloadModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    SvgIconModule,
    ReactiveFormsModule,
    TooltipModule
  ]
})
export class ReportModule { }
