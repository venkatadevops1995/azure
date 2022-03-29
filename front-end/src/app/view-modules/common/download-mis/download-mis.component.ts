import { Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { Moment } from 'moment';
import * as moment from 'moment';
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';
// import { DaterangepickerDirective } from 'ngx-daterangepicker-material';


@Component({
  selector: 'app-download-mis',
  templateUrl: './download-mis.component.html',
  styleUrls: ['./download-mis.component.scss']
})
export class DownloadMisComponent implements OnInit {

  today = new Date()
  Ischecked: boolean = true;
  fromdate: any;
  downloadable = false;
  showMessage = false;
  date4;
  todate: any;

  minDate = new Date(this.today.getTime() - (365 * 2 * 86400000))
  selected: any = {};
  selectedEmpId: any;
  value: any;


  @ViewChild(AtaiDateRangeComponent) dateRangePicker: AtaiDateRangeComponent;
  constructor(public datepipe: DatePipe) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    console.log('This month')
    setTimeout(() => {
      this.setThisMonth()
    })
  }

  setThisMonth() {
    if (this.dateRangePicker) {
      this.dateRangePicker.setPresetValue('This Month')
    }
  }

  onDateSelect(date) {
    this.fromdate = this.convertDatefmt(date.start)
    this.todate = this.convertDatefmt(date.end)
    this.selected["startDate"] = date.start;
    this.selected["endDate"] = date.end;
  }

  onIsDisableClick(event) {
    console.log("Ischecked is ::::", event.checked);
    this.Ischecked = event.checked;
    if (event.checked) {
      this.dateRangePicker.resetRange()
    } else {
      this.setThisMonth()
    }
  }

  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }


}
