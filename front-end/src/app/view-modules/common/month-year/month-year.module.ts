import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonthYearComponent } from './month-year.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
@NgModule({
  declarations: [MonthYearComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatSlideToggleModule
  ],
  exports: [MonthYearComponent],
})
export class MonthYearModule { }
