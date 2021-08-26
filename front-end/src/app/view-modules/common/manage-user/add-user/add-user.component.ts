import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { cloneDeep } from 'lodash';
import ValidateEmail from 'src/app/functions/validations/email';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';
export interface UserData {
  emp_id: number;
  name: string;
  staff_no: number;
  company: string;
  role: number,
  managers: {
    'emp_id': number;
    'emp_name': string;
  }[]

}
export interface ProjectData {
  id: number,
  name: string
}
export function NotNull(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const res = ((control.value === null) || control.value === "")
    return res ? { notNull: res } : null
  }
}

export function NoDate(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if(control.value==null){
      return  { notNull: true }
    }
    const res = ((control.value['startDate'] === null) || control.value['startDate'] === "")
    
    return res ? { notNull: true } : null
  }
}

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {

  ATWORK_ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }]
  displayedColumns: string[] = ['staff_no', 'name', 'company', 'reporting_manager', 'managers_manager', 'functional_manager', 'edit'];
  data: UserData[] = [];
  USERS_DATA: UserData[] = [];
  RM_DATA: UserData[] = [];
  MM_DATA: UserData[] = [];
  FM_DATA: UserData[] = [];
  edited_emp_role: any;
  PROJECT_LIST: ProjectData[] = []
  GROUPS_DATA = []

  ALL_CATEGORIES = []
  effected_emp_count = 0;

  // ROLES = [...this.ATWORK_ROLES]; //[{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }]
  ROLES = cloneDeep(this.ATWORK_ROLES)
  newUserFirstName = '';
  newUserLastName = '';
  makeSelfRM = false;
  makeSelfMM = false;
  makeSelfFM = false;
  newUserRoleValue = 1;
  user_role_id: any;
  is_emp_admin : boolean = false;
  ALL_LOCATIONS = []
  ALL_GENDERS = [{name:"Male",id:1},{name:"Female",id:2},{name:"Other",id:0}]
  MARITAL_STATUS = [{name:"Married",value:true},{name:"Unmarried",value:false}]

  constructor(public dialog: MatDialog,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder,
    private datepipe: DatePipe,
    private user: UserService) { }







  addUserForm = this.fb.group({
    'firstName': ['', Validators.required],
    'lastName': ['', Validators.required],
    'staff_no': ['', Validators.required],
    'company': ['', Validators.required],
    'rep_manager': ['', [Validators.required, NotNull()]],
    'man_manager': ['', [Validators.required, NotNull()]],
    'fun_own': ['', [Validators.required, NotNull()]],
    'email': ['', [Validators.required, ValidateEmail]],
    'role': [1, Validators.required],
    'location' : ['', Validators.required],
    'category': ['',Validators.required],
    'doj': ['', [Validators.required, NoDate()]],
    'gender' : ['',Validators.required],
    // 'is_married': ['',Validators.required],
    // 'patentry_maternity_cnt': [0,Validators.required],
  })

  editManagerForm = this.fb.group({
    'emp_id': ['', Validators.required],
    'rep_manager': ['', Validators.required],
    'man_manager': ['', Validators.required],
    'fun_own': ['', Validators.required],
  })

  transferEmpForm = this.fb.group({
    'emp_id': ['', Validators.required],
    'rep_manager': ['', Validators.required],
    'man_manager': ['', Validators.required],
    'fun_own': ['', Validators.required],
  })

  changeRoleForm = this.fb.group({
    'emp_id': ['', Validators.required],
    'role_id': ['', Validators.required],

  })

  fileUpdateForm = this.fb.group({
    'file':['',Validators.required],
    'password':[]
  })


  editableItem = new FormControl("manager");




  ngOnInit(): void {
    this.user_role_id = this.user.getRoleId();
    this.is_emp_admin = this.user.getIsEmpAdmin();
    this.getCategories();
    this.getCompanies();
    this.getFunOwners();
    this.getLocations();
    this.addUserForm.reset({ 'role': 1 });
    this.newUserFirstName = '';
    this.newUserLastName = '';
    this.newUserRoleValue = 1;
    this.makeSelfRM = false;
    this.makeSelfMM = false;
    this.makeSelfFM = false;

    this.ROLES = cloneDeep(this.ATWORK_ROLES)
  }

  ngAfterViewInit(){
    
  }

  reset(){

    this.user_role_id = this.user.getRoleId();
    this.is_emp_admin = this.user.getIsEmpAdmin();
    this.getCategories();
    this.getCompanies();
    this.getFunOwners();
    this.addUserForm.reset({ 'role': 1 });
    this.newUserFirstName = '';
    this.newUserLastName = '';
    this.newUserRoleValue = 1;
    this.makeSelfRM = false;
    this.makeSelfMM = false;
    this.makeSelfFM = false;
    this.ROLES = cloneDeep(this.ATWORK_ROLES)
  }


  getAllReportes(): void {

    this.http.request("get", "emp-mgr/").subscribe(res => {

      if (res.body["success"] == true) {

        let emp_list = []
        res.body["results"].forEach(ele => {
          // console.log("---------------",ele)
          Array.prototype.push.apply(emp_list, [ele]);
        })

        this.USERS_DATA = emp_list;


      } else {
        this.ss.statusMessage.showStatusMessage(false, "error in fetching users");
      }

    });


  }
  async getFunOwners() {

    this.RM_DATA = [];
    this.MM_DATA = [];
    this.FM_DATA = [];


    let httpParams = new HttpParams();
    httpParams = httpParams.append("type", "manager");
    httpParams = httpParams.append("role", "4");
    var res = await this.http.request("get", "users/", httpParams).toPromise();

    // .subscribe(res => {

    if (res.body["success"] == true) {

      Object.keys(res.body["results"]).forEach(ele => {
        if (ele == '4') {
          Array.prototype.push.apply(this.FM_DATA, res.body["results"][ele]);
        }
      })

    } else {
      this.ss.statusMessage.showStatusMessage(false, "error in fetching users");
    }
    return res

    // });


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


  selectRole(selectedRole, is_deselected) {



    //setting role in the form
    if (is_deselected == true) {
      this.addUserForm.controls.role.setValue("1");
    } else {
      this.addUserForm.controls.role.setValue(this.ROLES[selectedRole].value);
    }

    this.addUserForm.controls.fun_own.reset();
    this.addUserForm.controls.man_manager.reset();
    this.addUserForm.controls.rep_manager.reset();
    this.MM_DATA = []
    this.RM_DATA = []



    if (this.newUserRoleValue <= this.ROLES[selectedRole].value) {
      for (let i = selectedRole - 1; i > 0; i--) {
        this.ROLES[i].selected = !this.ROLES[selectedRole].selected;

        this.ROLES[i].disabled = !this.ROLES[selectedRole].selected;
      }
      if (this.ROLES[selectedRole].selected == false) {
        this.newUserRoleValue = this.ROLES[selectedRole].value;
      } else {
        this.newUserRoleValue = 1;
      }
    }

    this.ROLES[selectedRole].selected = !this.ROLES[selectedRole].selected;




    this.makeSelfFM = this.ROLES[3].disabled;
    this.makeSelfMM = this.ROLES[2].disabled;
    this.makeSelfRM = this.ROLES[1].disabled;

    // if (this.makeSelfFM) {
    //   // this.addUserForm.controls.fun_own.setValue('Self (' + this.newUserFirstName + ' ' + this.newUserLastName + ')');
    //   this.addUserForm.controls.fun_own.setValue(0);
    // }
    // if (this.makeSelfMM) {
    //   // this.addUserForm.controls.man_manager.setValue('Self (' + this.newUserFirstName + ' ' + this.newUserLastName + ')');
    //   this.addUserForm.controls.man_manager.setValue(0);
    // }
    // if (this.makeSelfRM) {
    //   this.addUserForm.controls.rep_manager.setValue(0);
    //   // this.addUserForm.controls.rep_manager.setValue('Self (' + this.newUserFirstName + ' ' + this.newUserLastName + ')');
    // }
    console.log(this.makeSelfRM, this.makeSelfMM, this.makeSelfFM)






  }




  closeAddUserDialog(): void {
    this.addUserForm.reset({ 'role': 1 });
    this.newUserFirstName = '';
    this.newUserLastName = '';
    this.newUserRoleValue = 1;
    this.ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }];
    this.ATWORK_ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }];
  }
  addUser() {
    let error_message = '';


    let formData = new FormData();
    formData.append('firstName', this.addUserForm.controls.firstName.value);
    formData.append('lastName', this.addUserForm.controls.lastName.value);
    formData.append('staff_no', this.addUserForm.controls.staff_no.value);
    formData.append('company', this.addUserForm.controls.company.value);


    formData.append('rep_manager', this.addUserForm.controls.rep_manager.value);

    formData.append('man_manager', this.addUserForm.controls.man_manager.value);

    formData.append('fun_own', this.addUserForm.controls.fun_own.value);


    formData.append('email', this.addUserForm.controls.email.value);
    formData.append('role', this.addUserForm.controls.role.value);
    
    formData.append('category', this.addUserForm.controls.category.value);
    formData.append('location', this.addUserForm.controls.location.value);
    formData.append('gender', this.addUserForm.controls.gender.value);
    formData.append('doj', this.datepipe.transform(this.addUserForm.controls.doj.value.startDate._d, 'yyyy-MM-dd'));
    // formData.append('is_married', this.addUserForm.controls.is_married.value);
    // formData.append('patentry_maternity_cnt', this.addUserForm.controls.patentry_maternity_cnt.value);



    this.http.request('post', 'users/', '', formData).subscribe(res => {

      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "User has been created successfully");


        this.newUserFirstName = '';
        this.newUserLastName = '';
        this.newUserRoleValue = 1;

        this.getAllReportes();
        this.addUserForm.reset({ 'role': 1 });
      } else if (res.error) {

        Object.keys(res.error["results"][0]).forEach(ele => {
          error_message += " " + ele;
          this.addUserForm.controls[ele].setErrors({ 'is_duplicated': true })
        })

        this.ss.statusMessage.showStatusMessage(false, "duplicate or invalid data for " + error_message);

      }
    })


  }
  onMaritalStatusChange(){
    if(this.addUserForm.controls.is_married.value==false){
    this.addUserForm.controls.patentry_maternity_cnt.setValue(0)
    }
}

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

  getLocations() {
    let location = []
    this.http.request('get', 'location/').subscribe(res => {
      if (res.status == 200) {
        res.body["results"].forEach(ele => {
          location.push(ele);
        })
        this.ALL_LOCATIONS = location;
      }
    })
  }


  changeFM(emp, role) {

    this.MM_DATA = []
    this.editManagerForm.controls.man_manager.reset()
    this.editManagerForm.controls.rep_manager.reset()
    this.http.request('get', 'mgr-reporters/', 'emp_id=' + emp).subscribe(res => {

      if (res.status == 200) {
        let emp_list = [];
        if (res.body['results']['role']) {
          emp_list.push({
            "emp_id": res.body['results']['emp_id'],
            "email": res.body['results']['email'],
            "emp_name": res.body['results']['emp_name'],
            "staff_no": res.body['results']['staff_no'],
            "role": res.body['results']['role']
          })
        }
        res.body['results']['reporters'].forEach(ele => {

          if (res.body['results']['emp_id'] !== ele['emp_id'] && (ele['role'] > role)) {
            emp_list.push(ele)
          }
        })
        console.log("ChangeFM-------", emp_list)
        this.MM_DATA = emp_list;
      }
    })
  }


  changeMM(emp, role) {
    this.RM_DATA = []
    this.editManagerForm.controls.rep_manager.reset()
    // this.editManagerForm.controls.man_manager.value
    this.http.request('get', 'mgr-reporters/', 'emp_id=' + emp).subscribe(res => {

      if (res.status == 200) {
        let emp_list = []
        if (res.body['results']['role'] ) {
          emp_list.push({
            "emp_id": res.body['results']['emp_id'],
            "email": res.body['results']['email'],
            "emp_name": res.body['results']['emp_name'],
            "staff_no": res.body['results']['staff_no'],
            "role": res.body['results']['role']
          })
        }
        res.body['results']['reporters'].forEach(ele => {
          if (res.body['results']['emp_id'] !== ele['emp_id'] && (ele['role'] > role)) {
            emp_list.push(ele)
          }
        })
        this.RM_DATA = emp_list;
      }
    })
  }

  async getEffectedEmpList(){
    let emp = this.changeRoleForm.controls.emp_id.value;
    
    this.effected_emp_count = 0
    let res= await this.http.request('get','transfer-emp','emp_id='+emp).toPromise();
    let emp_list = []
     res.body["results"].forEach(e=>{
      emp_list.push(e["emp_name"])
     })
     this.effected_emp_count  = emp_list.length
     return emp_list
  }
  open(e){
    console.log("---------------------------------------------------[[[[[[[[[[[[[[[[[[")
    e.click()
  }


}
