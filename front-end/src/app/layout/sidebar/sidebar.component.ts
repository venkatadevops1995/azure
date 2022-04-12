import { HttpClientService } from 'src/app/services/http-client.service';
import { HttpClient, HttpResponse, HttpParams } from '@angular/common/http';
import { UserService } from 'src/app/services/user.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import enmTsStatus from 'src/app/enums/timesheet-status.enum';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { ObjectToKVArrayPipe } from 'src/app/pipes/objectToArray.pipe'
import { KeyValue } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit { 


  isSidebarOpen: boolean = false;

  // the array to hold the menu
  menu: Array<any> = [

  ]
  originalOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>): number => {
    return 0;
  }

  menu_array = { "Dashboard": [], "TimeSheet": ["Entry", "Resolve", "Rejected"], "Attendance": [], "EmployeeManagement": ["Add", "Edit", "Transfer", "Projects"], "Holiday": [], "LeaveManagement": ["ApplyLeave", "Policy", "Team Leaves", "leave"] }
  // subject helpful in clearning all subscriptions
  destroy$: Subject<any> = new Subject();

  // prop to hold username
  username: string = "Vedika";

  // the route prefix which is unique for each role
  routePrefix = "";

  // variables for resolve timesheet dot
  pendingApprovalCount: number;
  rejectedCount: number;
  panelOpenState: boolean = false;
  toggle: boolean[];
  isReportsAccessable: Boolean = false;

  is_XLG_LT : boolean = false;

  constructor(
    private ss: SingletonService,
    private user: UserService,
    private http: HttpClientService,
    private responsive:BreakpointObserver
  ) {

    this.toggle = this.menu.map(i => false);
    this.responsive.observe(AtaiBreakPoints.XLG_LT).subscribe(val=>{
      console.log(val)
      this.is_XLG_LT = val.matches
      if(val.matches){ 
        this.setSidebarStatus(false);
      }
      console.log(this.is_XLG_LT,this.isSidebarOpen)
    })
  }

  setSidebarStatus(status){
    this.isSidebarOpen = status;
    this.ss.sideBarToggle = status;
    this.ss.sideBarToggle$.next(status)

  }

  ngOnInit(): void {
    if (this.ss.loggedIn) {
      this.getInitData();
      if(!this.is_XLG_LT){ 
      }
    }
    this.checkHrAccessForreports();
    this.checkForRejectedTimesheet()
    // if not logged in subscribe so that on login we fetch the menu based on role
    this.ss.loggedIn$.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe(val => {
      if (val) {
        setTimeout(() => {
          this.getInitData(); 
        })
      }
    })

    this.ss.menu$.subscribe(val => {
      let is_hr = this.user.getDataFromToken('is_emp_admin') && this.user.getDataFromToken('emp_admin_priority')
      let leave_config_index = undefined
      if (val.key == 'rejected-timesheet') {
        this.menu.forEach((item, index) => {
          if (item.link == 'rejected-timesheet') {
            item.showRedDot = val.value;
          }
          if (item.link == 'leave-policy-config') {
            if (is_hr) {
              leave_config_index = index;
            }
          }
        })
      }
    })

    this.ss.resTimeSheet$.subscribe(val => {
      this.pendingApprovalCount = val.pac;
      this.rejectedCount = val.rc;
    })

    this.checkResolveTimesheet();
  }

  //check for reolve ResolveTimesheet
  checkResolveTimesheet() {
    this.http.noLoader(true).request("get", 'statuswisetimesheetcount/').subscribe(res => {
      if (res.status == 200) {
        let timesheetsData = res.body;
        this.pendingApprovalCount = timesheetsData.pending_cnt + timesheetsData.entry_complaince_cnt;
        this.rejectedCount = timesheetsData.rejected_cnt;

        // timesheetsData.forEach(element => {
        //   if (element.status == 0 || element.status == 3) {
        //     this.pendingApprovalCount = this.pendingApprovalCount + 1;
        //   }
        //   else if (element.status == 2) {
        //     this.rejectedCount = this.rejectedCount + 1;
        //   }
        // });
      }
    })
  }

  checkHrAccessForreports() {

    this.http.noLoader(true).request("get", 'reportsAccessableAdmins/').subscribe(res => {
      if (res.status == 200) {

        this.isReportsAccessable = res.body;
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next(null)
  }

  onClickMenuToggle() {
    this.setSidebarStatus(!this.isSidebarOpen); 
  }

  // get the initial data once the login is confirmed
  getInitData() {
    this.routePrefix = this.user.getRoutePrefix();
    this.username = this.user.getName();
    this.getMenu();
  }
  randomNumber = new Date();
  // once the login is confirmed get the menu for the role
  getMenu() {
    this.http.noAuth().noLoader(true).request('get', '/assets/menus/' + this.routePrefix + '.json?' + this.randomNumber, "", "", {}, { baseUrl: "", responseType: 'json' }).subscribe((res: any) => {
      this.menu = res.body;

      this.http.noLoader(true).request("get", 'attendancestatus/').subscribe(res => {
        if (res.status == 200) {
          this.http.noLoader(true).request("get", 'leavestatus/').subscribe(leave_res => {
            if (leave_res.status == 200) {
              console.log(res.body.attendance_flag == false, res.body.attendance_flag)
              this.ss.attendanceFlag = res.body.attendance_flag;
              // console.log("--------------------leave_res.body.leave_flag------------------",leave_res.body.leave_flag)

              let is_hr = this.user.getDataFromToken('is_emp_admin') && this.user.getDataFromToken('emp_admin_priority')
              if (res.body.attendance_flag == false) {
                this.menu = this.menu.filter(item => item.link != "attendance");
              } if (!is_hr && this.user.getDataFromToken('role_id') == 1) {
                this.menu = this.menu.filter(item => item.text != "Employee Management");
              }
              if (!is_hr) {
                this.menu = this.menu.filter(item => item.text != "HR Reports");

              }
              if (!this.isReportsAccessable) {

                this.menu = this.menu.filter(item => item.text != "MIS");
              }

              // if(!is_hr){
              this.menu.forEach(m => {
                if (m.hasOwnProperty("submenu")) {
                  if (!is_hr) {

                    m["submenu"] = m["submenu"].filter(item => ((item.link != "leave-policy-config") && (item.link != "edit-user")) && (item.link != "add-user") && (item.link != "import-export-leave") && (item.link != "employee-leave-info") && (item.link != "leave-history") && (item.link != "document-config") && (item.link != "document-list"));
                  }
                  if (!is_hr && this.user.getDataFromToken('role_id') == 1) {
                    m["submenu"] = m["submenu"].filter(item => (item.link != "manage-user"))
                  }
                  if (res.body.attendance_flag == false) {
                    m["submenu"] = m["submenu"].filter(item => ((item.link != "report")))
                  }
                }

              })
              // this.menu = this.menu.filter(item => ((item.link != "leave-policy-config") && (item.link != "edit-user")  && (item.link != "add-user")));

              // }
              if (leave_res.body.leave_flag == false) {
                this.menu = this.menu.filter(item => (item.text != "Leave Management" && item.text != "Holidays" && item.text != "Employee Management"));
              }
            }
          })
        }

      })
      if (this.ss.loggedIn) {
        this.checkForRejectedTimesheet();
        this.checkResolveTimesheet();
      }
      this.menu.forEach(item => {
        // if (item.link == 'approve-timesheets') {
        //   item.showDot = (res.body.length > 0);
        // }
        // console.log("-----------------------",item);

        if (item.text == "Timesheet" && item.hasOwnProperty("submenu")) {
          // console.log("-----------------------",item);
          item["submenu"].forEach(e => {
            if (e.link == 'approve-timesheets') {
              e.showRedDot = true;
              // console.log("---------------set red dot--------",item["submenu"]);
            }

          })

        }

      });
      console.log(res);
    })
  }

  // check if there is any rejected timesheets
  checkForRejectedTimesheet() {

    let params = new HttpParams();
    let url;
    params = params.append('status', enmTsStatus.Rejected + "")
    url = "rejectedtimesheet/";

    this.http.noLoader(true).request("get", url, params).subscribe(res => {
      if (res.status == 200) {
        // append the show error flag to the rejected time sheets menu item
        this.menu.forEach(item => {


          if (item.text == "Timesheet" && item.hasOwnProperty("submenu")) {

            item["submenu"].forEach(e => {
              if (e.link == 'rejected-timesheet') {
                e.showRedDot = (res.body.length > 0);
              }

            })

          }
        })

      }
      else if (res.status == 400) {
        console.log(res.error.Message);
        if (res.error.Message == 'token_expired') {
          this.user.logoutOnExpiry();
        }
      }
    });
  }



}
