import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MatDatepicker} from '@angular/material/datepicker';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import * as _moment from 'moment';
import {default as _rollupMoment, Moment} from 'moment';
const moment = _rollupMoment || _moment;
export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-month-year',
  templateUrl: './month-year.component.html',
  styleUrls: ['./month-year.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
})
export class MonthYearComponent implements OnInit {
  side:boolean = true;
  triger : boolean = false;
  @Output() newItemEvent = new EventEmitter<boolean>();
  @Output() newItemEvent1 = new EventEmitter<{}>();
  ngOnInit(): void {
    document.documentElement.style.setProperty("--isDisabled", "slategrey");
      document.documentElement.style.setProperty("--opa", "1");
  }
  date = new FormControl(moment());
  month : number;
  year : number;
  chosenYearHandler(normalizedYear: Moment) {
    const ctrlValue = this.date.value;
    ctrlValue.year(normalizedYear.year());
    this.date.setValue(ctrlValue);
  }
  chosenMonthHandler(normalizedMonth: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.date.value;
    ctrlValue.month(normalizedMonth.month());
    this.date.setValue(ctrlValue);
    this.month = ctrlValue.month();
    this.year = ctrlValue.year();
    this.triger = true;
    this.newItemEvent1.emit({trigger: this.triger,month :  this.month + 1, year : this.year});
    datepicker.close();
  }
  onChange(ob : MatSlideToggleChange) {    
    this.side = !this.side;
    if(this.side) {
      document.documentElement.style.setProperty("--isDisabled", "slategrey");
      document.documentElement.style.setProperty("--opa", "1");
    }
    else {
      document.documentElement.style.setProperty("--isDisabled", "#3a7bca");
      document.documentElement.style.setProperty("--opa", "1");
    }
    this.newItemEvent.emit(this.side);
  }
}
