import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
@Component({
  selector: 'app-emp-policy-list',
  templateUrl: './emp-policy-list.component.html',
  styleUrls: ['./emp-policy-list.component.scss']
})
export class EmpPolicyListComponent implements OnInit {
  @ViewChild('policyDetailsRef') policyDetailModal: ModalPopupComponent;
  @ViewChild('deletePolicyRef') deletePolicyModal: ModalPopupComponent;
  //Rahul change***************************
  @ViewChild("PolicyDetailsPopUp") PolicyDetailsPopUp : TemplateRef<any>;
  //************************************ 
  employeePopupColumns = ["sno", "policy_name", "updated_date", "view"]
  EMPLOYEE_FILTERED_DATA = []
  deleteId = 0;
  status:boolean=false;
  clicked_policy_name:string
  filepathUrl: any;
  isLoaderVisible:boolean = true
  constructor( private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    public dialog: MatDialog,
    private router: Router,
    private activatedRoute:ActivatedRoute,
    private user:UserService) { }

  ngOnInit(): void {

    this.getPolicies();
    console.log("=========================================",this.EMPLOYEE_FILTERED_DATA);
  }
  loader(){
    this.isLoaderVisible = false
    console.log("Pdf is after load complete")
    }
  getPolicies(){
    this.EMPLOYEE_FILTERED_DATA = []
      this.http.request("GET","policy/emp-policy/","","").subscribe(res=>{
        if(res.status = 200){
          this.status=true;
          this.EMPLOYEE_FILTERED_DATA = res.body["results"]
        }else{
          this.status=true;
          this.ss.statusMessage.showStatusMessage(false,"Error while getting policies")
        }
      })
  }

  fileResponse:any;
  bearToken:any;  
  
  openPolicyDetails(policy_name,id){
    this.clicked_policy_name = policy_name
    // this.policyDetailModal.open()
    //Rahul change(commenting previous popup open() and opening new popup for policydetailspopup)

     this.dialog.open(PopUpComponent, {
        data: {
          heading: `${this.clicked_policy_name}`,
          template:this.PolicyDetailsPopUp,
          maxWidth:'812px',
          hideFooterButtons: true,
          showCloseButton: true,
          padding_horizontal:false,
          padding_vertical:false,
          mb_30:false
        },
        autoFocus: false,
      })

    // ******************************************************************************
    // *************************************************************************
    
    this.isLoaderVisible = true
    this.bearToken = this.user.getToken();
    this.filepathUrl =this.ss.baseUrl + "policy/upload?policy_id="+id+"&btoken="+this.bearToken;
    console.log('!!!!!!!!!!!!!!!!!!!!!!##########################################',this.filepathUrl)
    this.isLoaderVisible = false

  }

}
