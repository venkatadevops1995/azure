import { UserService } from 'src/app/services/user.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SingletonService } from 'src/app/services/singleton.service';
import { Router } from '@angular/router';
import { dashboardRoutes } from 'src/app/constants/dashboard-routes';

@Component({
  selector: 'app-pre-sign-in',
  templateUrl: './pre-sign-in.component.html',
  styleUrls: ['./pre-sign-in.component.scss']
})
export class PreSignInComponent implements OnInit { 
  
 
  constructor(
    private ss: SingletonService,
    private user:UserService,
    private router:Router
  ) { }

  ngOnInit() {
    if(this.user.validateSession()){
      this.router.navigate([dashboardRoutes.get(this.user.getRoleId())]);
    }else{
      this.ss.isPreSignIn$.next(true);
    }
  }

  ngOnDestroy(){
    this.ss.isPreSignIn$.next(false); 
  }

  ngAfterViewInit() {
     
  }
}
