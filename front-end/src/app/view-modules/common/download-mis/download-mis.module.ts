import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadMisComponent } from './download-mis.component';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { MatInputModule } from '@angular/material/input';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { MatCheckbox, MatCheckboxModule , MatCheckboxChange ,MatCheckboxClickAction } from '@angular/material/checkbox';
import { ButtonModule } from 'src/app/components/button/button.module';



@NgModule({
  declarations: [DownloadMisComponent],
  bootstrap:    [DownloadMisComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    NgxDaterangepickerMd.forRoot(),
    FileDownloadModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    SvgIconModule,
    ReactiveFormsModule,
    TooltipModule,
    MatCheckboxModule,
    ButtonModule
  ]
})
export class DownloadMisModule { }
