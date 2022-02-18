import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-emp-policy-list',
  templateUrl: './emp-policy-list.component.html',
  styleUrls: ['./emp-policy-list.component.scss']
})
export class EmpPolicyListComponent implements OnInit {
  @ViewChild('policyDetailsRef') policyDetailModal: ModalPopupComponent;
  @ViewChild('deletePolicyRef') deletePolicyModal: ModalPopupComponent;
  
  employeePopupColumns = ["sno", "policy_name", "updated_date", "view"]
  EMPLOYEE_FILTERED_DATA = []
  deleteId = 0;
  clicked_policy_name:string
  filepathUrl: any;
  isLoaderVisible:boolean = true
  constructor( private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    private router: Router,
    private activatedRoute:ActivatedRoute,
    private user:UserService) { }

  ngOnInit(): void {

    this.getPolicies();
    console.log("=========================================",this.EMPLOYEE_FILTERED_DATA);
  }
  loader(){
    this.isLoaderVisible = true;
  }
  pageRendered(e: CustomEvent) {
    this.isLoaderVisible = false;
  }
  pageInitialized(e: CustomEvent) {
    this.isLoaderVisible = false;
  }
  getPolicies(){
    this.EMPLOYEE_FILTERED_DATA = []
      this.http.request("GET","policy/emp-policy/","","").subscribe(res=>{
        if(res.status = 200){
          this.EMPLOYEE_FILTERED_DATA = res.body["results"]
        }else{
          this.ss.statusMessage.showStatusMessage(false,"Error while getting policies")
        }
      })
  }

  fileResponse:any;
  bearToken:any;  

  openPolicyDetails(policy_name,id){
    this.clicked_policy_name = policy_name
    this.policyDetailModal.open()
    this.bearToken = this.user.getToken();
    this.filepathUrl = this.ss.baseUrl + "policy/upload?policy_id="+id+"&btoken="+this.bearToken   
     

  }

}
