import { DatePipe } from '@angular/common';
import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';

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
  deleteId = 0
  bearToken: any;
  filepathUrl: any;
  atai_employee_count :number = 0;
  soct_employee_count :number = 0;
  invecas_employee_count :number = 0;

  // for styling
  policy_style: boolean = true
  constructor( private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    private router: Router,
    private activatedRoute:ActivatedRoute,
    private renderer: Renderer2,
    private user:UserService) { }

  ngOnInit(): void {

    this.getPolicies();
    console.log("=========================================",this.EMPLOYEE_FILTERED_DATA);
  }
  
  getPolicies(){
    this.EMPLOYEE_FILTERED_DATA = []
      this.http.request("GET","policy/","","").subscribe(res=>{
        if(res.status = 200){
          this.EMPLOYEE_FILTERED_DATA = res.body["results"];
          let emp_list
          let count 
          this.EMPLOYEE_FILTERED_DATA.map((result,i) =>{
            emp_list = result.emp_list
            this.atai_employee_count  = 0;
          this.soct_employee_count  = 0;
          this.invecas_employee_count  = 0;
            emp_list.map(emp =>{
              if(emp.emp_company === 'atai'){
                this.atai_employee_count += 1 
              }
              else if(emp.emp_company === 'SoCtronics'){
                this.soct_employee_count += 1;
              }
              else if(emp.emp_company === 'INVECAS'){
                this.invecas_employee_count += 1;
              }
            })
            result.company_list.map((c_list,j) =>{
              if(c_list.company_name == 'SoCtronics'){
                this.EMPLOYEE_FILTERED_DATA[i].company_list[j].count = this.soct_employee_count
              }else if(c_list.company_name == 'atai'){
                this.EMPLOYEE_FILTERED_DATA[i].company_list[j].count = this.atai_employee_count
              }
              else if(c_list.company_name == 'INVECAS'){
                this.EMPLOYEE_FILTERED_DATA[i].company_list[j].count = this.invecas_employee_count
              }
            })
            
          })
        
        }else{
          this.ss.statusMessage.showStatusMessage(false,"Error while getting policies")
        }
      })
  }

  fileResponse:any;
  openPolicyDetails(id){
    this.policyDetailModal.open()

    this.bearToken = this.user.getToken();
    this.filepathUrl =this.ss.baseUrl+ "policy/upload?policy_id="+id+"&btoken="+this.bearToken
   
  
     

  }
  openDeletePolicy(id){
    this.deleteId = id
    this.deletePolicyModal.open();
  }
  closeDeletePolicy(){
    this.deleteId = 0;
    this.deletePolicyModal.close();
  }

  deletePolicy(id){
    this.http.request("DELETE","policy/"+id+"/","","").subscribe(res=>{
      if(res.status==200){
        this.ss.statusMessage.showStatusMessage(true,"Policy deleted successfully")
        this.deleteId = 0;
        this.getPolicies()
        this.deletePolicyModal.close();
      }else{
        this.ss.statusMessage.showStatusMessage(false,"Error while deleting policy")
      }
    })
    
    console.log();
    
  }
  navigateToEdit(pol_id,type_id){
    var parentUrl=this.router.url.split('/')
    parentUrl.splice(-1,1);

    this.router.navigate([parentUrl.join("/")+'/document-config'], { state :{policy_id:pol_id,type:type_id}  });
  }
}
