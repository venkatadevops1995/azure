import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { MatDatepicker, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { split } from 'lodash';
import * as moment from 'moment';
import { Moment } from 'moment';
// import { DaterangepickerComponent, DaterangepickerDirective } from 'ngx-daterangepicker-material';
// import { start } from 'repl';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs/operators';
import { slideAnimationTrigger } from 'src/app/animations/slide.animation';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { LeaveApplcnStatus, MILLISECONDS_DAY } from 'src/app/constants';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';
import { FileDownloadService } from 'src/app/directives/file-download/file-download.service';
@Component({
    selector: 'app-manage-self-leaves',
    templateUrl: './manage-self-leaves.component.html',
    styleUrls: ['./manage-self-leaves.component.scss'],
    animations: [slideAnimationTrigger]
})
export class ManageSelfLeavesComponent implements OnInit {
    appliedLeaveColumns: string[] = ['serial', 'startdate', 'enddate', 'day_count', 'leave_type', 'status' ,'view'];
    historyLeaveColumns: string[] = ['serial', 'startdate', 'enddate', 'day_count', 'leave_type', 'leavestatus', 'correctionstatus' ,'view'];
    leaveRequestSingleColumns: string[] = ['serial', 'date', 'session'];
    timesheetDiscrepancyColumns : string[] = ['date','project','posted_hours','modified_hours']
    leaveReasons: Array<any> = ['Sick', 'Casual', 'Travel', 'Other'];
    currentBalance = 0;
    selectedCount = 0;
    LEAVE_HISTORY_DATA = [];
    LEAVE_APPLICATION_DATA = [];
    LEAVE_REQUEST_SINGLE_DATA: any = [];
    TIMESHEET_DISCREPANCY_DATA :any = []

    destroy$: Subject<any> = new Subject();

    leaveApplcnStatus = LeaveApplcnStatus

    fromdate: any;
    todate: any;
    maxDate = moment().subtract(0, 'days');

    minDate = moment().subtract(30, 'days')
    leaveCategories = ["Half Day", "Single Day", "Multiple Days"];
    // leaveTypes = ["Paid", "Unpaid", "Marriage", "Maternity/Paternity"];
    leaveTypes = []
    leaveHours = ["FIRST", "SECOND"];
    selectedHistoryRange: any = {};
    selectedAppliedRange: any = {};
    today = new Date()

    specialLeaveTypeRequestsAvailable: Array<{ id: number, name: string, available: number }> = []

    // Dateipicker
    datePickerLeaveApplcn: any = {
        startAtStartDate: new Date(this.today.getTime() - 30 * MILLISECONDS_DAY),
        startAtEndDate: new Date(),
        endAtEndDate: new Date(),
        noOfLeaveDays: {
            'Marriage': 4,
            'Paternity': 2,
            'Paid': 180,
            'Maternity': 182
        },
        dateClass: (position: 'start' | 'end' = 'start') => {
            let that = this;
            return (date: Date) => {
                const day = (date).getDay();
                // Prevent Saturday and Sunday from being selected. 
                let startDate = (position == 'start') ? that.datePickerLeaveApplcn.startAtStartDate : that.datePickerLeaveApplcn.startAtEndDate;
                let selectedDate = this.applyForm.get(position + 'Date').value;
                startDate.setHours(0, 0, 0, 0)
                let dateClassString = "";
                if (date < startDate || (day == 0 || day == 6) || (this.checkDateisThere(date,this.holidayList))) {
                    dateClassString += 'mat-calendar-body-disabled';
                }else if(date.getFullYear()!=this.today.getFullYear()){
                    dateClassString += 'mat-calendar-body-disabled';
                }
                 else {
                    if (selectedDate) {
                        if (selectedDate.getTime() == date.getTime()) {
                            // dateClassString += 'mat-calendar-body-cell-selected';
                        }
                    }
                }
                return dateClassString;
            }
        },
        dataPickerFilter: (position: 'start' | 'end' = 'start') => {
            return (date: Date) => {
                let startDate = (position == 'start') ? this.datePickerLeaveApplcn.startAtStartDate : this.datePickerLeaveApplcn.startAtEndDate;
                startDate.setHours(0, 0, 0, 0)
                const day = (date).getDay();
                let leaveType = this.applyForm.get('type').value.name
                let condition = false;
                if (position == 'end') {
                    let endDate = this.datePickerLeaveApplcn.endAtEndDate
                    condition = !(date < startDate) && !(date > endDate)
                    return (condition && (day != 0 && day != 6) && (!this.checkDateisThere(date,this.holidayList))) && date.getFullYear()==this.today.getFullYear()
                } else {
                    condition = !(date < startDate)
                    return (condition && (day != 0 && day != 6) && (!this.checkDateisThere(date,this.holidayList))) && date.getFullYear()==this.today.getFullYear()
                }
            }
        },
        addDaysToDate: (startDate, noOfDays, weekends = false) => {
            // no of days from the start date excluding weekends 
            
            let count = 0
            let endDate = startDate;
            while (count < noOfDays) {
                // (!this.holidayList.includes(JSON.stringify(date)))
                endDate = new Date(endDate.getTime() + MILLISECONDS_DAY)
                
                let day = endDate.getDay()
                if (((day != 0 && day != 6 && !this.checkDateisThere(endDate,this.holidayList)) || weekends)) {
                    count++
                }
            }
            return endDate;
        }
    }

    ranges: any = {
        // 'Today': [moment(), moment()],
        // 'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
        // 'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
        // 'Last 2 Years': [moment().subtract(2, 'year').startOf('year'), moment().subtract(1, 'month').endOf('month')]
    }

    @ViewChild('applyLeaveDialog') applyLeavePopup: ModalPopupComponent;

    @ViewChild('showAppliedLeaveDialog') showAppliedLeavePopup: ModalPopupComponent;

    @ViewChild('refPicker2') datePickerEndDate: MatDatepicker<any>;

    @ViewChild('refPicker1') datePickerStartDate: MatDatepicker<any>;

    // @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;

    @ViewChild('timesheetDiscrepancyDialog') timesheetDiscrepancyPopup: ModalPopupComponent;

    // @ViewChild(DaterangepickerComponent) pickerDirective: DaterangepickerComponent;
    applied_heading = ""
    appliedCount = 0;
    historyCount = 0;
    // picker: DaterangepickerComponent;
    applyForm: FormGroup;
    @ViewChild('f') applyFormNgForm: NgForm;
    applyFormSubmitted: boolean = false;

    // boolean to disable / enable the first 2 categories of category form control
    disableFirst2Categories: boolean = false

    // user gender from the jwt token
    gender: string;

    // store the leave request detail pop up request id
    leaveDetailsRequestId: { request_id: number, get_discrepancy?:boolean };

    // boolean to track if the discrepancy form is submitted after opening
    applyDiscrepancyFormSubmitted: boolean = false

    // leave discrepancy date selection and comments form
    fgDiscrepancyForm: FormGroup

    // leave discrepancy data
    leaveDiscrepancyData: any = {}

    @ViewChild('refLeaveDiscrepancyDialog') compDiscrepancyModal: ModalPopupComponent;
    holidayList: any = [];
    selectedEndDate: any;

    constructor(
        public datepipe: DatePipe,
        private fb: FormBuilder,
        private http: HttpClientService,
        private ss: SingletonService,
        private cdRef: ChangeDetectorRef,
        public dialog: MatDialog,
        private user: UserService,
        private fileDownload:FileDownloadService
    ) {
        this.applyForm = this.fb.group({
            "category": ['', Validators.required],
            "startDate": ["", Validators.required],
            "endDate": [""],
            "half": [""],
            "startDateSecondHalf": [""],
            "endDateFirstHalf": [""],
            "invitationUpload": [null],
            "type": ['', Validators.required],
            "reason": [""],
            "comment": ['', Validators.required]
        })
        this.gender = this.user.getDataFromToken('gender')
        console.log(this.gender)

        this.fgDiscrepancyForm = this.ss.fb.group({
            selectedDays: ["", Validators.required],
            comments: ["", Validators.required]
        })
    }

    ngOnInit(): void {
        this.disableFirst2Categories = false;
        this.getCurrentLeaveBalance();
        this.getLeaveRequestsAvailability();
        this.getLeaveConfig()
        // this.fromdate = this.convertDatefmt(this.ranges['Last 30 Days'][0])
        // this.todate = this.convertDatefmt(this.ranges['Last 30 Days'][1])
        this.getAppliedLeaves();
        this.getHolidays();
        // this.selectedHistoryRange["startDate"] = this.ranges['Last 30 Days'][0];
        // this.selectedHistoryRange["endDate"] = this.ranges['Last 30 Days'][1];
        this.selectedHistoryRange["startDate"] = null;
        this.selectedHistoryRange["endDate"] = null;


        this.disableHalfDayCheckBoxes()

        // TODO: merge the value changes of the form. currently as the change detector is continuously firing in this compnent it is handled this way
        this.applyForm.get('startDate').valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe((val) => {
            if (val) {
                this.applyForm.get('startDateSecondHalf').enable()
            }
            this.chosenDate()
        })
        this.applyForm.get('category').valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe((val) => {
            this.disableHalfDayCheckBoxes()
            this.chosenDate()
        })
        this.applyForm.get('endDate').valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe((val) => {
            if (val) {
                this.applyForm.get('endDateFirstHalf').enable()
            }
            this.chosenDate()
        })
        this.applyForm.get('half').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
            this.chosenDate()
        })
        this.applyForm.get('startDateSecondHalf').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
            this.chosenDate()
        })
        this.applyForm.get('endDateFirstHalf').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
            this.chosenDate()
        })
        this.applyForm.get('type').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
            this.applyForm.get('startDate').reset()
            this.applyForm.get('endDate').reset()
            this.applyForm.get('reason').reset()
            this.applyForm.get('startDateSecondHalf').disable();
            this.applyForm.get('endDateFirstHalf').disable();
            this.applyForm.get('invitationUpload').reset()

            this.selectedCount = 0
            let category = this.applyForm.get('category')
            if (val) {
                if (val.name == 'Marriage' || val.name == 'Paternity' || val.name == 'Maternity') {
                    category.setValue('Multiple Days')
                    // category.disable()
                    this.disableFirst2Categories = true
                    this.applyForm.get('reason').disable()
                    // this.applyForm.get('reason').clearValidators()
                } else {
                    category.setValue("")
                    this.disableFirst2Categories = false
                    category.markAsUntouched()
                    category.markAsPristine()
                    this.applyForm.get('reason').enable()
                    // this.applyForm.get('reason').setValidators(Validators.required)
                }
                this.applyForm.get('invitationUpload').clearValidators()
                this.applyForm.get('invitationUpload').setValidators(val.name == "Marriage" ? [Validators.required] : [])
                this.applyForm.get('invitationUpload').updateValueAndValidity()
            }
        })

    }

    ngAfterViewInit() {
        setTimeout(() => {
            // this.pickerDirective.clear()
        })
        console.log("===================================",this.applyForm);
        
    }

    ngOnDestroy() {
        this.destroy$.next(null)
        this.destroy$.complete();
    }

    // get leave config
    getLeaveConfig() {
        let category = this.user.getDataFromToken('category');
        // let categorySlug = category.replace(' ','-').toLowerCase()
        let params = new HttpParams()
        params = params.append('category', category)

        this.http.request('get', 'leave/config/category/', params).subscribe((res) => {
            if (res.status == 200) {
                console.log(res)
                let leaveCredits = res.body['results']
                let obj = {}
                leaveCredits.forEach(item => {
                    obj[item.leave_type_name] = item.leave_type_name == 'Paid' ? 180 : item.leave_credits
                });
                this.datePickerLeaveApplcn.noOfLeaveDays = obj
                console.log(this.datePickerLeaveApplcn)
            }
        })
    }


    getHolidays(){
        let emp_id = this.user.getEmpId()
        let params = new HttpParams()
        params = params.append('emp_id',emp_id)

        this.http.request('get', 'holiday/', params).subscribe((res) => {
            if (res.status == 200) {
                console.log(res)
                res.body.forEach(element => {
                    let d=new Date(element.holiday_date)
                    d.setHours(0,0,0,0);
                    this.holidayList.push(d)
                });
               
            }
        })
    }

    disableHalfDayCheckBoxes() {
        this.applyForm.get('startDateSecondHalf').disable()
        this.applyForm.get('endDateFirstHalf').disable()
    }

    open(e) {
        e.click()
    }

    convertDatefmt(date) {
        return this.datepipe.transform(date, 'yyyy-MM-dd');
    }

    updateRange(event) {
        if (event.startDate) {
            this.fromdate = this.convertDatefmt(event.startDate._d);
        }
        if (event.endDate) {
            this.todate = this.convertDatefmt(event.endDate._d);
        }
    }


    // on clicking the raise discrepancy button
    onClickRaiseDiscrepancy(e, data) {
        // 
        let dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-popup',
            data: {
                confirmMessage: 'Are you sure you want to raise correction ?',
                showTextbox: true,
                placeholderTextField: 'Enter correction comments'
            }
        })

        // 
        dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
            if (result) {
                // STEP: send request to save the leave discrepancy
                let requestBody = { emp_comments: result.text }
                let params = new HttpParams({
                    fromObject: {
                        leave_request_id: data.id
                    }
                })
                this.http.request('post', 'leave/discrepancy/', params, requestBody).subscribe(res => {
                    let status = res.status
                    if (status == 200) {
                        this.leaveDiscrepancyData = res.body['results']
                        this.ss.statusMessage.showStatusMessage(true, res.body['message'])
                        this.getLeaveHistory()
                    } else {
                        this.ss.statusMessage.showStatusMessage(false, res.error['message'])
                    }
                });
            }
        })
    }
 

    openApplyPopUp() {
        this.applyForm.reset({ "daterange": { value: '', disabled: true } });
        // this.applyForm.controls.daterange.disable();
        this.leaveTypes = []
        this.http.request('get', 'leave/types').subscribe(res => {
            if (res.status == 200) {
                res.body["results"].forEach(element => {
                    if (element.name == 'Maternity') {
                        if (this.gender == "Female") {
                            this.leaveTypes.push(element);
                        }
                    } else if (element.name == 'Paternity') {
                        if (this.gender == "Male") {
                            this.leaveTypes.push(element);
                        }
                    } else {
                        this.leaveTypes.push(element);
                    }

                });
                this.applyForm.reset()
                this.applyFormSubmitted = false;
                this.applyLeavePopup.open();
            }
            else {
                this.ss.statusMessage.showStatusMessage(false, "Could not get the leave types")
            }
        })

    }

    // on closing the leave application modal form
    closeApplyForm() {
        console.log('cosed modal');
        this.applyFormNgForm.resetForm()
        this.applyLeavePopup.close();
        this.applyFormSubmitted = false;
    }

    // onClickCancelLeaveApplication
    onClickCancelLeaveApplication(e: MouseEvent, data) {
        let target = e.target;
        let dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                confirmMessage: "Are you sure you want to cancel leave application ?"
            },
            panelClass: 'confirm-popup'
        })
        dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
            if (result) {
                // send the http request to cancel the leave request
                this.http.request('delete', "leave/request/" + data.id).subscribe(res => {
                    if (res.status == 200) {
                        this.getAppliedLeaves()
                        this.getCurrentLeaveBalance()
                        this.getLeaveHistory()
                        this.ss.statusMessage.showStatusMessage(true, 'Leave cancelled successfully')
                    } else if (res.status == 404) {
                        this.ss.statusMessage.showStatusMessage(false, "The leave application does not exist")
                    } else if (res.status == 412) {
                        this.ss.statusMessage.showStatusMessage(false, res.error['message'])
                    } else if (res.status == 409) {
                        this.ss.statusMessage.showStatusMessage(false, "Database error. Could not delete the leave application")
                    } else {
                        this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
                    }
                })
            }
        })
    }
    checkDateisThere(d,l){
        for(let i=0;i<l.length;i++){
            if(l[i].getTime()==d.getTime()){
                return true;
            } 
        }
       
        return false;
    }
    chosenDate() {
        let f = this.applyForm.controls;
        let startDate = f.startDate.value
        let startDateValue
        if (startDate) {
            startDateValue = new Date(startDate.getTime())
            startDateValue.setHours(0, 0, 0, 0)
        }
        if (f.category.value == 'Half Day') {
            this.selectedCount = (f.startDate.valid && f.half.valid) ? 0.5 : 0
        } else if (f.category.value == 'Single Day') {
            this.selectedCount = (f.startDate.valid) ? 1 : 0
        } else if (f.category.value == 'Multiple Days') {
            if (f.startDate.value && f.endDate.value) {
                f.endDate.value.setHours(0, 0, 0, 0)
                let diff = 0
                // let diff=Math.floor((Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())) - Date.UTC(start_dt.getFullYear(), start_dt.getMonth(), start_dt.getDate()))/(1000 * 60 * 60 * 24);
                while (startDateValue <= f.endDate.value) {
                    if ((startDateValue.getDay() != 0) && (startDateValue.getDay() != 6) && !this.checkDateisThere(startDateValue,this.holidayList) || this.applyForm.value.type.name=='Maternity') {
                        diff++;
                    }
                    startDateValue = new Date(startDateValue.getTime() + MILLISECONDS_DAY)
                    startDateValue.setHours(0, 0, 0, 0)
                }
                this.selectedCount = diff;
                
            } else {
                this.selectedCount = 0
            }
            if (f.startDateSecondHalf.value) {
                this.selectedCount -= 0.5
            }
            if (f.endDateFirstHalf.value) {
                this.selectedCount -= 0.5
            }

        } else if (f.category.value == 'Single Day') {
            this.selectedCount = (f.startDate.value) ? 1 : 0
        }
        this.cdRef.detectChanges();
    }

    // when the leave selection for half, single, multiple is changing
    onCategoryChanged(e: MatRadioChange) {
        let form = this.applyForm;
        form.get('half').reset();

        let startDate = form.get('startDate')
        let endDate = form.get('endDate')
        let halfDay = form.get('half')

        startDate.reset();
        startDate.clearValidators()
        endDate.reset()
        endDate.clearValidators();
        halfDay.clearValidators();
        halfDay.reset(this.leaveHours[0]);

        form.get('startDateSecondHalf').reset();
        form.get('endDateFirstHalf').reset();
        this.chosenDate();
        if (e.value == "Multiple Days") {
            startDate.setValidators([Validators.required])
            endDate.setValidators([Validators.required])
        } else if (e.value == 'Single Day') {
            startDate.setValidators([Validators.required])
        } else if (e.value == 'Half Day') {
            halfDay.setValidators([Validators.required])
        }
    }

    getLeaveHistory(selectedRange?: any) {
        // if (selectedRange["startDate"] == null || selectedRange["endDate"] == null)
        //   return

        // console.log("-------------------", selectedRange, selectedRange["startDate"]._d, selectedRange["endDate"]._d);
        let history = [];
        this.LEAVE_HISTORY_DATA = []
        let params = new HttpParams()
        params = params.append('filter', 'history')
        if (selectedRange && selectedRange['startDate'] && selectedRange['endDate']) {
            let st_dt = new Date(selectedRange["startDate"]._d);
            let ed_dt = new Date(selectedRange["endDate"]._d + 1);
            params = params.append('start_date', this.datepipe.transform(st_dt, 'yyyy-MM-ddT00:00:00'))
            params = params.append('end_date', this.datepipe.transform(ed_dt, 'yyyy-MM-ddT00:00:00'))
        }
        this.http.request('get', 'leave/request/', params).subscribe(res => {
            if (res.status == 200) {
                console.log("---------------------", res.body["results"]);
                res.body["results"].forEach(element => {
                    this.LEAVE_HISTORY_DATA.push(element)
                })
            } else if (res.status == 204) {

            } else {
                this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
            }
        })
    }

    getAppliedLeaves() {
        this.LEAVE_APPLICATION_DATA = [];
        let params = new HttpParams()
        params = params.append('filter', 'pending')
        this.http.request('get', "leave/request/", params).subscribe(res => {
            console.log("applied leaves", res);
            if (res.status == 200) {
                res.body["results"].forEach(element => {
                    // console.log("each ", element);
                    let today = new Date()
                    today.setHours(0, 0, 0, 0)
                    let startDate = new Date(element.startdate)
                    let endDate = new Date(element.enddate)
                    let isInProgress = (today >= startDate && today <= endDate)
                    element.isInProgress = isInProgress
                    // console.log(isInProgress, startDate, endDate, today);
                    this.LEAVE_APPLICATION_DATA.push(element)
                });
                this.appliedCount = this.LEAVE_APPLICATION_DATA.length;
            }
        })
        // this.LEAVE_APPLICATION_DATA = [...this.LEAVE_APPLICATION_TEST_DATA];
        // this.appliedCount = this.LEAVE_APPLICATION_DATA.length;
    }


    // get the leave requests available for the current user for special leave types
    getLeaveRequestsAvailability() {
        this.http.request('get', 'leave/special-leave-requests-available').subscribe((res) => {
            if (res.status == 200) {
                this.specialLeaveTypeRequestsAvailable = res.body['results']
                console.log(this.specialLeaveTypeRequestsAvailable);

            } else {
                this.specialLeaveTypeRequestsAvailable = []
            }
        })
    }
 

    // 
    onSubmitApplyForm() {
        
        this.applyFormSubmitted = true;
        let sendRequest = () => {
            let fd = new FormData();
            let f = this.applyForm.value
            fd.append("day_leave_type", f.category);
            fd.append("leave_type", f.type.id);
            // fd.append('invitation_file', )
            if (f.invitationUpload && f.invitationUpload.length > 0) {
                f.invitationUpload.forEach(file => {
                    fd.append('invitation_files', file)
                });
            }
            if (f.category == "Half Day") {
                fd.append("hour", f.half);
            } else {
                fd.append("hour", "");
            }
            fd.append("startdate", this.datepipe.transform(f.startDate, 'yyyy-MM-ddT00:00:00'));
            if (f.category == 'Multiple Days') {
                fd.append("enddate", this.datepipe.transform(f.endDate, 'yyyy-MM-ddT00:00:00'));
            } else if (f.category == 'Single Day' || f.category == "Half Day") {
                // for single and half day requests set the end date same as start date
                fd.append("enddate", this.datepipe.transform(f.startDate, 'yyyy-MM-ddT00:00:00'));
            } else {
                fd.append("enddate", "");
            }
            fd.append("leave_reason", f.reason);
            fd.append("emp_comments", f.comment);
            fd.append("start_date_second_half", f.startDateSecondHalf || "");
            fd.append("end_date_first_half", f.endDateFirstHalf || "");
            console.log("----------------------ffffffffff-------------------");
            this.TIMESHEET_DISCREPANCY_DATA.forEach(el=>{
                fd.append("time_tracker_id",el.id);
                fd.append('modified_work_minutes',(parseInt(el.modified_work_minutes.split(":")[0],10)*60+parseInt(el.modified_work_minutes.split(":")[1],10)).toString());
                console.log("-----------------------------------------",(parseInt(el.modified_work_minutes.split(":")[0],10)*60+parseInt(el.modified_work_minutes.split(":")[1],10)).toString());
                
            })
            this.http.request('post', 'leave/request/', '', fd).subscribe(res => {
                if (res.status == 200) {
                    this.ss.statusMessage.showStatusMessage(true, "leave application has been submitted successfully")
                    this.closeApplyForm();
                    this.timesheetDiscrepancyPopup.close();
                    this.getCurrentLeaveBalance();
                    this.getAppliedLeaves();
                    this.getLeaveHistory();
                    this.TIMESHEET_DISCREPANCY_DATA = []
                    
                } else {
                    if (res.status == 406) {
                        // max no of messages
                        this.ss.statusMessage.showStatusMessage(false, res.error.message)
                    } 
                    else if(res.status==408){
                        let dates = res.error.results;
                        dates = dates.map((item) => this.datepipe.transform(item, 'dd/MM/yyyy'))
                        // this.ss.statusMessage.showStatusMessage(false, res.error.message)
                        let dialogRef = this.dialog.open(ConfirmDialogComponent, {
                            panelClass: 'confirm-popup',
                            data: {
                                
                                confirmMessage: res.error.message,
                                onlyForAlert: true
                            }
                        })
                    }
                    else if (res.status == 409) {
                        let dates = res.error.results;
                        dates = dates.map((item) => this.datepipe.transform(item, 'dd/MM/yyyy'))
                        this.ss.statusMessage.showStatusMessage(false, "The requested date(s) " + dates.join(", ") + " " + (dates.length == 1 ? "has" : "have") + " conflict with another request")
                    } else {
                        this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
                    }
                }
            })
        }
        if (this.applyForm.valid) {
           
            if (this.currentBalance - this.selectedCount < 0 && this.applyForm.get('type').value == 'Paid') {
                this.ss.takeConfirmation(this, 'The no of leaves remaining after deduction is negative. Extra leave days will be UNPAID leaves. Confirm to proceed.', sendRequest, ['test'])
            } else {
                let leaveType = this.applyForm.value.type.name
                if (leaveType == 'Paid') {
                    sendRequest()
                } else {
                    // take a confirmation if the leave request remainng for that leave type is zero
                    let leaveRequestRemaining = this.specialLeaveTypeRequestsAvailable.filter(item => item.name == leaveType)[0].available
                    if (leaveRequestRemaining <= 0) {
                        this.ss.takeConfirmation(this, 'You do not have leave requests remaining for this leave type. Do you want to proceed ?', sendRequest, [])
                    } else {
                        sendRequest()
                    }
                }
            }
        }
    }

    getTimesheetDiscrepancy(){
        if (this.applyForm.valid) {
            var param = new HttpParams();
            let f = this.applyForm.value
            

            param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
            if (f.category == 'Multiple Days') {
                param=param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
                param=param.append("end_date", this.datepipe.transform(f.endDate, 'yyyy-MM-dd'));
                console.log(f.category )

                
                param=param.append("start_date_second_half", f.startDateSecondHalf || "");
                
                param=param.append("end_date_first_half", f.endDateFirstHalf || "");

            } else if (f.category == 'Single Day' || f.category == "Half Day") {
                // for single and half day requests set the end date same as start date
                param=param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
                param=param.append("end_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
                if(f.category == "Half Day"){
                    param=param.append("start_date_second_half", 'true');
    
                    }
            }
            
            this.http.request('get', 'get-submitted-timesheet/',param).subscribe(res => {
                if (res.status == 200) {

                    if(res.body["results"].length > 0){
                        console.log("-----------ts dis----------------",res.body["results"])
                        this.TIMESHEET_DISCREPANCY_DATA =res.body["results"]
                        this.timesheetDiscrepancyPopup.open()   
                    }
                    else{
                        this.onSubmitApplyForm() 
                    }
                    
                }
            })  

        }else{
            console.log("-------------------------",this.applyForm);
            // var formControls = this.applyForm.controls
            (<any>Object).values(this.applyForm.controls).forEach(e=>{
                e.markAsTouched();

                console.log("================================================",e);
                
            })

        }

    }


    getCurrentLeaveBalance() {
        this.http.request('get', 'leave/balance/').subscribe(res => {
            if (res.status == 200) {
                this.currentBalance = res.body["results"][0]["outstanding_leave_bal"];
            }
        })
    }

    onChangeStartDate(e: MatDatepickerInputEvent<Date>) {
        
        let addDaysToDate = this.datePickerLeaveApplcn.addDaysToDate
        
        let dateSelected = e.value;
        let endDateTimeStamp = addDaysToDate(dateSelected, 1);
        this.datePickerLeaveApplcn.startAtEndDate = new Date(endDateTimeStamp)
        let leaveType = this.applyForm.get('type').value.name
        this.datePickerLeaveApplcn.endAtEndDate = addDaysToDate(dateSelected, this.datePickerLeaveApplcn.noOfLeaveDays[leaveType] - 1, leaveType == 'Maternity')
        let fcEndDate = this.applyForm.get('endDate');
        if(leaveType == 'Maternity' || leaveType=='Paternity' || leaveType=='Marriage'){
            this.selectedEndDate = this.datePickerLeaveApplcn.endAtEndDate;
            fcEndDate.setValue(this.selectedEndDate);
            this.applyForm.updateValueAndValidity();
        }
        else{
            fcEndDate.reset();
        }
        
        if (this.applyForm.get('category').value == 'Multiple Days') {
            fcEndDate.setValidators([Validators.required])
        } else {
            fcEndDate.clearValidators();
        }
    }

    // set the opened date for start date in leave application
    onOpenStartDateDatePicker() {
        
        this.datePickerStartDate.startAt = this.applyForm.value.endDate || new Date()
        
    }   

    // set the open date for end date in leave application
    onOpenEndDateDatePicker() {
        this.datePickerEndDate.startAt = this.applyForm.value.endDate || this.datePickerLeaveApplcn.startAtEndDate;
    }


     onClickExportResolved() {
        let mapping = {
            empName: 'emp_name',
            emp_id: 'emp_id',
            startDate: 'startdate',
            endDate: 'enddate'
        }
        // let dp: any = this.pickerDirective.value
        let dp:any = {}
        // get the sorting
        let params = new HttpParams({
            fromObject: {
                emp_id: String(this.user.getEmpId()) || "",
                filter: 'history',
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

}
