import { UserService } from 'src/app/services/user.service';
import { SvgComponent } from './layout/svg/svg.component';
import { StatusMessageComponent } from './components/status-message/status-message.component';
import { LoaderComponent } from './components/loader/loader.component';
import { Component, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { SingletonService } from './services/singleton.service';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { takeUntil, debounce, debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // ref to the global loader compoonent
  @ViewChild(LoaderComponent, /* TODO: add static flag */   { static: false }) loader;

  // ref to the global progress compoonent
  @ViewChild(ProgressBarComponent, /* TODO: add static flag */   { static: false }) progressBar;

  // ref to the global status compoonent
  @ViewChild(StatusMessageComponent, /* TODO: add static flag */   { static: false }) statusMessage;

  // ref to the global svg compoonent
  @ViewChild(SvgComponent) svg;

  // boolean to know whether it is pre sign in area
  isPreSignIn: boolean = true;

  // subject to unsubscibe subscriptions
  private destroy$ = new Subject();

  constructor(
    private ss: SingletonService,
    private cdRef: ChangeDetectorRef,
    private user: UserService,
    private router: Router,
  ) {

  }

  ngAfterViewInit() {
    // pass the ref to the components to the singleton service properties
    this.ss.loader = this.loader;
    this.ss.progressBar = this.progressBar;
    this.ss.statusMessage = this.statusMessage;
    this.ss.svgComponent = this.svg;
    this.ss.isPreSignIn$.pipe(takeUntil(this.destroy$),debounceTime(500)).subscribe(val => {
      this.isPreSignIn = val;
      this.cdRef.detectChanges();
      console.log(this.ss.isPreSignIn)
      // setTimeout()
      this.redirectBasedOnSession();
    })
    // this.redirectBasedOnSession();
  }

  // 
  ngOnDestroy() {
    // emit using destroy subject to unsubscribe all subscriptions
    this.destroy$.next();
    // emit using  destroy subject to unsubscribe all subscriptions
    this.ss.destroy$.next();
  }


  // on window resize emit the event to subscribers through out
  @HostListener("window:resize", ['$event'])
  onResizeWindow(e: Event) {
    this.ss.windowResize$.next(e);
  }

  @HostListener('click',['$event'])
  onClickHost(e:Event){
    this.redirectBasedOnSession();
  }

  redirectBasedOnSession() {
    if (!this.ss.isPreSignIn) {
      if (!this.user.validateSession()) {
        this.user.logout();
        this.router.navigate(['login']);
      }
    } else { 
      if (this.user.validateSession()) {
        this.router.navigate([this.user.getDashboardRoute()]);
      }
    }
    // this.router.navigate(['login']); 
  }
}