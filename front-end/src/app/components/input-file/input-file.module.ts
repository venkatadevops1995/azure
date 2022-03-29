import { FileSizePipe } from './file-size.pipe';

import { NgModule } from '@angular/core';
import { FileUploadComponent } from './input-file.component';
import { ReactiveFormsModule, NgForm, FormGroupDirective } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SvgIconModule } from './../../directives/svg-icon/svg-icon.module';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    FileUploadComponent, FileSizePipe
  ],
  imports: [ReactiveFormsModule, CommonModule, SvgIconModule],
  exports: [FileUploadComponent, FileSizePipe],
  providers: [
    { provide: NgForm, useClass: NgForm },
    { provide: FormGroupDirective, useClass: FormGroupDirective }
  ]
})
export class FileUploadModule { }
