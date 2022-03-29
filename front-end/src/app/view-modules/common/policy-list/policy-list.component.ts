import { DatePipe } from '@angular/common';
import { Component, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
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
    //Rahul change***************************
    @ViewChild("PolicyDetailsPopUp") PolicyDetailsPopUp : TemplateRef<any>;
    //************************************ 
  employeePopupColumns = ["sno", "policy_name", "updated_date", "company", "view", "edit", "delete"]
  EMPLOYEE_FILTERED_DATA = []
  deleteId = 0
  bearToken: any;
  filepathUrl: any;
  group_emp_count:any = {}

  isLoaderVisible: boolean = true
  // for styling
  policy_style: boolean = true
  clicked_policy_name:string
  constructor( private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    private router: Router,
    private activatedRoute:ActivatedRoute,
    private renderer: Renderer2,
    public dialog:MatDialog,
    private user:UserService) { }

  ngOnInit(): void {

    this.getPolicies();
    console.log("=========================================",this.EMPLOYEE_FILTERED_DATA);
  }
  loader(){
  this.isLoaderVisible = false
  console.log("Pdf is after load complete")
  }
  pageRendered(e: CustomEvent) {
    console.log('(page-rendered)', e);
    // this.isLoaderVisible = !this.isLoaderVisible
  }
  
  getPolicies(){
    this.EMPLOYEE_FILTERED_DATA = []
      this.http.request("GET","policy/","","").subscribe(res=>{
        if(res.status = 200){
          this.EMPLOYEE_FILTERED_DATA = res.body["results"];
          this.EMPLOYEE_FILTERED_DATA.map((pol,i) =>{
            pol.company_list.map(com =>{
              this.group_emp_count[com.company_name] = 0
            })
            pol.emp_list.map(emp =>{
              Object.keys(this.group_emp_count).map(company =>{
                if(company === emp.emp_company){
                  this.group_emp_count[company] = this.group_emp_count[company] + 1
                }
              })

            })
            if(pol.enable_for === 'ALL'){
              pol.company_list.map((c_list ,j)=>{
                Object.keys(this.group_emp_count).map(c_name =>{
                    this.EMPLOYEE_FILTERED_DATA[i].company_list[j].count = 'ALL'
                })
                
              })
            }else{
              pol.company_list.map((c_list ,j)=>{
                Object.keys(this.group_emp_count).map(c_name =>{
                  if(c_list.company_name === c_name){
                    this.EMPLOYEE_FILTERED_DATA[i].company_list[j].count = this.group_emp_count[c_name]
                  }
                })
                
              })
            }
            
          })         
          console.log("After all modification :%%%%",this.EMPLOYEE_FILTERED_DATA)
        
        }else{
          this.ss.statusMessage.showStatusMessage(false,"Error while getting policies")
        }
      })
  }

  fileResponse:any;
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
        },
        autoFocus: false,
      })

    // ******************************************************************************
    // *************************************************************************
    this.isLoaderVisible = true
    this.bearToken = this.user.getToken();
    this.filepathUrl =this.ss.baseUrl+ "policy/upload?policy_id="+id+"&btoken="+this.bearToken
    this.isLoaderVisible = false
  
     

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
