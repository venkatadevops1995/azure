import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { slideAnimationTrigger } from 'src/app/animations/slide.animation';
import { ThemePalette } from '@angular/material/core';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabGroup } from '@angular/material/tabs';

export interface Task {
  id?:Number,
  name: string;
  completed: boolean;
  subtasks?: Task[];
}

@Component({
  selector: 'app-policy-config',
  templateUrl: './policy-config.component.html',
  styleUrls: ['./policy-config.component.scss'],
  animations: [slideAnimationTrigger]
})
export class PolicyConfigComponent implements OnInit {

  @ViewChild('selectEmployeePopup') selectEmpModal: ModalPopupComponent;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  tabList = []
  // tabList = ["View Only", "Digitally Acknowledged", "Download and Upload"]

  employeePopupColumns = ["select", "staff_no", "emp_name", "company"]
  selectedTab = "View Only"
  selectedTabIndex = 1
  EMPLOYEE_DATA: any = []
  EMPLOYEE_FILTERED_DATA: any = []

  policyForm = this.fb.group({
    "policy_type":['', Validators.required],
    "policy_name": ['', Validators.required],
    "file_name": ['', Validators.required],
    "display_name": ['', Validators.required],
    "enable_for": ['ALL'],
    "company_list":[],
    // "emp_list":[],
    "enable_on":[''],
    "expire_on":['']
  })
  employeeSearchControl = this.fb.control('')
  policyUploadControl = this.fb.control('')
  edit_policy = false
  policy_id = ''
  emp_count = 0;
  allSelected: boolean = false;
  enable_for_options = [{ option: 'ALL', value: 'All employees' },
  { option: 'FEW', value: 'Selected employees' }]
  constructor(private fb: FormBuilder,
    private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    private router:Router,
    private activatedRoute:ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef) {
      const state =router.getCurrentNavigation().extras.state;
      if(state != undefined){
        this.policy_id = state['policy_id']
        this.edit_policy = true
      }
     }
  subs: any;
  ngOnInit(): void {

    console.log("-------------------",this.edit_policy);
    this.selectedTabIndex = 2;
    // this.changeDetectorRef.detectChanges()
    
    this.getPolicyType();
    this.companyList.completed = true
    this.companyList.subtasks.forEach(t => t.completed = true);
  }
  setTab(v) {
    console.log("--------------SET TAB----",v,this.selectedTabIndex);
    
    this.policyForm.controls.policy_type.setValue(this.tabList[v]["id"])

  }

  companyList: Task = {
    name: 'All',
    completed: false,
    subtasks: [
      { id:1,name: 'Atai', completed: false },
      { id:2,name: 'SoCtronics', completed: false },
      { id:3,name: 'Veda', completed: false }
    ]
  };
  searchKey: any = '';
  updateFilterData() {
    var selectdCompList = []
    var selectdComp = this.companyList.subtasks.filter(c => { return c.completed == true })
    selectdCompList = selectdComp.map(e => e.name)
    this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_DATA.filter((e) => {
      return e.emp_name.toLowerCase().includes(this.searchKey) && (selectdCompList.indexOf(e.company) != -1)

    })
    this.updateEmpSelection()
  }

  updateAllComplete(): void {

    const allComplete = this.companyList.subtasks != null && this.companyList.subtasks.every(t => t.completed);
    this.companyList.completed = allComplete
    this.updateFilterData()

  }


  setAll(e) {
    var completed = e.target.checked
    this.companyList.completed = completed
    if (this.companyList.subtasks == null) {
      return;
    }
    this.companyList.subtasks.forEach(t => t.completed = completed);
    this.updateFilterData()

  }

  async openSelectEmp(val,fetch=true) {
    if (val == "FEW") {
      
      if(fetch){
        this.emp_count = 0
        await this.getAllUser()
      }
      console.log("====================",this.EMPLOYEE_DATA);
      
      this.policyForm.addControl('emp_list', this.fb.control('', [Validators.required])); 
      this.updateFilterData()
      this.selectEmpModal.open();

      this.subs = this.employeeSearchControl.valueChanges.subscribe(val => {
        this.searchKey = val.trim().toLowerCase()
        if (val.trim() == '') {
          this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_DATA;
        } else {
          this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_DATA.filter(emp => { return emp.emp_name.toLowerCase().includes(val) })
        }
        this.updateEmpSelection()
        console.log(this.EMPLOYEE_FILTERED_DATA)
      })
    }
    if (val == "ALL"){
      // this.policyForm.controls.emp_list.reset()
      this.policyForm.removeControl('emp_list'); 
    } 
  }
  closeSelectEmp() {
    const selectedEmps=this.EMPLOYEE_FILTERED_DATA.filter(e => { return e.selected == true }).map(m=>m.emp_id)
    this.emp_count =selectedEmps.length
    this.policyForm.controls.emp_list.setValue(selectedEmps);
    this.subs.unsubscribe()
  }
  selectAllEmp(e) {
    this.allSelected = e.target.checked
    this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_FILTERED_DATA.map(e => { e.selected = this.allSelected; return e })
  }

  updateEmpSelection() {
    this.allSelected = this.EMPLOYEE_FILTERED_DATA.every(e => e.selected)
  }
  selectEmployeeList() {
    this.closeSelectEmp();
    this.selectEmpModal.close();
  }

  uploadFile() {
  
    if (this.policyUploadControl.value instanceof File) {
      console.log("file upload", this.policyUploadControl.value);
      const formData = new FormData();
      formData.append('file',this.policyUploadControl.value)
      this.http.request('POST', 'policy/upload/', '', formData).subscribe(res => {
        if (res.status == 200) {
          this.ss.statusMessage.showStatusMessage(true, "File has been uploaded successfully");
          this.policyForm.controls.file_name.setValue(res.body['results']['filename'])
          this.policyForm.controls.display_name.setValue(res.body['results']['displayname'])
          

        } else {
          this.ss.statusMessage.showStatusMessage(false, "Issue while uploading file");
          this.policyForm.controls.file_name.reset()
          this.policyForm.controls.display_name.reset()
          this.policyUploadControl.reset()
        }
      })
    }

  }
  publishPolicy() {

    const dataFormat = "yyyy-MM-dd"
    var enable_date = this.datepipe.transform(new Date(), dataFormat)
    var expire_date = this.datepipe.transform(new Date((new Date().getFullYear() + 1),11,31), dataFormat)
    this.policyForm.controls.enable_on.setValue(enable_date);
    this.policyForm.controls.expire_on.setValue(expire_date);
    var companies = this.companyList.subtasks.filter(e=>e.completed).map(m=>m.id)
    this.policyForm.controls.company_list.setValue(companies);
    console.log(this.policyForm.value);

    this.http.request('POST', 'policy/', '', this.policyForm.value).subscribe(res => {
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Policy has been created successfully");
        var policy_type = this.policyForm.controls.policy_type.value
        this.policyForm.reset({policy_type,'enable_for':'ALL'})
        this.policyUploadControl.reset()
      } else {
        this.ss.statusMessage.showStatusMessage(false, "Issue while creating policy");
        
      }
    })
  }

  async getAllUser(){

    // this.EMPLOYEE_DATA = [{ "emp_id": 1,"staff_no": 1, "emp_name": "a", "company": "Atai", "selected": false },
    // { "emp_id": 2,"staff_no": 2, "emp_name": "b", "company": "Soctronics", "selected": false },
    // { "emp_id": 3,"staff_no": 3, "emp_name": "c", "company": "Atai", "selected": false },
    // { "emp_id": 4,"staff_no": 4, "emp_name": "d", "company": "Soctronics", "selected": false },
    // { "emp_id": 5,"staff_no": 4, "emp_name": "d", "company": "Veda", "selected": false },
    // { "emp_id": 6,"staff_no": 4, "emp_name": "d", "company": "Soctronics", "selected": false },
    // { "emp_id": 7,"staff_no": 4, "emp_name": "d", "company": "Atai", "selected": false },
    // { "emp_id": 8,"staff_no": 4, "emp_name": "d", "company": "Soctronics", "selected": false },
    // { "emp_id": 9,"staff_no": 4, "emp_name": "d", "company": "Veda", "selected": false },
    // { "emp_id": 10,"staff_no": 4, "emp_name": "d", "company": "Soctronics", "selected": false },
    // { "emp_id": 11,"staff_no": 4, "emp_name": "d", "company": "Veda", "selected": false },
    // { "emp_id": 12,"staff_no": 4, "emp_name": "d", "company": "Soctronics", "selected": false },
    // { "emp_id": 13,"staff_no": 4, "emp_name": "d", "company": "Atai", "selected": false },
    // { "emp_id": 14,"staff_no": 4, "emp_name": "d", "company": "Veda", "selected": false },
    // { "emp_id": 15,"staff_no": 4, "emp_name": "d", "company": "Soctronics", "selected": false },
    // { "emp_id": 16,"staff_no": 4, "emp_name": "d", "company": "Atai", "selected": false },
    // { "emp_id": 17,"staff_no": 4, "emp_name": "d", "company": "Soctronics", "selected": false },
    // { "emp_id": 18,"staff_no": 4, "emp_name": "d", "company": "Veda", "selected": false },
    // ]
    this.EMPLOYEE_DATA= []
    var res = await this.http.request('GET', 'users/', 'type=hr&search=ALL', this.policyForm.value).toPromise()
      if (res.status == 200) {
          res.body['results'].forEach(e=>{
            var emp = e;
            emp["selected"] = false;
            this.EMPLOYEE_DATA.push(emp)
          })
      } else {
        this.ss.statusMessage.showStatusMessage(false, "Issue while getting users");
        
      }
  }
  async getPolicyType(){
    this.tabList = []

    var res = await this.http.request('GET', 'policy/type/', '', this.policyForm.value).toPromise()
    if (res.status == 200) {
        res.body['results'].forEach(e=>{

          this.tabList.push(e)
        })
    } else {
      this.ss.statusMessage.showStatusMessage(false, "Issue while getting policy type");
      
    }
    this.policyForm.controls.policy_type.setValue(this.tabList[0]["id"])
  }

}
