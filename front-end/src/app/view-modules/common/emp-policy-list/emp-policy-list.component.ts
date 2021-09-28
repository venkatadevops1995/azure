import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';

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
  deleteId = 0
  constructor( private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    private router: Router,
    private activatedRoute:ActivatedRoute) { }

  ngOnInit(): void {

    this.getPolicies();
    console.log("=========================================",this.EMPLOYEE_FILTERED_DATA);
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
  openPolicyDetails(id){
    this.policyDetailModal.open()


    this.http.request("GET","policy/upload/","policy_id="+id,"").subscribe(res=>{
      if(res.status = 200){

        var file = new Blob([res["error"]["text"]], { type: 'application/pdf' });
        this.fileResponse = URL.createObjectURL(file);
        document.querySelector("iframe").src = this.fileResponse+"#toolbar=0";
        // window.open(this.fileResponse);
        console.log(res)
      }})
     

  }

}
