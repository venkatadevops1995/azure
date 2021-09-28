import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { DaterangepickerDirective } from 'ngx-daterangepicker-material';
import { DaterangepickerComponent } from 'ngx-daterangepicker-material/daterangepicker.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FileDownloadService } from 'src/app/directives/file-download/file-download.service';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { MonthYearComponent } from '../month-year/month-year.component';
@Component({
  selector: 'app-leave-history',
  templateUrl: './leave-history.component.html',
  styleUrls: ['./leave-history.component.scss']
})
export class LeaveHistoryComponent implements OnInit{
  // the sorting criteria for the historic leave applcn list
  sortHistoricKey: 'startDate' | 'endDate' | 'empName' | null = 'startDate'
  side:boolean = true;
  sortDirection: 'asc' | 'desc' | null = 'desc'
  // sorting in the historical leaves
  sortHistoric: any = {
    empName: false,
    startDate: false,
    endDate: false
  }

  employeesOptions: Array<any> = []
  employeeSelected: { emp_id: number, emp_name: string } = null
  leaveApplicationColumns: string[] = ['serial', 'id', 'emp_name', 'startdate', 'enddate', 'day_count', 'leave_type', 'status'];
  historyLeavesFiltersApplied: boolean = false

  ranges: any = {
    // 'Today': [moment(), moment()],
    // 'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
    // 'This Year': [moment().startOf('year'), moment().endOf('year')],
    // 'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
    // 'Last 2 Years': [moment().subtract(2, 'year').startOf('year'), moment().subtract(1, 'month').endOf('month')]
  }
  fromdate: any;
  todate: any;
  maxDate = moment().add(0, 'days')

  selectedHistoryRange: any = {};
  selectedAppliedRange: any = {};
  LEAVE_DATA_HISTORY = []
  picker: DaterangepickerComponent;
  showMessage = false;
  @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;
  @ViewChild(MatSort) sort1: MatSort;
  constructor(private ss: SingletonService,
    private http: HttpClientService,
    private datepipe: DatePipe,
    private fileDownload: FileDownloadService,
  ) {

    side : this.any;
    this.filteredManagers = this.managerCtrl.valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this.filterManagerList(state) : this.employeesOptions.slice())
      );
  }
 

  filterManagerList(value: string) {
    const filterValue = value.toLowerCase();

    return this.employeesOptions.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }
  managerCtrl = new FormControl();
  value; any;
  filteredManagers: Observable<any>;
  monthFrom : number;
  yearFrom : number;
  employeeList: any[] = [];
  fgFilter = this.ss.fb.group({
    all: [''],
    employeeName: ['']
  })
  ngOnInit(): void {
    this.setPickerToLast30Days()
    this.getEmployees()
  }
  
  setPickerToLast30Days() {
    this.selectedHistoryRange["startDate"] = this.ranges['Last 30 Days'][0];
    this.selectedHistoryRange["endDate"] = this.ranges['Last 30 Days'][1];
    this.pickerDirective.writeValue(this.selectedHistoryRange)
    
  }
  onSubmitResolvedLeaveFilter(e) {

    let fgValue: any = this.managerCtrl.value
    
    console.log(fgValue, e);
    this.getLeaveApplications(true, fgValue)
    let isRangeSelected = (this.pickerDirective.value.startDate && this.pickerDirective.value.endDate)

  }
  getEmployees() {
    let params = new HttpParams({
      fromObject: {
        str: '',
        type: 'hr',
        hierarchy_type: 'lower',
        search: 'all'
      }
    })
    this.http.request('get', 'users/', params).subscribe((res) => {
      if (res.status == 200) {
        this.employeesOptions = []
        this.employeesOptions.push({ emp_id: 'all', emp_name: 'ALL' })
        res.body['results'].forEach(element => {
          this.employeesOptions.push(element)
        });
        this.employeeList = [...this.employeesOptions]
        console.log(this.employeesOptions);

      }
    })
  }
  clear() {
    this.managerCtrl.reset();
    this.managerCtrl.setValue('');
  }
  onSelectEmployee(employee: MatAutocompleteSelectedEvent) {

    this.employeeSelected = this.managerCtrl.value;
    let fgValue = this.managerCtrl.value;
    if (fgValue == 'ALL' || fgValue) {
      this.getLeaveApplications(true, fgValue)
    } else {
      this.LEAVE_DATA_HISTORY = []
    }
  }
  
  //  on clciking the export excel sheet of the resolved leave applications
  onClickExportResolved() {
    let mapping = {
      empName: 'emp_name',
      emp_id: 'emp_id',
      startDate: 'startdate',
      endDate: 'enddate'
    }
    let dp: any = this.pickerDirective.value
    // get the sorting
    let params = new HttpParams({
      fromObject: {
        is_manager: 'true',
        is_history: 'true',
        filter: 'history',
        is_hr: 'true',
        emp_name: (this.managerCtrl.value) || "",
        emp_id: String(this.employeeSelected?.emp_id) || "",
        sort_key: mapping[this.sortHistoricKey] || '',
        sort_dir: this.sortDirection || ''
      }
    })

    // this.historyLeavesFiltersApplied =  true
    if (dp && dp['startDate'] && dp['endDate']) {
      let st_dt = new Date(dp["startDate"]._d);
      let ed_dt = new Date(dp["endDate"]._d + 1);
      params = params.append('start_date', this.datepipe.transform(st_dt, 'yyyy-MM-ddT00:00:00'))
      params = params.append('end_date', this.datepipe.transform(ed_dt, 'yyyy-MM-ddT00:00:00'))
    }
    this.http.noLoader(true).showProgress('download').request('get', 'leave/export-resolved/', params, "", {}, {
      responseType: 'blob',
      progress: 'download'
    }).subscribe(res => {
      if (res.status == 200) {
        let fileName = this.fileDownload.getFileName(res)
        this.fileDownload.download(res.body, fileName, res.headers.get('Content-Type'))
        console.log('exported')

      } else if (res.status == 204) {
        this.ss.statusMessage.showStatusMessage(false, 'No rows available for the current filter criteria')
      }
    })
  }
  // get all leave application with pagination
  getLeaveApplications(isHistory: boolean = false, emp_name?) {
    let empName: any;
    if (emp_name) {
      empName = emp_name
    }
    else {
      empName = 'emp_name'
    }
    let mapping = {
      empName: empName,
      startDate: 'startdate',
      endDate: 'enddate'
    }
    let data;
    
    let dp: any = this.pickerDirective.value
    
    if (isHistory) {
      data = this.LEAVE_DATA_HISTORY = []
    } else {
      // data = this.LEAVE_DATA_PENDING = []
    }

    // get the sorting
    let params = new HttpParams()

    params = params.append('is_manager', 'true')

    params = params.append('filter', (!isHistory) ? 'pending' : 'history')

    if (isHistory) {
      console.log(emp_name);

      // this.historyLeavesFiltersApplied =  true

      if (emp_name == "ALL") {
        empName = ''
      }
      else {
        empName = emp_name || ""
      }
      params = params.append('emp_name', empName)
      params = params.append('sort_key', mapping[this.sortHistoricKey] || '')
      params = params.append('sort_dir', this.sortDirection || '')
      params = params.append('is_hr', 'true')
      params = params.append('filter', 'history')
    }
    
    if (dp && dp['startDate'] && dp['endDate']) {
      let st_dt = new Date(dp["startDate"]._d);
      let ed_dt = new Date(dp["endDate"]._d + 1);
      params = params.append('start_date', this.datepipe.transform(st_dt, 'yyyy-MM-ddT00:00:00'))
      params = params.append('end_date', this.datepipe.transform(ed_dt, 'yyyy-MM-ddT00:00:00'))
    }else{
      let st_dt =this.selectedHistoryRange.value.startDate._d
      let ed_dt = this.selectedHistoryRange.value.endDate._d
      params = params.append('start_date', this.datepipe.transform(st_dt, 'yyyy-MM-ddT00:00:00'))
      params = params.append('end_date', this.datepipe.transform(ed_dt, 'yyyy-MM-ddT00:00:00'))
    }
    if (this.side) {
      this.http.request('get', 'leave/request/', params).subscribe(res => {
        if (res.status == 200) {
          res.body["results"].forEach(element => {
            data.push(element)
          })
        this.showMessage = true
      } else if (res.status == 204) {

      } else {
        this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
      }
      if (isHistory) {
        this.historyLeavesFiltersApplied = true
      }
    })
    } else {
      let param = new HttpParams();
      if (this.managerCtrl.value == "ALL" || this.managerCtrl.value == undefined || this.managerCtrl.value == "") {        
      } else {
        param = param.append('emp_name', this.managerCtrl.value);
      }
      param = param.append("month", `${this.monthFrom}`);
      param = param.append("year", `${this.yearFrom}`);
      this.http.request('get', `leave/monthlycycleleavereport`, param).subscribe(res => {
        if (res.status == 200) {
          res.body.forEach(element => {
            data.push(element)
          })
        this.showMessage = true
      } else if (res.status == 204) {

      } else {
        this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
      }
      if (isHistory) {
        this.historyLeavesFiltersApplied = true
      }
    })
    }
  }
  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }
  onClickSort(column: 'empName' | 'startDate' | 'endDate') {
    this.sortHistoric[column] = this.sortHistoric[column] == false ? 'desc' : this.sortHistoric[column] == 'desc' ? 'asc' : this.sortHistoric[column] == 'asc' ? false : 'desc'
    for (const key in this.sortHistoric) {
        if (Object.prototype.hasOwnProperty.call(this.sortHistoric, key)) {
            if (key != column) {
                this.sortHistoric[key] = false
            } else {
                if (this.sortHistoric[column]) {
                    this.sortHistoricKey = column
                    this.sortDirection = this.sortHistoric[column]
                } else {
                    this.sortHistoricKey = null
                    this.sortDirection = null
                }
            }
        }
    }
    this.getLeaveApplications(true)
}
getSide(er) {
  this.side = er; 
}
getTrigger(er) {
  this.yearFrom = er.year;
  this.monthFrom = er.month;
  if (er) {
    if(this.yearFrom)
    this.getLeaveApplications(true);
  }
}
}
