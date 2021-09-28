import { DatePipe } from '@angular/common';
import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
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
  deleteId = 0
  constructor( private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    private router: Router,
    private activatedRoute:ActivatedRoute,
    private renderer: Renderer2) { }

  ngOnInit(): void {

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
  openPolicyDetails(id){
    this.policyDetailModal.open()


    this.http.request("GET","policy/upload/","policy_id="+id,"").subscribe(res=>{
      if(res.status = 200){
        console.log("-----------------------",res.body)
        var file = new Blob([res["error"]["text"]], { type: 'application/pdf' });

        this.fileResponse = URL.createObjectURL(file);

        document.querySelector("iframe").src = this.fileResponse+"#toolbar=0";

        console.log("--------------------------------",document.getElementsByClassName("toolbar")[0]);

        console.log(res)
      }})
     

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
