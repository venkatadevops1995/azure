import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { HolidayComponent } from './holiday.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'src/app/components/button/button.module';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatLabel } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { MatIconModule } from '@angular/material/icon';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@NgModule({
  declarations: [ HolidayComponent],
  imports: [
    CommonModule,
    SvgIconModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxDaterangepickerMd.forRoot(),
    MatIconModule,
    ModalPopupModule,
    MatSelectModule,
    MatAutocompleteModule

  ],
  providers:[DatePipe]
})
export class HolidayModule { }
