import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClientService } from 'src/app/services/http-client.service';
import { HttpParams } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Moment } from 'moment';
import * as moment from 'moment';
import { DaterangepickerDirective } from 'ngx-daterangepicker-material';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { TooltipDirective } from 'src/app/directives/tooltip/tooltip.directive';
import { SingletonService } from 'src/app/services/singleton.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface AttendanceInterface {
  date: any;
  firstIn: any;
  lastOut: any;
  gross: any;
  net:any
}

@Component({
  selector: 'app-hr-attendence-sheet',
  templateUrl: './hr-attendance-report.component.html',
  styleUrls: ['./hr-attendance-report.component.scss']
})
export class HrAttendanceReportComponent implements OnInit {
  fromdate: any;
  downloadable = false;
  showMessage = false;
  date4;
  EMPS :any[];
  option = new FormControl('');
  @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;
  todate: any;
  ATTENDENCE_DATA: AttendanceInterface[] = [];
  displayedColumns: string[] = ['date', 'firstIn', 'lastOut', 'gross', 'net','posted'];
  dataSource = this.ATTENDENCE_DATA;
  ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
    // 'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
    // 'Last 2 Years': [moment().subtract(2, 'year').startOf('year'), moment().subtract(1, 'month').endOf('month')]
  }
  maxDate = moment();
  selected :any = {} ;
  selectedEmpId: any;
  value:any;
  filteredManagers: Observable<any>;
  isPageAccessable: Boolean=false;
  constructor(private http: HttpClientService,public datepipe: DatePipe,private user:UserService,private ss:SingletonService) { 
    
    this.filteredManagers = this.option.valueChanges
        .pipe(
          startWith(''),
          map(state => state ? this.filterManagerList(state) : this.EMPS.slice())
        );
  }
  private filterManagerList(value: string) {
    const filterValue = value.toLowerCase();
    return this.EMPS.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }

  open(e) {
    this.pickerDirective.open(e);
  }
  ngOnInit(): void {
    this.checkHrAccessForreports();
      this.fromdate = this.convertDatefmt(this.ranges['Last 30 Days'][0])
      this.todate = this.convertDatefmt(this.ranges['Last 30 Days'][1])
      this.selected["startDate"] = this.ranges['Last 30 Days'][0];
      this.selected["endDate"] = this.ranges['Last 30 Days'][1];
      // this.option.setValue(this.user.getEmpId());
      this.getAttendenceData(this.fromdate,this.todate,this.user.getEmpId());
      this.getReporters();

  }
  checkHrAccessForreports(){
    
    this.http.noLoader(true).request("get", 'reportsAccessableAdmins/').subscribe(res => {
      if (res.status == 200) {
        this.isPageAccessable=res.body;
      }
      
    });
  }
  
  getAttendenceData(fromdate,todate,emp_id) {
    if(emp_id === 'all'){
      // this.http.request("get",'attendance/?from='+this.fromdate+'&to='+this.todate+'&all_emp=true').subscribe(res=>{
      //   if (res.status == 200) {
      //     console.log(res.body['results'])
      //      this.ATTENDENCE_DATA = []; 
      //      this.downloadable = res.body['results']['downloadable'];
      //      }
      //    })
      this.downloadable = true
    }else if(emp_id!== undefined){
    this.http.request("get", 'attendance/?from='+fromdate+'&to='+todate+'&emp_id='+emp_id,).subscribe(res => {
      if (res.status == 200) {
       console.log(res.body['results'])
        this.ATTENDENCE_DATA = res.body['results'];
        this.downloadable =false;
        this.showMessage = true;
        }
      })
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

      this.getAttendenceData(this.fromdate,this.todate,this.selectedEmpId)
  
      }
  getDownloadEndPoint(){
    if(this.selectedEmpId === 'all'){
    return 'attendance/?from='+this.fromdate+'&to='+this.todate+'&download='+true+'&all_emp=true&is_hr=true'
  }else{
    return 'attendance/?from='+this.fromdate+'&to='+this.todate+'&download='+true+'&emp_id='+this.selectedEmpId
  }
  }

  selectEmp(value) {
    this.selectedEmpId = this.EMPS.filter(x=>{
      if(x.emp_name == value){
        return x['emp_id'];
      }
    });
    this.selectedEmpId = this.selectedEmpId[0]['emp_id']
    this.getAttendenceData(this.fromdate, this.todate, this.selectedEmpId)
  }

  clear(){
    this.option.reset();
    this.option.setValue('');
   }
  // selectEmp(){
  //   this.getAttendenceData(this.fromdate,this.todate,this.option.value)
  // }
  getReporters(){
    if(this.user.getRoleId()>1){
    this.EMPS = [{ 'emp_id': 'all','emp_name': 'ALL'}];
    }else{
      this.EMPS = [];
    }
    
    this.http.request("get", 'users/?str=&type=hr&hierarchy_type=lower&search=all',).subscribe(res => {
      if (res.status == 200) {
        this.EMPS.push({ emp_id: 'all', emp_name: 'ALL' })
        res.body['results'].forEach(element => {
          this.EMPS.push(element)
        });

        // this.EMPS.push({'email': res.body['results']['email'],
        // 'emp_id': res.body['results']['emp_id'],
        // 'emp_name': res.body['results']['emp_name']})
        // res.body['results']['reporters'].forEach(each=>{
        //   if(each['emp_id'] !== res.body['results']['emp_id']){
        //   this.EMPS.push(each);
        //   }
        //   console.log(this.EMPS,"-------------------------")
        // })
        this.EMPS.forEach(element => {
          if(element.emp_id == this.user.getEmpId()){
            let emp_name = element.emp_name;
            console.log(emp_name);
            
            this.selectEmp(emp_name);
            this.option.setValue(emp_name);
         }
        });
      }
    })
  }
}