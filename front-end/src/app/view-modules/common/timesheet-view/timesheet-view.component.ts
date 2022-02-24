import { HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { SingletonService } from './../../../services/singleton.service';
import { TimeSheetComponent } from './../../common/time-sheet/time-sheet.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, HostListener, ElementRef } from '@angular/core';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { emptyFormArray } from 'src/app/functions/empty-form-array.fn';
import { debounceTime, takeUntil } from 'rxjs/operators';
import enmTsStatus from 'src/app/enums/timesheet-status.enum';
import { Subject } from 'rxjs';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';

@Component({
  selector: 'app-timesheet-view',
  templateUrl: './timesheet-view.component.html',
  styleUrls: ['./timesheet-view.component.scss']
})
export class TimesheetViewComponent implements OnInit {

  // subject to emit for clearing the subscriptions
  destroy$: Subject<any> = new Subject();

  // property used to enable or disable the timesheet for editing
  disableTimesheet: boolean = false;

  // property used to enable or disable the save &submit button
  disableSaveSubmit: boolean = true;

  // property used to enable or disable the wsr for editing
  disableWsr: boolean = false;

  // the reference to the timesheet
  @ViewChild(TimeSheetComponent) compTimeSheet: TimeSheetComponent;

  // reference to the active mins element
  @ViewChild('selProject') elSelProject: ElementRef;

  // reference to the all zeros in project confirmation modal pop up
  @ViewChild('refModalProjectAllZeros') modalProjectAllZeros: ModalPopupComponent

  // reference to save submit confirmation modal pop up
  @ViewChild('refModalSaveSubmit') modalSaveSubmit: ModalPopupComponent

  // the projects in the wsr projects
  wsrProjects: Array<any> = [
  ];

  // active projects which are visible by default
  wsrActiveProjectsVisible: Array<any> = [];

  // active projects which are visible by default
  wsrActiveProjectsHidden: Array<any> = [];

  // form group to hold the wsr Projects
  fgWsrProjects: FormGroup;

  // weekly timesheet data holder
  weeklyTimeSheetData;

  // weekly status data holder
  weeklyStatusData;

  // boolean view token to show hide the select project list in wsr
  showProjectList: boolean = false;

  // boolean view token to show hide the  wsr
  showWsr: boolean = false;

  //boolean view token to show hide the  save buttons
  savedWtr:boolean = false;

  savedWsr:boolean = false;


  // boolean view token  to enable / disable wsr projects submit button
  wsrFormValidity: boolean = false;

  // property to hold the current route whether is timesheet or rejected timesheet
  timeSheetType: 'regular' | 'rejected';

  // word count int wsr should be less than or equal to 5000
  wsrCharCount: number = 0;

  // holder for the rejected timesheet and wsr data
  holderRejected: { timesheet: any, wsr: any } = { timesheet: null, wsr: null }

  // boolean to indicate whether rejected timesheet value has changed
  hasRejectedValueChange ;

  // boolean to indicate if it has all zeros filled in any of the projects in timesheet
  hasAllZerosInProject: boolean = false;

  // boolean to indicate whether to proceed or stop submitting when there are all zeros in a project
  proceedWithAllZerosInProject: boolean = false;

  // propery to hold the submit type whil confirming the al zeroes in a project
  submitTypeWhileConfirmingAllZeros: string;

  // in rejected form value on load we ignore the form value changes to validate and enable the submit button. so keep initial load key
  initialWsrChange: boolean = true;

  // in rejected timesheet we need to know if the form value is changed or not
  wsrFormValueChanged: boolean = false;

  // form controls count in wsr projects active projects
  formControlsCount: number = 0;

  constructor(
    private http: HttpClientService,
    private cd: ChangeDetectorRef,
    private ss: SingletonService,
    private router: Router,
    private el: ElementRef
  ) {
    this.fgWsrProjects = this.ss.fb.group({
      active_projects: this.ss.fb.array([]),
      general: new FormControl('')
    });
    this.hasRejectedValueChange = this.timeSheetType != 'rejected';
  }

  ngOnInit(): void {

    // check the wsr form validation to enable or disable the submit button
    this.fgWsrProjects.valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(val => {
      let filled: boolean = false;
      let valueChanged = false;
      this.wsrCharCount = 0;
      // looop thhrough the active project and check if it is filled
      this.fgWsrProjects.get('active_projects').value.forEach((val, index) => {
        // if atleast one project is filled including general then enable button
        this.wsrCharCount += val.length;
        if (val.trim()) {
          filled = true;
        }
      })
      // check general project value
      let generalValue = this.fgWsrProjects.get('general').value;
      if (generalValue.trim()) {
        filled = true;
      }
      this.wsrCharCount += generalValue.length;
      this.wsrFormValidity = filled;
      if (this.timeSheetType == 'rejected') {
        if (this.initialWsrChange) {
          this.initialWsrChange = false;
        } else {
          if (!this.wsrFormValueChanged && this.formControlsCount == (<FormArray>this.fgWsrProjects.get("active_projects")).length) {
            this.wsrFormValueChanged = true;
          }
        }
      }
      this.cd.detectChanges();
      this.formControlsCount = (<FormArray>this.fgWsrProjects.get("active_projects")).length;
    })
    let url = this.router.url;

    if (url.indexOf('rejected-timesheet') >= 0) {
      this.timeSheetType = 'rejected';
    } else {
      this.timeSheetType = 'regular';
    }

    // call after the timeshet type is known
    this.getWeeklyTimeSheetData(true)
  }

  ngOnDestroy() {
    this.destroy$.next(null);
  }

  // event listener on document to check if active mins is clicked
  @HostListener("document:click", ['$event'])
  onClickDocument(e) {
    let target: any = e.target;
    let tempTarget = target;
    while (tempTarget && tempTarget != this.el.nativeElement) {
      if (tempTarget.classList) {
        if (tempTarget.classList.contains('wsr__sel-project-project')) {
          let index = Number(target.getAttribute("index"));
          let projectToBeAdded = this.wsrActiveProjectsHidden[index];
          this.wsrActiveProjectsVisible.push(projectToBeAdded);
          this.wsrActiveProjectsHidden.splice(index, 1);
          (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(""));
          break;
        } else if (tempTarget.classList.contains('wsr__sel-project-toggle')) {
          this.showProjectList = !this.showProjectList;
          break;
        } else if (tempTarget.classList.contains('zeros-project-cancel') || tempTarget.classList.contains('closebutton')) {
          // on click cancel in the modal pop up of confirm all zeros in project
          this.proceedWithAllZerosInProject = false;
          this.modalProjectAllZeros.close();
            this.savedWtr = false;
            this.savedWsr = false;
          break;
        } else if (tempTarget.classList.contains('zeros-project-proceed')) {
          // on click proceed in the modal pop up of confirm all zeros in project
          this.proceedWithAllZerosInProject = true;
          this.modalProjectAllZeros.close();
          if (this.timeSheetType == 'rejected') {
            this.onSubmitWsr('save-submit');
          } else {
            this.onSubmitTimeSheet(this.submitTypeWhileConfirmingAllZeros)
          }
          break;

        }

      }
      tempTarget = tempTarget.parentNode;
    }
    if (tempTarget == this.el.nativeElement) {
      this.showProjectList = false;
    }
  }

  // get the weekly data from  backend for timesheet
  getWeeklyTimeSheetData(initial: boolean = false) {
    let params = new HttpParams();
    let url;
    if (this.timeSheetType == 'rejected') {
      params = params.append('status', enmTsStatus.Rejected + "")
      url = "rejectedtimesheet/";
    } else {
      url = "weeklydata/";
    }

    this.http.request("get", url, params).subscribe(res => {
      if (res.status == 200) {
        this.weeklyTimeSheetData = res.body[0];
        
        if (initial) {
          if (this.weeklyTimeSheetData) {
            this.weeklyTimeSheetData.days.push('Total');
        // console.log(this.weeklyTimeSheetData.HOLIDAY['work_hours']);

        let holHours = this.weeklyTimeSheetData.HOLIDAY['work_hours'].map(item => item.h).reduce((prev, next) => prev + next);
        let holMins =  this.weeklyTimeSheetData.HOLIDAY['work_hours'].map(item => item.m).reduce((prev, next) => prev + next);
        if(holMins >= 60){
          holHours = holHours + Math.floor(holMins/60);
				  holMins = holMins % 60;
        }
        this.weeklyTimeSheetData.HOLIDAY['work_hours'].push({date:"Total",enable: true,h:holHours,m:holMins});

        let grossHours = this.weeklyTimeSheetData.gross_working_hours.map(item => item.h).reduce((prev, next) => prev + next);
        let grossMins =  this.weeklyTimeSheetData.gross_working_hours.map(item => item.m).reduce((prev, next) => prev + next);
        if(grossMins >= 60){
          grossHours = grossHours + Math.floor(grossMins/60);
				  grossMins = grossMins % 60;
        }
        this.weeklyTimeSheetData.gross_working_hours.push({date:"Total",h:grossHours,m:grossMins});

        let netHours = this.weeklyTimeSheetData.net_working_hours.map(item => item.h).reduce((prev, next) => prev + next);
        let netMins =  this.weeklyTimeSheetData.net_working_hours.map(item => item.m).reduce((prev, next) => prev + next);
        if(netMins >= 60){
          netHours = netHours + Math.floor(netMins/60);
				  netMins = netMins % 60;
        }
        this.weeklyTimeSheetData.net_working_hours.push({date:"Total",h:netHours,m:netMins});
    
        let misHours = this.weeklyTimeSheetData.MISCELLANEOUS['work_hours'].map(item => item.h).reduce((prev, next) => prev + next);
        let misMins =  this.weeklyTimeSheetData.MISCELLANEOUS['work_hours'].map(item => item.m).reduce((prev, next) => prev + next);
        if(misMins >= 60){
          misHours = misHours + Math.floor(misMins/60);
				  misMins = misMins % 60;
        }

        this.weeklyTimeSheetData.MISCELLANEOUS['work_hours'].push({date:"Total",enable: true,h:misHours,m:misMins});

        let vacHours = this.weeklyTimeSheetData.VACATION['work_hours'].map(item => item.h).reduce((prev, next) => prev + next);
        let vacMins =  this.weeklyTimeSheetData.VACATION['work_hours'].map(item => item.m).reduce((prev, next) => prev + next);
        if(vacMins >= 60){
          vacHours = vacHours + Math.floor(vacMins/60);
				  vacMins = vacMins % 60;
        }
        
        this.weeklyTimeSheetData.VACATION['work_hours'].push({date:'Total',enable: true,h:vacHours,m:vacMins});
      
        this.weeklyTimeSheetData.active_projects.forEach(element => {
          if(element.visibilityFlag){
            let eleHours = element['work_hours'].map(item => item.h).reduce((prev, next) => prev + next);
            let eleMins = element['work_hours'].map(item => item.m).reduce((prev, next) => prev + next);
            if(eleMins >= 60){
              eleHours = eleHours + Math.floor(eleMins/60);
              eleMins = eleMins % 60;
            }
          element['work_hours'].push({date:'Total',enable: true,h:eleHours,m:eleMins});
        }
        });
            if (this.timeSheetType == 'regular') {
              if (this.weeklyTimeSheetData.enableSaveSubmit) {
                this.disableTimesheet = false;
                this.showWsr = true;
              } else {
                this.disableTimesheet = true;
                this.showWsr = true;
              }
            } else if (this.timeSheetType == 'rejected') {
              if (this.weeklyTimeSheetData.enableSaveSubmit) {
                this.disableTimesheet = false;
                this.showWsr = true;
              }
            }
          } else {
            this.weeklyTimeSheetData = false;
            this.showWsr = false;
            emptyFormArray((<FormArray>this.fgWsrProjects.get('active_projects')));
          }

        } else {
        }
      } else {
        this.weeklyTimeSheetData = false;
        this.showWsr = false;
        emptyFormArray((<FormArray>this.fgWsrProjects.get('active_projects')));
        // console.log("Disable timesheet")
      }
      if (this.weeklyTimeSheetData) {
        this.holderRejected.timesheet = { ...this.weeklyTimeSheetData }
      }
      if (initial && this.weeklyTimeSheetData) {
        this.getWeeklyStatusData();
      }
      this.cd.detectChanges();
    })
  }


  // on change timesheet entries
  onTimeSheetChange(data) {
    if (this.timeSheetType == 'rejected') {
      this.hasRejectedValueChange = data.hasValueChanged;
    }
    // console.log(data, this)
    this.disableSaveSubmit = !data.canFinalSubmit;
    this.hasAllZerosInProject = data.hasAllZerosInProject;
    this.cd.detectChanges();
    // console.log(JSON.stringify(this.compTimeSheet.getTimeSheetData()),"            ",JSON.stringify(this.holderRejected.timesheet));
  }

  // get the projects for the employee
  getProjects() {
    this.http.request("get", "projects/").subscribe(res => {
      if (res.status == 200) {
        // console.log(res)
      }
    });
  }

  // checking disbale for save-submit button
  showDisable() {
    if (!this.disableSaveSubmit && this.wsrCharCount < 5000 && this.wsrCharCount > 0) {
      return false;
    }
    else {
      return true;
    }
  }

  // on clicking proceed of save submit popup
  proeceedSaveSubmit() {
    this.disableSaveSubmit = true;
    this.modalSaveSubmit.close();
    this.submitTypeWhileConfirmingAllZeros = 'save-submit';
    this.onSubmitWsr('save-submit');
    // this.onSubmitTimeSheet('save-submit')
  }

  // on clicking submit to submit timesheet
  onSubmitTimeSheet(type) {
    if(type == 'save'){
      this.savedWtr = true;
     }
    var sendRequest = (type) => {
      let params = new HttpParams();
      if (this.timeSheetType == 'rejected') {
        params = params.append('previousweek', "1");
      }
      let timesheet = this.compTimeSheet.getTimeSheetData();
      this.http.request("post", "weeklydata/", params, [timesheet]).subscribe(res => {
        if (res.status == 201) {
          if(type == 'save'){
           this.savedWtr = false;
           }
          this.ss.statusMessage.showStatusMessage(true, "Successfully saved the timesheet");
          if (type == 'save') {
            this.onSubmitWsr(type);
          }
          if (type == 'save-submit') {
            if (this.timeSheetType == 'regular') {
              this.showWsr = true;
            }
          }
          if (this.timeSheetType == 'regular') {
            this.getWeeklyTimeSheetData(true);
            this.getWeeklyStatusData();
          }
          else{
            this.http.request("get", 'statuswisetimesheetcount/').subscribe(res => {
              if (res.status == 200) {
                let pendingApprovalCount = 0;
                let rejectedCount = 0;
                let timesheetsData = res.body;
                pendingApprovalCount = timesheetsData.pending_cnt + timesheetsData.entry_complaince_cnt;
                rejectedCount = timesheetsData.rejected_cnt;
                this.ss.resTimeSheet$.next({
                  rc: rejectedCount,
                  pac : pendingApprovalCount
                })
              }
            })
          }
        } else {
          if(type == 'save'){
            this.savedWtr = false;
            }
          this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
          if (this.timeSheetType == 'regular') {
            this.getWeeklyTimeSheetData(true);
            this.getWeeklyStatusData();
          }
        }
        this.cd.detectChanges();
      });
    }
    this.submitTypeWhileConfirmingAllZeros = type;
    if (this.hasAllZerosInProject) {
      if (this.proceedWithAllZerosInProject) {
        this.proceedWithAllZerosInProject = false;
        sendRequest(this.submitTypeWhileConfirmingAllZeros);
      } else {
        if (type == 'save-submit') {
          this.proceedWithAllZerosInProject = true;
        }
        else{
        this.modalProjectAllZeros.open();
      }
      }
    } else {
      sendRequest(type);
    }

  }

  // to ge tthe wsr data from backend
  getWeeklyStatusData() {
    let params = new HttpParams();
    let url;
    if (this.timeSheetType == 'rejected') {
      params = params.append('previousweek', "1")
      url = "rejectedweeklystatus/";
    } else {
      url = "weeklystatus/";
    }
    this.http.request("get", url, params).subscribe(res => {
      if (res.status == 200) {
        this.weeklyStatusData = res.body[0];
        this.wsrActiveProjectsVisible = [];
        this.wsrActiveProjectsHidden = [];
        emptyFormArray((<FormArray>this.fgWsrProjects.get('active_projects')));
        if (!this.weeklyTimeSheetData.enableSaveSubmit) {
          this.weeklyStatusData.active_projects.forEach((item) => {
            if (item.visibilityFlag) {
              this.wsrActiveProjectsVisible.push(item);
              (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(item.work_report));
            } else {
              // this.wsrActiveProjectsHidden.push(item)
            }
          });
          this.fgWsrProjects.get('general').setValue(this.weeklyStatusData['GENERAL'].work_report)
          this.fgWsrProjects.disable()
        } else {
          this.weeklyStatusData.active_projects.forEach((item) => {
            if (item.visibilityFlag) {
              this.wsrActiveProjectsVisible.push(item);
              let initialValue = "";
              // if (this.timeSheetType == 'rejected') {
              initialValue = item.work_report;
              // }
              (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(initialValue));
            } else {
              this.wsrActiveProjectsHidden.push(item)
            }
          });
          // if (this.timeSheetType == 'rejected') {
          this.fgWsrProjects.get('general').setValue(this.weeklyStatusData['GENERAL'].work_report);
          // }
        }
        if (this.weeklyTimeSheetData) {
          this.holderRejected.wsr = { ...this.weeklyTimeSheetData };
        }

        this.cd.detectChanges();
      }
    });
  }

  checkWsrSubmitEnable() {
    let returnValue;
    if (this.timeSheetType == 'regular') {
      returnValue = (this.wsrCharCount < 5000 && this.wsrCharCount > 0 && this.wsrFormValidity)
    } else {
      returnValue = (this.wsrCharCount < 5000 && this.wsrCharCount > 0 && this.wsrFormValidity && !this.disableSaveSubmit && (this.hasRejectedValueChange || this.wsrFormValueChanged))
    }
    return returnValue;
  }

  // on submitting the wsr form
  onSubmitWsr(type) {
    if(type == 'save'){
      this.savedWsr = true;
    }
    var sendRequest = () => {
      let params = new HttpParams();
      if (this.timeSheetType == 'rejected') {
        params = params.append('previousweek', "1")
      }
      // if atleast one wsr is finished  
      // build the request body
      let requestBody: any = {};
      requestBody.wsr_date = this.weeklyTimeSheetData.days[6]
      requestBody.weekly_status = []
      this.wsrActiveProjectsVisible.forEach((item, index) => {
        requestBody.weekly_status.push(
          {
            project_id: item.project_id,
            report: this.fgWsrProjects.get('active_projects').value[index]
          }
        );
      });
      requestBody.weekly_status.push(
        {
          project_id: this.weeklyStatusData['GENERAL'].project_id,
          report: this.fgWsrProjects.get('general').value
        }
      );
      if (type == 'save') {
        requestBody.is_final_submit = false;
      }
      else {
        requestBody.is_final_submit = true;
      }
      this.http.request("post", "weeklystatus/", params, requestBody).subscribe(res => {
        if (res.status == 201) {
          if(type == 'save'){
            this.savedWsr = false;
           }
          this.ss.statusMessage.showStatusMessage(true, "Successfully saved the weekly status report");
          this.getWeeklyTimeSheetData(true);
          if (this.timeSheetType == 'rejected') {
            this.ss.menu$.next({
              key: 'rejected-timesheet',
              value: false
            })
          }
          this.cd.detectChanges();
        } else {

        }
      });
    }


    if (this.timeSheetType == 'rejected') {
      if (this.hasAllZerosInProject) {
        if (this.proceedWithAllZerosInProject) {
          this.proceedWithAllZerosInProject = false;
          this.hasAllZerosInProject = false;
          this.onSubmitTimeSheet('save-submit');
          sendRequest();
        } else {
          this.modalProjectAllZeros.open();
        }
      } else {
        this.onSubmitTimeSheet('save-submit');
        sendRequest();
      }
    } else {
      if(type == 'save-submit'){
        this.proceedWithAllZerosInProject = false;
      }  
      sendRequest();
    }
  }

}

// for rejected the submit button should be enabled only when there is a change in timesheet and wsr(on revert also enable submit for wsr change)
