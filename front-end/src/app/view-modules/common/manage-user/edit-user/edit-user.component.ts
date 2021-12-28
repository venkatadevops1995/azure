import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import { HttpParams } from '@angular/common/http';
import ValidateEmail from 'src/app/functions/validations/email';
import { NotNull, NoDate } from '../manage-user.component';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
export interface UserData {
  emp_id: number;
  name: string;
  staff_no: number;
  company: string;
  role: number,
  email:string,
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

  @ViewChild('refModalDisable') modalDisable: ModalPopupComponent
  @ViewChild('refModalDisableError') modalDisableError: ModalPopupComponent
  @ViewChild('refModalDisableSuccess') modalDisableSuccess: ModalPopupComponent
  
  @ViewChild('editEmp') editUserPopup: ModalPopupComponent;
  
  displayedColumns: string[] = ['staff_no', 'name', 'company','email', 'category','edit',  'disable'] // 'reporting_manager', 'managers_manager', 'functional_manager', ];
  GROUPS_DATA: any[];
  constructor(public dialog: MatDialog,
    private datepipe : DatePipe,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder,
    private user: UserService) { 
      this.filteredManagers = this.searchField.valueChanges
        .pipe(
          startWith(''),
          map(state => state ? this.filterManagerList(state) : this.employeeListSearch.slice())
        );
    }
    deleteUserForm = this.fb.group({
      'dol': ['', [Validators.required, NoDate()]],
    })
  
  USERS_DATA: UserData[] = [];
  ALL_CATEGORIES = [];
  id : number = -1;
  employeeListSearch: any = [];
  employeeList: any = [];
  ALL_GENDERS = [{name:"Male",id:1},{name:"Female",id:2},{name:"Other",id:0}]
  show_message = false;
  filteredManagers: Observable<any>;
  errorMessage : string = "";
  disableEmpName: string = '';
  ngOnInit(): void {
    this.getAllReportes();
  }
  private filterManagerList(value: string) {
    const filterValue = value.toLowerCase();
    return this.employeeListSearch.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }
  searchField = this.fb.control('ALL',[Validators.required])
  
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

    'category': ['',Validators.required],
    // 'doj': ['', [Validators.required, NoDate()]],
    'gender' : ['',Validators.required],
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
  clear(){
    this.searchField.reset();
    this.searchField.setValue('');
    this.searchField.updateValueAndValidity()
   }
  getAllReportes(): void {
    this.employeeListSearch=[]
    const params = new HttpParams().set("type","hr").set("search",this.searchField.value)
    console.log("-----------------",this.searchField.value)
    this.http.request("get", "users/",params).subscribe(res => {

      if (res.body["success"] == true) {
        this.show_message =true
        let emp_list = []
        res.body["results"].forEach(ele => {
          // console.log("---------------",ele)
          Array.prototype.push.apply(emp_list, [ele]);
        })
        console.log('----------------emp_list--',emp_list)

        this.USERS_DATA = emp_list;
        this.employeeList = [...this.USERS_DATA]
        let employeeList = [...this.USERS_DATA];
        this.employeeListSearch.push({emp_id:-1,emp_name:'ALL'});
        employeeList.forEach(element => {
          this.employeeListSearch.push(element);
        });


      } else {
        this.ss.statusMessage.showStatusMessage(false, "error in fetching users");
      }

    });


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
  reset(){
    this.searchField.reset()
    this.USERS_DATA = []
  }


  editUser(i){
    this.  getCompanies() 
    this.getCategories()
    
    this.editUserForm.controls.emp_id.setValue(this.USERS_DATA[i]["emp_id"]);
    this.editUserForm.controls.emp_name.setValue(this.USERS_DATA[i]["emp_name"]);
    this.editUserForm.controls.staff_no.setValue(this.USERS_DATA[i]["staff_no"]);
    this.editUserForm.controls.company.setValue(this.USERS_DATA[i]["company"]);
    this.editUserForm.controls.email.setValue(this.USERS_DATA[i]["email"]);
    this.editUserForm.controls.category.setValue(this.USERS_DATA[i]["category"]);
    this.editUserForm.controls.gender.setValue(this.USERS_DATA[i]["gender"]);

    this.editUserPopup.open()
    console.log(i,)
    this
  }
  close(){
    this.editUserForm.reset()
    this.editUserPopup.close()

  }

  updateEmp() {
    this.http.request("put", "users/",'', this.editUserForm.value).subscribe(res => {

      if (res.body["success"] == true) {
          console.log("-------------------------")
          this.close()
          this.getAllReportes()
          this
      }
    })

  }
  // diable user 

  disableUser(i){
    console.log(i);
    this.  getCompanies() 
    this.getCategories();
    this.editUserForm.controls.emp_id.setValue(this.USERS_DATA[i]["emp_id"]);
    this.disableEmp();
  }
  disableEmp() {
    let  obj = {
      emp_id : this.editUserForm.value.emp_id,
      relieved : this.datepipe.transform(this.deleteUserForm.controls.dol.value.startDate._d, 'yyyy-MM-dd')
    }
    this.http.request("put", "delete/",'', obj).subscribe(res => {
      if (res.status == 400) {
          this.errorMessage = res.error.message + ". First update employee's manager";
        this.modalDisableError.open()
        return;
      }
      if (res.body["success"] == true) {
  
          console.log("-------------------------")
          this.modalDisableSuccess.open()
          this.close()
          this.getAllReportes()
          this
      } else {
        alert(res.body.message)

        this.errorMessage = res.body.message;
        this.modalDisableError.open()
        return;
        
      }
    })
  }
  setId(id : number) {
    this.id = id;
    this.disableEmpName = this.USERS_DATA[0]["emp_name"]    
  }

   proeceedDisable(i) {
    
     this.modalDisable.close();
     if (this.id != -1) {
       this.disableUser(this.id);
     }
  }
  open(e){
    console.log("---------------------------------------------------[[[[[[[[[[[[[[[[[[")
    e.click()
  }
}
