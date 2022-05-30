import { Component, ElementRef, HostListener, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import { HttpParams } from '@angular/common/http';
import ValidateEmail from 'src/app/functions/validations/email';
import { NotNull, NoDate } from '../manage-user.component';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { Observable } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';

export interface UserData {
  emp_id: number;
  name: string;
  staff_no: number;
  company: string;
  role: number,
  email: string,
  // managers: {
  //   'emp_id': number;
  //   'emp_name': string;
  // }[]

}

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {

  //  Rahul change(using Viewchild for modalPopup)**************************
  @ViewChild("editEmppopup") editEmppopup: TemplateRef<any>;
  @ViewChild("table") table: ElementRef;
  //  ***********************************************************************
  // ********************************************************************
  // ***************************************************************
  //  Rahul change(using Viewchild for disable employee popup)**************************
  @ViewChild("disableEmppopup") disableEmppopup: TemplateRef<any>;
  @ViewChild("errorOnDisablePopup") errorOnDisablePopup: TemplateRef<any>;
  @ViewChild("successOnDisablePopup") successOnDisablePopup: TemplateRef<any>;

  //  ***********************************************************************
  // ********************************************************************
  // ***************************************************************
  @ViewChild('refModalDisable') modalDisable: ModalPopupComponent
  @ViewChild('refModalDisableError') modalDisableError: ModalPopupComponent
  @ViewChild('refModalDisableSuccess') modalDisableSuccess: ModalPopupComponent

  @ViewChild('editEmp') editUserPopup: ModalPopupComponent;

  //Rahul change(adding variable for use breakpoint observer api using singlton service)************
  get is_XMD_LT() {
    return this.ss.responsive.isMatched(AtaiBreakPoints.XMD_LT)
  }
  //*******************************************************************************************


  fgSearch: FormGroup;
  displayedColumns: string[] = ['serial_no', 'staff_no', 'name', 'company', 'email', 'category', 'edit', 'disable'] // 'reporting_manager', 'managers_manager', 'functional_manager', ];
  GROUPS_DATA: any[];
  IS_mobile:boolean=false;
  constructor(public dialog: MatDialog,
    private datepipe: DatePipe,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder,
    private user: UserService,
    // Rahul change(making DialogRef as a global variable)for closing and opening the squre popup********
    public dialogRef: MatDialogRef<any>,

    private el: ElementRef
    //*****************************************************************************************
    // ***********************************************************************************************
  ) {
    this.fgSearch = this.ss.fb.group({
      filtervalue: ["", [Validators.required]],
    }),
    this.filteredManagers = this.searchField.valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this.filterManagerList(state) : this.employeeListSearch.slice())
      );
      this.ss.responsive.observe(AtaiBreakPoints.XS).subscribe(val=>{ 
        this.IS_mobile=val.matches;
             })
  }
  deleteUserForm = this.fb.group({
    'dol': ['', [Validators.required, NoDate()]],
  })

  USERS_DATA: UserData[] = [];
  ALL_CATEGORIES = [];
  index: number = -1;
  employeeListSearch: any = [];
  employeeList: any = [];
  ALL_GENDERS = [{ name: "Male", id: 1 }, { name: "Female", id: 2 }, { name: "Other", id: 0 }]
  show_message = false;
  filteredManagers: Observable<any>;
  errorMessage: string = "";
  disableEmpName: string = '';
  editAbleEmpName: string = '';
  delete_emp_success_msg: string = '';
  ngOnInit(): void {
    this.getAllReportes();
    this.getCompanies()
    this.getCategories();
    // this.renderer.listen(this.table?.nativeElement,'click',(evt)=>{
    //   console.log('hello u clicked on the table!!!')
    // })
  }
  private filterManagerList(value: string) {
    const filterValue = value.toLowerCase();
    return this.employeeListSearch.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }
  searchField = this.fb.control('ALL', [Validators.required])

  //Rahul change(adding event daligation for table row when clicking on edit and disable icon) *******************************
  @HostListener('click', ['$event'])
  onClickHost(e) {
    let target: any = e.target;
    let tempTarget = target;
    console.log("--------------click");
    // if(e.target.classList.contains('edit')){
    //   let index=e.target.getAttribute("index");
    //   console.log('$$$$$$$$$$$$$$$$$$$$$$$',index);
    //   this.editUser(index);
    // }

    while (tempTarget != this.el.nativeElement) {
      if (tempTarget.classList.contains('edit')) {
        console.log('::::::::::::::clicked on the edit icon');
        let index = tempTarget.getAttribute("index");
        this.editUser(index);
        break;
      }
      if (tempTarget.classList.contains('disable')) {
        console.log('::::::::::::::clicked on the disable icon');
        let index = tempTarget.getAttribute("index");
        this.setId(index);
        this.disableEmppopupopen()
        break;
      }
      tempTarget = tempTarget.parentNode;
    }

  }

  //**************************************************************************** 

  editUserForm = this.fb.group({
    'emp_id': ['', Validators.required],
    'emp_name': ['', Validators.required],
    'staff_no': ['', Validators.required],
    'company': ['', Validators.required],
    // 'rep_manager': ['', [Validators.required, NotNull()]],
    // 'man_manager': ['', [Validators.required, NotNull()]],
    // 'fun_own': ['', [Validators.required, NotNull()]],
    'email': ['', [Validators.required, ValidateEmail]],
    // 'role': [1, Validators.required],

    'category': ['', Validators.required],
    // 'doj': ['', [Validators.required, NoDate()]],
    'gender': ['', Validators.required],
    // 'is_married': ['',Validators.required],
    // 'patentry_maternity_cnt': [0,Validators.required],
  })

  getCategories() {
    let category = []
    this.http.request('get', 'employee-type/').subscribe(res => {
      if (res.status == 200) {
        res.body["results"].forEach(ele => {
          category.push(ele);
        })
        this.ALL_CATEGORIES = category;
      }
    })
  }

  clear() {
    this.searchField.reset();
    this.searchField.setValue('');
    this.searchField.updateValueAndValidity()
  }

  getAllReportes(): void {
    this.employeeListSearch = []
    const params = new HttpParams().set("type", "hr").set("search", this.searchField.value)
    console.log("-----------------", this.searchField.value)
    this.http.request("get", "users/", params).subscribe(res => {

      if (res.body["success"] == true) {
        this.show_message = true
        let emp_list = []
        res.body["results"].forEach(ele => {
          // console.log("---------------",ele)
          Array.prototype.push.apply(emp_list, [ele]);
        })
        console.log('----------------emp_list--', emp_list)

        this.USERS_DATA = emp_list;
        this.employeeList = [...this.USERS_DATA]
        let employeeList = [...this.USERS_DATA];
        this.employeeListSearch.push({ emp_id: -1, emp_name: 'ALL' });
        employeeList.forEach(element => {
          this.employeeListSearch.push(element);
        });


      } else {
        this.ss.statusMessage.showStatusMessage(false, "error in fetching users");
      }

    });


  }

  Search(term:string){
    if(!term || term.trim().toLowerCase() == 'all'){
   this.getAllReportes()
    }else{
      this.USERS_DATA=this.employeeListSearch.filter(x =>
        x.emp_name.trim().toLowerCase().includes(term.trim().toLowerCase())
      );
    }
  }

  getCompanies() {
    this.http.request("get", "all-company/",).subscribe(res => {
      let COMPANY = []
      if (res.body["success"] == true) {
        res.body["results"].forEach(element => {

          COMPANY.push(element["name"])
        });

        this.GROUPS_DATA = COMPANY;
      }
    })

  }
  reset() {
    this.searchField.reset()
    this.USERS_DATA = []
  }
  // (rahul change) adding the onDateSelection() for selecting date****************

  onDate(event): void {
    console.log("Date input:", event)

  }
  //***************************************************************************** */

  editUser(i) { 

    this.editUserForm.controls.emp_id.setValue(this.USERS_DATA[i]["emp_id"]);
    this.editUserForm.controls.emp_name.setValue(this.USERS_DATA[i]["emp_name"]);
    this.editUserForm.controls.staff_no.setValue(this.USERS_DATA[i]["staff_no"]);
    this.editUserForm.controls.company.setValue(this.USERS_DATA[i]["company"]);
    this.editUserForm.controls.email.setValue(this.USERS_DATA[i]["email"]);
    this.editUserForm.controls.category.setValue(this.USERS_DATA[i]["category"]);
    this.editUserForm.controls.gender.setValue(this.USERS_DATA[i]["gender"]);
    // Rahul change(opening modal popup)******************************
    // this.editUserPopup.open() 
    this.dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Edit Employee',
        template: this.editEmppopup,
        maxWidth: '420px',
        hideFooterButtons: true,
        showCloseButton: true,
      },
      autoFocus: false,
      restoreFocus:true
    })
    // calling setId() for getting userName corresponding to click index
    this.setId(i)
    // ******************************************************************
    console.log(i,)
    this
  }

  close() {
    this.editUserForm.reset()
    // this.editUserPopup.close()
    // this.dialog.closeAll()
    console.log("$$$$$  Close cl")
    this.dialogRef.close()

  }

  updateEmp() {
    this.http.request("put", "users/", '', this.editUserForm.value).subscribe(res => {

      if (res.body["success"] == true) {
        console.log("-------------------------")
        this.close()
        this.getAllReportes()
        this
      }
    })

  }
  // disable user 

  disableUser(i) {
    console.log(i);
    this.editUserForm.controls.emp_id.setValue(this.USERS_DATA[i]["emp_id"]);
    this.disableEmp();
  }
  disableEmp() {
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%date%%%%%%%%%%%%%%%%%%%%', this.deleteUserForm.value.dol)
    if (this.deleteUserForm.value.dol) {
      let obj = {
        emp_id: this.editUserForm.value.emp_id,
        relieved: this.datepipe.transform(this.deleteUserForm.value.dol, 'yyyy-MM-dd'),
        //   relieved : this.datepipe.transform(this.deleteUserForm.controls.dol.value.startDate._d, 'yyyy-MM-dd')
      }

      this.http.request("put", "delete/", '', obj).subscribe(res => {
        if (res.status == 400) {
          this.errorMessage = res.error.message + ". First update employee's manager";
          // this.modalDisableError.open()
          //Rahul change(open a dialog box on status 400 when user click on disable employee proceed button ) ************************

          this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-remove-project',
            backdropClass: 'cdk-overlay-darker-backdrop',
            data: {
              template: this.errorOnDisablePopup,
              heading: '',
              hideFooterButtons: true,
            },
            restoreFocus:true
          })
          // **************************************************************** 
          this.deleteUserForm.controls.dol.setValue('')
          return;
        } else if (res.status == 406) {
          this.errorMessage = res.error.message;
          // this.modalDisableError.open()
          //Rahul change(open a dialog box  when user click on disable employee proceed button and enter releaving date less then 
          //joining date ) ************************
          this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-remove-project',
            backdropClass: 'cdk-overlay-darker-backdrop',
            data: {
              template: this.errorOnDisablePopup,
              heading: '',
              hideFooterButtons: true,
            },
            restoreFocus:true
          })
          // **************************************************************** 

          this.deleteUserForm.controls.dol.setValue('')
          return;
        }
        if (res.body["success"] == true) {

          console.log("-------------------------")
          // this.modalDisableError.open()
          //Rahul change(open a dialog box on status success when user click on disable employee proceed button ) ************************

          this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-remove-project',
            backdropClass: 'cdk-overlay-darker-backdrop',
            data: {
              template: this.successOnDisablePopup,
              heading: '',
              hideFooterButtons: true,
            },
            restoreFocus:true
          })
          // **************************************************************** 
          this.close()
          this.getAllReportes()
          this.delete_emp_success_msg = res.body.results
          this.deleteUserForm.controls.dol.setValue('')
          this
        } else {
          alert(res.body.message)

          this.errorMessage = res.body.message;
          // this.modalDisableError.open();
          //Rahul change(open a dialog box  when user click on disable employee proceed button and get some server error 
          this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-remove-project',
            backdropClass: 'cdk-overlay-darker-backdrop',
            data: {
              template: this.errorOnDisablePopup,
              heading: '',
              hideFooterButtons: true,
            },
            restoreFocus:true
          })
          // **************************************************************** 

          this.deleteUserForm.controls.dol.setValue('')
          return;

        }
      })
    } else {
      return;
    }

  }
  setId(i: number) {
    this.index = i;
    this.disableEmpName = this.USERS_DATA[i]["emp_name"]
    //Rahul change(assigning employee name after calling setId() from editUser() by passing the index number*****
    //********************************************************************************************* 
    this.editAbleEmpName = this.USERS_DATA[i]["emp_name"]
    //**********************************************************************
  }

  proeceedDisable() {
    //  Rahul change (closing disableEmployee popup)***************************
    //  **********************************************************************
    //  this.modalDisable.close();
    this.dialogRef.close();
    if (this.index != -1) {
      this.disableUser(this.index);
    }
  }
  open(e) {
    console.log("---------------------------------------------------[[[[[[[[[[[[[[[[[[")
    e.click()
  }

  //Rahul change (disableEmppopupopen() and disableEmppopupclose() are added)in order to open and close disable employee squre
  // popup
  disableEmppopupopen() {
    this.deleteUserForm.get('dol').setValue("")
    this.deleteUserForm.get('dol').markAsUntouched();
    this.dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Edit Employee',
        template: this.disableEmppopup,
        maxWidth: '420px',
        hideFooterButtons: true,
        showCloseButton: true,
      },
      autoFocus: false,
      restoreFocus:true
    })
  }
  // disableEmpclose(){
  //   this.dialogRef.close();
  // }
  //**************************************************************************************** */
  //Rahul change ( disableerorrpopup() is added in order to close all confermation popup 
  // while user click on disable employee proceed  button

  disableerorrpopup() {
    console.log('disable error popup have been close#####################')
    this.dialog.closeAll();
  }
  //**************************************************************************************** */
}