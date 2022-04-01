import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeProfileDetailsComponent } from './employee-profile-details.component';
import { StripTableModule } from '../strip-table/strip-table.module';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from '../button/button.module';
import { MatIconModule } from '@angular/material/icon';
import {ClipboardModule} from '@angular/cdk/clipboard';
import { MatDialogModule } from '@angular/material/dialog';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';


@NgModule({
  declarations: [EmployeeProfileDetailsComponent],
  imports: [
    CommonModule,
    StripTableModule,
    MatTableModule,
    MatInputModule,
    ReactiveFormsModule,
    ButtonModule, 
    ClipboardModule,
    MatDialogModule,
    SvgIconModule
  ],
  exports: [EmployeeProfileDetailsComponent]
})
export class EmployeeProfileDetailsModule { }
