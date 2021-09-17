import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-list.component.html',
  styleUrls: ['./policy-list.component.scss']
})
export class PolicyListComponent implements OnInit {
  @ViewChild('policyDetailsRef') policyDetailModal: ModalPopupComponent;
  @ViewChild('deletePolicyRef') deletePolicyModal: ModalPopupComponent;
  
  employeePopupColumns = ["sno", "policy_name", "updated_date", "company", "view", "edit", "delete"]
  EMPLOYEE_FILTERED_DATA = []
  constructor( private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    private router: Router,
    private activatedRoute:ActivatedRoute) { }

  ngOnInit(): void {

  // this.EMPLOYEE_FILTERED_DATA = [{ "emp_id": 1,"staff_no": 1, "emp_name": "a", "company": ["Atai"], "selected": false },
  //   { "emp_id": 2,"staff_no": 2, "emp_name": "b", "company_list": ["Soctronics","Atai"], "selected": false },
  //   { "emp_id": 3,"staff_no": 3, "emp_name": "c", "company_list": ["Atai"], "selected": false },
  //   { "emp_id": 4,"staff_no": 4, "emp_name": "d", "company_list": ["Soctronics"], "selected": false },
  //   { "emp_id": 5,"staff_no": 4, "emp_name": "d", "company_list": ["Veda"], "selected": false },
  //   { "emp_id": 6,"staff_no": 4, "emp_name": "d", "company_list": ["Soctronics"], "selected": false },
  //   { "emp_id": 7,"staff_no": 4, "emp_name": "d", "company_list": ["Atai"], "selected": false },
  //   { "emp_id": 8,"staff_no": 4, "emp_name": "d", "company_list": ["Soctronics"], "selected": false },
  //   { "emp_id": 9,"staff_no": 4, "emp_name": "d", "company_list": ["Veda"], "selected": false },
  //   { "emp_id": 10,"staff_no": 4, "emp_name": "d", "company_list": ["Soctronics"], "selected": false },
  //   { "emp_id": 11,"staff_no": 4, "emp_name": "d", "company_list": ["Veda"], "selected": false },
  //   { "emp_id": 12,"staff_no": 4, "emp_name": "d", "company_list": ["Soctronics"], "selected": false },
  //   { "emp_id": 13,"staff_no": 4, "emp_name": "d", "company_list": ["Atai"], "selected": false },
  //   { "emp_id": 14,"staff_no": 4, "emp_name": "d", "company_list": ["Veda"], "selected": false },
  //   { "emp_id": 15,"staff_no": 4, "emp_name": "d", "company_list": ["Soctronics"], "selected": false },
  //   ]
    this.getPolicies();
    console.log("=========================================",this.EMPLOYEE_FILTERED_DATA);
  }
  
  getPolicies(){
    this.EMPLOYEE_FILTERED_DATA = []
      this.http.request("GET","policy/","","").subscribe(res=>{
        if(res.status = 200){
          this.EMPLOYEE_FILTERED_DATA = res.body["results"]
        }else{
          this.ss.statusMessage.showStatusMessage(false,"Error while getting policies")
        }
      })
  }

  fileResponse:any;
  openPolicyDetails(){
    this.policyDetailModal.open()

    // http://10.60.62.114:8000/api/policy/upload/?filename=id_card.pdf file-sample_100kB.docx
    // vnd.openxmlformats-officedocument.wordprocessingml.document
    // {responseType: 'arraybuffer'}
    this.http.request("GET","policy/upload/","filename=file-sample_100kB.docx","",{ responseType: 'blob' }).subscribe(res=>{
      if(res.status = 200){
        console.log("-----------------------",res.body)
        var file = new Blob([res["error"]["text"]], { type: 'application/pdf' });
        this.fileResponse = URL.createObjectURL(file);
        // window.open(this.fileResponse);
        console.log(res)
      }})
     

  }
  openDeletePolicy(){
    this.deletePolicyModal.open();
  }
  closeDeletePolicy(){
    this.deletePolicyModal.close();
  }

  deletePolicy(){
    this.deletePolicyModal.close();
    console.log();
    
  }
  navigateToEdit(){
    var parentUrl=this.router.url.split('/')
    parentUrl.splice(-1,1);

    this.router.navigate([parentUrl.join("/")+'/document-config'], { state :{policy_id:1}  });
  }
}
