import { Component, OnInit,ViewChild } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { Moment } from 'moment';
import * as moment from 'moment';
// import { DaterangepickerDirective } from 'ngx-daterangepicker-material';


@Component({
  selector: 'app-download-mis',
  templateUrl: './download-mis.component.html',
  styleUrls: ['./download-mis.component.scss']
})
export class DownloadMisComponent implements OnInit {

  Ischecked: boolean = true;
  fromdate: any;
  downloadable = false;
  showMessage = false;
  date4;
  // @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;
  todate: any;
  ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
    'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
    // 'Last 2 Years': [moment().subtract(2, 'year').startOf('year'), moment().subtract(1, 'month').endOf('month')]
  }
  // maxDate = moment().subtract(0, 'days');
  minDate = moment().subtract(2, 'year');
  selected :any = {} ;
  selectedEmpId: any;
  value:any;
 
  constructor(public datepipe: DatePipe) { }
  
  open(e) {
    // this.pickerDirective.open(e);
  }
  ngOnInit(): void {
    console.log("Is Checked ::::", this.Ischecked);
    this.fromdate = this.convertDatefmt(this.ranges['This Month'][0])
    this.todate = this.convertDatefmt(this.ranges['This Month'][1])
    this.selected["startDate"] = this.ranges['This Month'][0];
    this.selected["endDate"] = this.ranges['This Month'][1];
  }

  onIsDisableClick(event){
    console.log("Ischecked is ::::",event.checked);
    this.Ischecked = event.checked;
    if(event.checked){
      this.fromdate = this.convertDatefmt(this.ranges['This Month'][0])
      this.todate = this.convertDatefmt(this.ranges['This Month'][1])
      this.selected["startDate"] = this.ranges['This Month'][0];
      this.selected["endDate"] = this.ranges['This Month'][1];
    }else{
      this.fromdate = this.convertDatefmt('');
      this.todate = this.convertDatefmt('');
      this.selected["startDate"] = '';
      this.selected["endDate"] = '';
      console.log("$$$$",this.selected);
    }

  }
  convertDatefmt(date){
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }
  updateRange(event){
    if(event.startDate){
      this.fromdate = this.convertDatefmt(event.startDate._d);
    }
    if(event.endDate){
      this.todate = this.convertDatefmt(event.endDate._d);
    }
      console.log(this.fromdate,this.todate)

  }
  

}
