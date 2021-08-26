import { HttpParams } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { HttpClientService } from 'src/app/services/http-client.service';

@Component({
  selector: 'app-employee-profile-details',
  templateUrl: './employee-profile-details.component.html',
  styleUrls: ['./employee-profile-details.component.scss']
})
export class EmployeeProfileDetailsComponent implements OnInit {

  @Input() data: any = {}
  employeeDetails: any;
  showToolTip:boolean = false;
  constructor(private http:HttpClientService) {
    
   }
   
  onCopy(){
    this.showToolTip= true;
    console.log(this.showToolTip)
      setTimeout(()=>{
        this.showToolTip = false;
      },1000)
  }

  ngOnInit(): void {
  }
  ngOnChanges(){
    if(this.data.emp_name!=undefined){
      this.employeeDetails = this.data.emp_details;
    }
  }

}
