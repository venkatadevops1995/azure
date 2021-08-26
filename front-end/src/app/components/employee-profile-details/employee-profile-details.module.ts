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


@NgModule({
  declarations: [EmployeeProfileDetailsComponent],
  imports: [
    CommonModule,
    StripTableModule,
    MatTableModule,
    MatInputModule,
    ReactiveFormsModule,
    ButtonModule,
    MatIconModule,
    ClipboardModule
  ],
  exports: [EmployeeProfileDetailsComponent]
})
export class EmployeeProfileDetailsModule { }
