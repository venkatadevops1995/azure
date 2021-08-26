import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Observable, Subscription } from 'rxjs';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';

export function YearVd(year:String): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    var res = false;
    if((control.value['startDate'] != null) && (control.value['startDate'] != undefined)){
    var start_yr = control.value['startDate'].format('YYYY');
    var end_yr = control.value['endDate'].format('YYYY');
    console.log("validation inside",control.value['startDate'].format('YYYY'),year)
     res = ((start_yr == year) && end_yr == year)
    }
    return res ? null : { invalidYear: true } 
  }
}
export function notWeekend(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    

  var error = null;
  var all_dates = []
  console.log("-------notWeekend-------")
  if(control.value['startDate']!=null){
    console.log("-------------day------ ",control.value['startDate'].format("EEEE"))
    if(control.value['startDate'].day()==6 || control.value['startDate'].day()== 0){
      
      error = true
    }
  }

  return error ? { 'notWeekend': true } : null;
}}

export function UniqueText(fa:FormArray,selected_index:number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    var res = false;
    for(let i=0;i<fa['controls'].length;i++){
      if(i!=selected_index){
        console.log("-------------showOptionIndex ",selected_index)
        console.log("--------",i,selected_index,fa['controls'][i]['controls'].des.value)
      }
    };
    return res ? null : { uniqueTextError: true } 
  }
}

@Component({
  selector: 'app-holiday',
  templateUrl: './holiday.component.html',
  styleUrls: ['./holiday.component.scss']
})
export class HolidayComponent implements OnInit {
  selected: {start: Moment, end: Moment};
  headerItems = ["Date","No of Days", "Day", "Occasion"]
  headerLocation=[]
  showLocation=[];
  displayLocation = []
  showLocationCount=0;
  HOLIDAYLIST_TESTDATA = [
  {date:'2021-01-01',day:'Friday',des:"New Year",hyd:true, blr:true,delhi:true},
  {date:'2021-01-14',day:'Thursday',des:"Sankranti",hyd:true, blr:true,delhi:false},
  {date:'2021-04-13',day:'Tuesday',des:"Ugadi",hyd:true, blr:false,delhi:false},
  {date:'2021-05-01',day:'Saturday',des:"May day",hyd:true, blr:true,delhi:true},
  {date:'2021-12-25',day:'Saturday',des:"Christmas",hyd:true, blr:true,delhi:true}
]
HOLIDAYCONFIG_TESTDATA = [
  {date:'2021-01-01',day:'Friday',des:"New Year",locations:"Hyderabad,Bangalore,Delhi"},
  {date:'2021-01-14',day:'Thursday',des:"Sankranti",locations:"Hyderabad,Bangalore,Delhi"},
  {date:'2021-04-13',day:'Tuesday',des:"Ugadi",locations:"Hyderabad"},
  {date:'2021-05-01',day:'Saturday',des:"May day",locations:"Hyderabad,Bangalore,Delhi"},
  {date:'2021-12-25',day:'Saturday',des:"Christmas",locations:"Hyderabad,Bangalore,Delhi"}
]
  DISPLAYED_YEAR_TESTDATA = [2020,2021,2022]
  displayedYear: string[];
  selectedYear;
  editMode :boolean = false;
  is_emp_admin :boolean = false;
  defaultHoliday;
  minSelectDate : Moment;
  maxSelectDate : Moment;
  holidayArrayData = []
  currentDate;
  yearEditable = false;
  IsNextYearVisible = false
  isConfirmed = false
  @ViewChild("addHolidayDialog") addHolidayPopup:ModalPopupComponent;

  constructor(	
    private cd: ChangeDetectorRef,
    private el: ElementRef,
    private fb:FormBuilder,
    private datePipe:DatePipe,
    private http:HttpClientService,
    private user: UserService,
    private ss: SingletonService) { }
    

    ngOnInit(): void {
      // this.getFromTemplate();
      this.getCurrentDate();
      this.getHolidayList();
      this.yearEditable = true;
      // this.selectedYear = (new Date()).getFullYear()
      this.is_emp_admin = this.user.getIsEmpAdmin();
    }

    uniqueBy = (field: string, caseSensitive = true): ValidatorFn => {
      return (formArray: FormArray): { [key: string]: boolean } => {
        const controls = formArray.controls.filter(formGroup => {
          
          return (formGroup.get(field).value!=null)||(formGroup.get(field).value!='');
        });
        const uniqueObj = { uniqueBy: true };
        let found = false;
    
        // if (controls.length > 1) {
        //   for (let i = 0; i < controls.length; i++) {
        //     const formGroup = controls[i];
        //     const mainControl = formGroup.get(field);
        //     const val = mainControl.value;    
        //     const mainValue = caseSensitive ? val.toLowerCase() :  val;
        //   };
        // }
        
        controls.map(formGroup => formGroup.get(field)).forEach(x => x.errors && delete x.errors['uniqueBy']);

        for (let i: number = 0; i < controls.length; i++) {
            const formGroup: FormGroup = controls[i] as FormGroup;
            const mainControl: AbstractControl = formGroup.get(field);
            const val: string = mainControl.value;
            console.log("=====================uniqueby iter=======================",val)
            const mainValue: string = caseSensitive ? val.toLowerCase() :  val;
            controls.forEach((group: FormGroup, index: number) => {
                if (i === index) {
                    return;
                }
    
            const currControl: any = group.get(field);
            const tempValue: string = currControl.value;
            const currValue: string = caseSensitive ? tempValue.toLowerCase() : tempValue;
            let newErrors: any;
    
            if ( mainValue === currValue) {
                if (currControl.errors==null) {
                    newErrors = uniqueObj;
                } else {
                    newErrors = Object.assign(currControl.errors, uniqueObj);
                }
                currControl.setErrors(newErrors);
                found = true;
            }
        });
        }
        if (found) {
          // Set errors to whole formArray
          console.log("-------uniqueObj--------",uniqueObj)
          return uniqueObj;
        }
    
      // Clean errors
      return null;
    
      }
    }

    uniqueDates = (field: string, caseSensitive = false): ValidatorFn => {
      return (formArray: FormArray): { [key: string]: boolean } => {
        const controls = formArray.controls.filter(formGroup => {
          
          return (formGroup.get(field).value==""||formGroup.get(field).value['startDate']!=null)||(formGroup.get(field).value['startDate']!=''||(formGroup.get(field).value['startDate']!=undefined));
        });
        console.log("-----------uniqueDates validator----",controls)
        const uniqueObj = { notUniqueDates: true };
        let found = false;
    
        // if (controls.length > 1) {
        //   for (let i = 0; i < controls.length; i++) {
        //     const formGroup = controls[i];
        //     const mainControl = formGroup.get(field);
        //     const val = mainControl.value;    
        //     const mainValue = caseSensitive ? val.toLowerCase() :  val;
        //   };
        // }
        
        controls.map(formGroup => formGroup.get(field)).forEach(x => x.errors && delete x.errors['notUniqueDates']);

        for (let i: number = 0; i < controls.length; i++) {
            const formGroup: FormGroup = controls[i] as FormGroup;
            const mainControl: AbstractControl = formGroup.get(field);
            const mainControlCount: AbstractControl = formGroup.get('count')
            if(mainControl.value['startDate']==null){
              continue
            }
            const val: string = mainControl.value['startDate'].format("YYYY-MM-DD");
            var main_list = []
            // var new_date = moment(val, "YYYY-MM-DD").add(1, 'days');

            var main_dt = new Date(val) 
            main_list.push(this.datePipe.transform(main_dt,'yyyy-MM-dd'))

              for(let cnt=1;cnt<mainControlCount.value;cnt++){
                main_dt.setDate( main_dt.getDate() + 1 )
                        if(main_dt.getDay()==6){
                          main_dt.setDate( main_dt.getDate() + 2 );
                        }
                        if(main_dt.getDay()==0){
                          main_dt.setDate( main_dt.getDate() + 1 );
                        }
                        main_list.push(this.datePipe.transform(main_dt,'yyyy-MM-dd'))
                }

                console.log("=================current list=======================",main_list)

            console.log("=====================notUniqueDates iter=======================",val)
            const mainValue: string =  val;
            controls.forEach((group: FormGroup, index: number) => {
                if (i === index) {
                    return;
                }
    
            const currControl: any = group.get(field);

            const currentControlCount: AbstractControl = group.get('count')
           
            if(currControl.value['startDate']==null){
              return
            }

            var crnt_dt = new Date(currControl.value['startDate'].format("YYYY-MM-DD")) 

            for(let cnt=1;cnt<currentControlCount.value;cnt++){
              crnt_dt.setDate( crnt_dt.getDate() + 1 )
                      if(crnt_dt.getDay()==6){
                        crnt_dt.setDate( crnt_dt.getDate() + 2 );
                      }
                      if(crnt_dt.getDay()==0){
                        crnt_dt.setDate( crnt_dt.getDate() + 1 );
                      }
                      

            let newErrors: any;



            console.log("===========list compare=============",main_list,crnt_dt)
            if ( main_list.indexOf( this.datePipe.transform(crnt_dt,'yyyy-MM-dd'))!=-1) {
                if (currControl.errors==null) {
                    newErrors = uniqueObj;
                } else {
                    newErrors = Object.assign(currControl.errors, uniqueObj);
                }
                currControl.setErrors(newErrors);
                found = true;
            }

          }

        });
        }
        if (found) {
          // Set errors to whole formArray
          console.log("-------uniqueObj--------",uniqueObj)
          return uniqueObj;
        }
    
      // Clean errors

      console.log("-------returning null --------")
      return null;
    
      }
    }


  
  holidayForm = this.fb.group({
    holidays: this.fb.array([])//,[this.uniqueBy('des')])//,this.uniqueDates('date')
  });

  addHolidayForm = this.fb.group({
    year:['',Validators.required],
    option : ['Import from template',Validators.required]
  })

  get aliases() {
    // console.log("----------------000",this.holidayForm.get('holidays'))
    return this.holidayForm.get('holidays') as FormArray ;
    // return this.holidayForm.get('aliases') as FormArray;
  }
  addAlias() {
    const grp = this.fb.group({
      date: ['', [Validators.required,YearVd(this.selectedYear),notWeekend()]], //,this.uniqueDate.bind(this)
      count:[1],
      day: ['',Validators.required],
      des: ['',[Validators.required]], //this.uniqueText.bind(this)
      locations : [[]],
      editable : [true]
      });

    this.aliases.push(grp);

  }

  deleteHoliday(index: number) {
    if (this.aliases.length >0) {
      this.aliases.removeAt(index);
    }
    console.log(this.aliases.length);
  }




 
@ViewChild('selProject') elSelProject: ElementRef;
  holidayList :any[]= this.HOLIDAYLIST_TESTDATA;
  holidayIndexToRemove = 0



  @HostListener("document:click", ['$event'])
	onClickDocument(e) {
		let target: any = e.target;
		if (this.elSelProject && target == this.elSelProject.nativeElement) {
      
      let index = Number(target.getAttribute("index"));
			let projectToBeAdded = {};
      this.holidayList.push(projectToBeAdded);
      this.addAlias();
		} else if (this.elSelProject && isDescendant(this.elSelProject.nativeElement, target) ) {
			let index = Number(target.getAttribute("index"));
			let projectToBeAdded = {};
      this.holidayList.push(projectToBeAdded);
      
      
	
			// let fa = this.ss.fb.array([]);
		// 	for (let i = 0; i < 7; i++) {
		// 		fa.push(new FormControl({ h: 0, m: 0 }, []))
		// 	}
		// 	(<FormArray>this.fgTimeFields.get('active_projects')).push(fa);
		// 	projectToBeAdded.work_hours.push({date:'Total',enable: true,h:0,m:0})
		// 	this.showProjectList = false;
		// } else {
		// 	this.showProjectList = false;
		// }
  }
}
  
  // event listener on document to check if remove a project button is clicked
	@HostListener("click", ['$event'])
	onClickHost(e) {
		let target: any = e.target;
    let tempTarget = target;
    console.log("============================================",tempTarget.classList)
    if(tempTarget.classList.contains('holiday_option')){
      console.log("-------------tempTarget---------------",tempTarget,tempTarget.getAttribute('value'));
      // let cl=tempTarget.classList.toString();
      // console.log("matched item",cl.match(/holiday_option-\d*/g) )
      console.log("parent data index",parseInt(tempTarget.parentNode .getAttribute('data-index'), 10))
      this.aliases['controls'][parseInt(tempTarget.parentNode.getAttribute('data-index'), 10)]['controls'].des.setValue(tempTarget.getAttribute('value'))
      console.log("parent data value ",this.aliases['controls'][parseInt(tempTarget.parentNode.getAttribute('data-index'), 10)]['controls'].des.value);
      this.options = []
      this.showOptionIndex = -1
      // cl.forEach(eachcl=>{
      //   if
      // })
      
    }
    // if(tempTarget.classList.contains('location')){
    //   console.log("-------------location value---------------",tempTarget,tempTarget.getAttribute('value'));
    //   var existingLoc = []
    //   var notExistingLoc = []
    //   this.aliases['controls'].forEach(e=>{
      
    //     if(e['controls'].locations.value.indexOf(tempTarget.getAttribute('value'))==-1){
    //       notExistingLoc.push(e)
    //       console.log("=======notExistingLoc=======",notExistingLoc)
    //     }
    //   })
    //   if(notExistingLoc.length!=0){
    //     notExistingLoc.forEach(e=>{
    //       // if(e['controls'].editable.value==true){}
    //       var loc = e['controls'].locations.value
    //       loc.push(tempTarget.getAttribute('value'))
    //       e['controls'].locations.setValue(loc)
    //     })
    //   }else{
    //     this.aliases['controls'].forEach(e=>{
    //     var loc = e['controls'].locations.value
    //     loc.splice(loc.indexOf(tempTarget.getAttribute('value')),1)
    //     e['controls'].locations.setValue(loc)
    //     })
    //   }
    // }
    
		while (tempTarget != this.el.nativeElement) {
      if(tempTarget == null){
        
        break
      }
			// found remove row 
			if (tempTarget.classList.contains('timesheet__row-remove')) {
        this.holidayIndexToRemove = parseInt(tempTarget.getAttribute('data-index'), 10);
        this.removeProjectFromTimeSheet();

        this.deleteHoliday(this.holidayIndexToRemove);
				// this.modalConfirmProjectRemoval.open()
				break;
			} else if (tempTarget.classList.contains('remove-project-cancel')) {
				// close the confirm project removal pop up        
				// this.modalConfirmProjectRemoval.close()
				break;
			} else if (tempTarget.classList.contains('remove-project-proceed')) {
				// close the confirm project removal pop up        
				this.removeProjectFromTimeSheet();
				// this.modalConfirmProjectRemoval.close()
				break;
			}
			tempTarget = tempTarget.parentNode;
    }
    // searchOptions
  }
  	// remove a project from timesheet                                                                                              
	removeProjectFromTimeSheet() {
    console.log("-------------------")
    this.holidayList.splice(this.holidayIndexToRemove, 1)
    // remove the row from the list 
    
		// this.removedAProject = true;

		// this.hiddenActiveProjects.push(this.visibleActiveProjects.splice(this.holidayIndexToRemove, 1)[0]);
		// this.holderInitialConfig.hiddenActiveProjects.push(this.holderInitialConfig.visibleActiveProjects.splice(this.holidayIndexToRemove, 1)[0]);
		// (<FormArray>this.fgTimeFields.get('active_projects')).removeAt(this.holidayIndexToRemove);
		// this.modalConfirmProjectRemoval.close();
		this.cd.detectChanges();
  }
  elClick(e){
    e.click()
  }
  changeYear(y){
    console.log("------",y)
    this.selectedYear = y.value
    this.yearEditable = Number(this.selectedYear)>=Number(this.currentDate.getFullYear()) ? true : false;
    this.editMode = false
    this.getHolidayList(y.value)
    
  }

  getDay(i){
    console.log("----------getDay",typeof(i),i)
    if(typeof(i)=="string"){
      
    return  this.datePipe.transform(new Date(i),"EEEE")
    }
    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    console.log("-----------------date",this.aliases)
    
    console.log("+++++++",this.aliases['controls'][i]['controls'].date.status)
    if(this.aliases['controls'][i]['controls'].date.status != "INVALID"){
        //AS GETTING FROM BACKEND
      this.aliases['controls'][i]['controls'].count.setValue(this.getWorkdayCount(this.aliases['controls'][i]['controls'].date.value))

    console.log("=====",this.aliases['controls'][i]['controls'].date.value.startDate._d,
    this.datePipe.transform(this.aliases['controls'][i]['controls'].date.value.startDate._d,"EEEE")
    )
    console.log("------------count value--------------",this.aliases['controls'][i]['controls'].count.value)
    this.onCountChange(i)
    // if(this.aliases['controls'][i]['controls'].count.value>1){
    //   var crnt_dt = new Date(this.aliases['controls'][i]['controls'].date.value.startDate._d)
    //   console.log("crnt_dt===",crnt_dt)
      
    //   for(let cnt=1;cnt<this.aliases['controls'][i]['controls'].count.value;cnt++){
    //     crnt_dt.setDate( crnt_dt.getDate() + 1 )
    //   if(crnt_dt.getDay()==6){
    //     crnt_dt.setDate( crnt_dt.getDate() + 2 );
    //   }
    //   if(crnt_dt.getDay()==0){
    //     crnt_dt.setDate( crnt_dt.getDate() + 1 );
    //   }
      
    //   }
    //   console.log("====day====",this.datePipe.transform(crnt_dt,"EEEE"))
    //   this.aliases['controls'][i]['controls'].day.setValue(this.datePipe.transform(this.aliases['controls'][i]['controls'].date.value.startDate._d,"EEEE")+"-"+this.datePipe.transform(crnt_dt,"EEEE"))  
    //  }
    // else{
    // this.aliases['controls'][i]['controls'].day.setValue(this.datePipe.transform(this.aliases['controls'][i]['controls'].date.value.startDate._d,"EEEE"))
    // }
    }
    // console.log( this.datePipe.transform(Date.now(),'yyyy-MM-dd'));
    // return this.datePipe.transform(Date.now(),"EEEE")
   
    // return this.datePipe.transform(this.aliases['controls'][i]['controls'].date.value.startDate._d,"EEEE")
  }
  addRemoveLocation(i,l){
    console.log(this.aliases['controls'][i]['controls'].locations.value)
    if( this.aliases['controls'][i]['controls'].locations.value != null){
    // var loc = this.aliases['controls'][i]['controls'].locations.value.split(',')
    var loc = this.aliases['controls'][i]['controls'].locations.value
    if(loc.indexOf(l)==-1){
      loc.push(l)
    }else{
      loc.splice(loc.indexOf(l),1)
    }
    console.log("=======",loc)
    this.aliases['controls'][i]['controls'].locations.setValue(loc)
    // this.aliases['controls'][i]['controls'].locations.setValue(loc.join())
  }
  }
  ifChecked(i,l){
    if(Array.isArray(i)==true){
      console.log("-----------------------check if")
      var loc = i;
    }
    else if( this.aliases['controls'][i]['controls'].locations.value != null){
    var loc = this.aliases['controls'][i]['controls'].locations.value
    }
    else{
      return false
    }
    // console.log("-------------check------------",loc.indexOf(l))
    if(loc.indexOf(l)==-1){
      return false
    }else{
    return true
    }
    // var loc = this.aliases['controls'][i]['controls'].locations.value
    // loc.forEach(e=>{
    //   console.log("---------locc-----",e,'------l--',l)
    //   if(e==l){
    //     console.log("returning true")
    //     return true
    //   }
    // })
    // console.log("returning false")
    

  }
  getFromTemplate(){
    // this.holidayForm= this.fb.group({
    //   holidays: this.fb.array([])
    // });
    // this.HOLIDAYCONFIG_TESTDATA.forEach(e=>{
    //   this.addAlias();
    //   var al=this.aliases['controls'][this.aliases.length-1]['controls'];
      
    //   al.date.setValue({startDate:moment(e.date),endDate:moment(e.date)});
    //   this.getDay(this.aliases.length-1)
    //   // al.day.setValue(e.day);
    //   al.des.setValue(e.des);
    //   al.locations.setValue(e.locations);
    // })
    this.http.request('get','location-holiday-cal/','year=2021').subscribe(res=>{
      if(res.status==200){
          console.log(res.body['results'])
          res.body['results']["holidays"].forEach(e=>{
          // this.addAlias();
          e['week_day'] = this.getDay(e.holiday_date)
          var loc_checks = []
          this.headerLocation.forEach(l=>{
            loc_checks.push(this.ifChecked(e.locations,l['id']))
          })
          e['loc_checks']= loc_checks
          e['editable'] = true
          this.holidayArrayData.push(e)
          // var al=this.aliases['controls'][this.aliases.length-1]['controls'];
          
          // al.date.setValue({startDate:moment(e.holiday_date),endDate:moment(e.holiday_date)});
          // this.getDay(this.aliases.length-1)
          // // al.day.setValue(e.day);
          // al.des.setValue(e.holiday_id);
          // al.locations.setValue(e.locations);
          })
          this.edit(true)
          this.holidayArrayData = []
      }
    })


  }

onCountChange(i){
  if(this.aliases['controls'][i]['controls'].count.value>1){
    var crnt_dt = new Date(this.aliases['controls'][i]['controls'].date.value.startDate._d)
    console.log("crnt_dt===",crnt_dt)
    
    for(let cnt=1;cnt<this.aliases['controls'][i]['controls'].count.value;cnt++){
      crnt_dt.setDate( crnt_dt.getDate() + 1 )
    if(crnt_dt.getDay()==6){
      crnt_dt.setDate( crnt_dt.getDate() + 2 );
    }
    if(crnt_dt.getDay()==0){
      crnt_dt.setDate( crnt_dt.getDate() + 1 );
    }
    
    }
    console.log("====day====",this.datePipe.transform(crnt_dt,"EEEE"))
    this.aliases['controls'][i]['controls'].day.setValue(this.datePipe.transform(this.aliases['controls'][i]['controls'].date.value.startDate._d,"EEEE")+"-"+this.datePipe.transform(crnt_dt,"EEEE"))  
   }
  else{
  this.aliases['controls'][i]['controls'].day.setValue(this.datePipe.transform(this.aliases['controls'][i]['controls'].date.value.startDate._d,"EEEE"))
  }
}

  getWorkdayCount(d:Object){
    if(d.hasOwnProperty('startDate') && d.hasOwnProperty('endDate'))
    {
      let start_dt = new Date(d["startDate"]._d);
      let end_dt = new Date(d["endDate"]._d);
    console.log("---------getWorkdayCount-----",d)
    var count = 0;
    while (start_dt <= end_dt) {
      start_dt.setDate(start_dt.getDate() + 1);
      if ((start_dt.getDay() != 0) && (start_dt.getDay() != 1)) {

        count++;
      }

    }
    return count;
  }
  }
  openHolidayPopup(){
    console.log("year-----",(new Date()).getFullYear().toString().trim())
    this.addHolidayForm.controls.year.setValue(this.selectedYear);
    // this.selectedYear = (new Date()).getFullYear().toString();
    this.addHolidayForm.controls.option.setValue("Import from template");
    this.addHolidayPopup.open();
  }
  selectAddHolidayOption(){
    this.editMode = true
    // console.log("selectAddHolidayOption--------",this.addHolidayForm.value)
    // this.selectedYear = this.addHolidayForm.controls.year.value

    if(this.addHolidayForm.controls.option.value == "Import from template"){
    // this.getFromTemplate();
    // this.getHolidayList(this.selectedYear)
    this.getFromTemplate()
    
    }
    else{
      this.holidayForm= this.fb.group({
        holidays: this.fb.array([])//,[this.uniqueBy('des')])//,this.uniqueDates('date')
      });
    }
    this.addHolidayPopup.close();
  }
  changeSelectedYear(y){
    this.selectedYear = y.value;
  }
  async getHolidayList(year=null){
    await this.getLocation();

    this.holidayForm= this.fb.group({
      holidays: this.fb.array([])//,[this.uniqueBy('des')]) //,this.uniqueDates('date')
    });
    if(year == null){
      year =''
    }
    this.holidayArrayData = []
    this.showLocation = []
    let existedLoc = []

    this.http.request('get','location-holiday-cal/','year='+year).subscribe(res=>{
      if(res.status==200){
          console.log(res.body['results'])
          res.body['results']["holidays"].forEach(e=>{
          // this.addAlias();
          console.log("===========================ee",e)
          if(e.holiday_count>1){
          e['week_day'] = this.getDay(e.holiday_date) + "-" + this.getDay(e.end_date)
          }else{
          e['week_day'] = this.getDay(e.holiday_date)
          }

          // e['work_day_count'] = this.getWorkdayCount({'startDate':moment(e.holiday_date),'endDate':moment(e.holiday_date)})

          var loc_checks = []

          for(let i=0;i<this.headerLocation.length;i++){
            loc_checks.push(this.ifChecked(e.locations,this.headerLocation[i]['id'])); 
            console.log("******************888",e.locations)
            if(e.locations.indexOf(this.headerLocation[i]['id'])!=-1 && existedLoc.indexOf(i)==-1){
              existedLoc.push(i);
              
            }
            //   if( (this.headerLocation[i]['id']  in  Object.keys(this.showLocation))){
            //   this.showLocation[this.headerLocation[i]['id']] = true
            // }

          }
          // this.headerLocation.forEach(l=>{
          //   loc_checks.push(this.ifChecked(e.locations,l['id']));
          //   if( (l['id']  in  Object.keys(this.showLocation))){
          //     this.showLocation[l['id']] = true
          //   }
          // })



          e['loc_checks']= loc_checks;
          this.holidayArrayData.push(e)



          // var al=this.aliases['controls'][this.aliases.length-1]['controls'];
          
          // al.date.setValue({startDate:moment(e.holiday_date),endDate:moment(e.holiday_date)});
          // this.getDay(this.aliases.length-1)
          // // al.day.setValue(e.day);
          // al.des.setValue(e.holiday_id);
          // al.locations.setValue(e.locations);

          })
          var locCheck=[];
        //   this.holidayArrayData.forEach(hl=>{
            
        //     locCheck.push(this.ifChecked(hl.locations,this.headerLocation[i]['id']));
        //     hl['loc_checks']= locCheck
        //    //  this.holidayArrayData.push(locCheck)
           
        //  })
          for(let i=this.headerLocation.length;i>=0;i--){
            if(existedLoc.indexOf(i)==-1){
              console.log("-----------removing------------------",this.headerLocation[i]);
              this.holidayArrayData.forEach(hl=>{
                hl['loc_checks'].splice(i,1);
                
              })
              
            }
            else{
              this.showLocation.unshift(this.headerLocation[i])
     
            }
          }

          this.displayLocation = this.showLocation;
          console.log("===================showLocation=================",this.showLocation);
          this.IsNextYearVisible = res.body['results']["is_next_year_visible"]
          this.isConfirmed = res.body['results']["is_confirmed"]
      }
    })
    console.log("holidayArrayData",this.holidayArrayData)
    
    
  }

  async getLocation(){
    this.showLocation =[];
    var res = await this.http.request('get','location/').toPromise();
      if(res.status == 200){
        console.log("res.body['results']",res.body['results'])
        this.headerLocation = res.body['results']
        // this.headerLocation.forEach(e=>{
        //   this.showLocation[e.id] = false;
        // })
        
      }
  }
  edit(v){
    if(v){
      this.showLocation = this.headerLocation;
      this.getDefaultHolidayList();
      if(Number(this.selectedYear)>Number(this.currentDate.getFullYear())){
        this.minSelectDate =  moment(this.selectedYear.toString()+"-01-01", "YYYY-MM-DD")
      
      }else{
        this.minSelectDate =  moment(this.currentDate, "YYYY-MM-DD")
      }
      this.maxSelectDate=  moment( this.selectedYear.toString()+"-12-31", "YYYY-MM-DD")
     
      this.holidayArrayData.forEach(e=>{
      this.addAlias()
      var al=this.aliases['controls'][this.aliases.length-1]['controls'];
        
        al.date.setValue({startDate:moment(e.start_date),endDate:moment(e.end_date)});
        // this.getDay(this.aliases.length-1)
        
        al.day.setValue(e.week_day);
        al.des.setValue(e.holiday.holiday_name);
        al.count.setValue(e.holiday_count);
        al.locations.setValue(e.locations);
        al.editable.setValue(e.editable)
      })
    }else{
      this.showLocation = this.displayLocation;
      console.log("------this.holidayForm--before ====",this.holidayForm)
      this.holidayForm.removeControl('holidays');
      this.holidayForm.addControl('holidays', this.fb.array([]))//,[this.uniqueBy('des')]))//,this.uniqueDates('date')
      console.log("------this.holidayForm--get",this.holidayForm.get('holidays'))
    }
    
    this.editMode = v;
  }
  getDefaultHolidayList(){
    this.defaultHoliday = []

    this.http.request('get','default-holiday-list/').subscribe(res=>{
      if(res.status == 200){
        console.log("res.body['results']",res.body['results'])
        this.defaultHoliday = res.body['results']
      }
    })
    
  }
 
  getCurrentDate(){
    this.displayedYear = []

    this.http.request('get','get_current_date/').subscribe(res=>{
      if(res.status == 200){
        console.log("date=======",res.body['results'])
        this.currentDate =  new Date(res.body['results'].date);
        
        // this.datePipe.transform(main_dt,'dd-MM-yyyy')
        this.selectedYear =this.currentDate.getFullYear()
        this.displayedYear.push((Number(this.currentDate.getFullYear())-1).toString(),this.currentDate.getFullYear(),(Number(this.currentDate.getFullYear())+1).toString())
      }
    })
    
  }

  


  submitHoliday(){
    console.log("-----------------------")
    console.log(this.holidayForm.value);


    var error_list = []
    var main_list = []
    var fes_list = []
    var fes_error_list = []
    var locationwise_holiday = []
    var no_location_selected_error = []
    for(let j=0;j<this.aliases['controls'].length;j++){
      console.log("--------------------------------------------------------",this.aliases['controls'][j]['controls'].des.value)
      console.log("--------------------------------------------------------",this.aliases['controls'][j]['controls'].date.value['startDate'].format('YYYY-MM-DD'))
      if(this.aliases['controls'][j]['controls'].date.value['startDate']!=null){

        const mainControlCount = this.aliases['controls'][j]['controls'].count
        var mainControlLocation = this.aliases['controls'][j]['controls'].locations.value
        // var new_date = moment(val, "YYYY-MM-DD").add(1, 'days');

        var main_dt = new Date(this.aliases['controls'][j]['controls'].date.value['startDate'].format('YYYY-MM-DD')) 
        if(fes_list.indexOf(this.aliases['controls'][j]['controls'].des.value.toLowerCase().trim())!=-1){
          fes_error_list.push(j)
        }else{
        fes_list.push(this.aliases['controls'][j]['controls'].des.value.toLowerCase().trim())
        }




        
        for(let cnt=0;cnt<mainControlCount.value;cnt++){
          // if(main_list.indexOf(this.datePipe.transform(main_dt,'dd-MM-yyyy'))!=-1){
          //   error_list.push(this.datePipe.transform(main_dt,'dd-MM-yyyy'))
          // }else{
          main_list.push(this.datePipe.transform(main_dt,'dd-MM-yyyy'))

          if( mainControlLocation.length==0){
            no_location_selected_error.push(this.datePipe.transform(main_dt,'dd-MM-yyyy'))
          }
          mainControlLocation.forEach(loc => {
            console.log("location ",loc,this.datePipe.transform(main_dt,'dd-MM-yyyy'))
            locationwise_holiday.push(this.datePipe.transform(main_dt,'dd-MM-yyyy')+","+loc.toString())
          });
          // }
          if(mainControlCount.value==1){
            break
          }

          main_dt.setDate( main_dt.getDate() + 1 )
          if(main_dt.getDay()==6){
            main_dt.setDate( main_dt.getDate() + 2 );
          }
          if(main_dt.getDay()==0){
            main_dt.setDate( main_dt.getDate() + 1 );
          }

        }

      }
    }
    console.log("----------------main_list ",main_list)
    console.log("----------------error_list ",error_list)
    var locationwise_holiday_error = []

    // console.log("---------------------locationwise_holiday-----------------",locationwise_holiday)
    // for(let i = 0;i<locationwise_holiday.length;i++){
    //   console.log("-----------------------i--------------",locationwise_holiday[i][0],locationwise_holiday[i][1])
    //   for(let j = i;j<locationwise_holiday.length;j++){
        
    //     console.log("-----------------------j-------------",locationwise_holiday[j][0],locationwise_holiday[j][1],(locationwise_holiday[i][0]===locationwise_holiday[j][0]),(locationwise_holiday[i][1]===locationwise_holiday[j][1]),(i!=j))
    //     if((locationwise_holiday[i][0]===locationwise_holiday[j][0])&&(locationwise_holiday[i][1]===locationwise_holiday[j][1])&&(i!=j)){
    //     locationwise_holiday_error.push(locationwise_holiday[i][0])
    //     }
    //   }
    // }
    locationwise_holiday.forEach(loc_hol=>{
      // console.log("----------------[loc_hol[0],loc_hol[1]]",loc_hol, [loc_hol[0],loc_hol[1]])
      console.log("1st index",locationwise_holiday.indexOf(loc_hol));
      console.log("Last index",locationwise_holiday.lastIndexOf(loc_hol));
      if(locationwise_holiday.indexOf(loc_hol)!==locationwise_holiday.lastIndexOf(loc_hol)){
        if(locationwise_holiday_error.indexOf(loc_hol.split(",",1).toString())===-1){
        locationwise_holiday_error.push(loc_hol.split(",",1).toString())}
      }
    })

    if(no_location_selected_error.length>0){
      this.ss.statusMessage.showStatusMessage(false,"Atleast one location should be selected for any holiday. No location is selected for   "+no_location_selected_error.toString())
      return
    }

    if( locationwise_holiday_error.length>0){
      this.ss.statusMessage.showStatusMessage(false,"Same locations are selected multiple times for  "+locationwise_holiday_error.toString())
      return
    }

    if( error_list.length>0){
      this.ss.statusMessage.showStatusMessage(false,"Duplicate dates found for "+error_list.toString())
      return
    }
    if(fes_error_list.length>0){
      this.ss.statusMessage.showStatusMessage(false,"Duplicate festivals found for "+fes_error_list.map(function(el){
        this.aliases['controls'][el]['controls'].des.setErrors({'uniqueBy': true});
        return this.aliases['controls'][el]['controls'].des.value }.bind(this)))
        return
    }



   
    let formData = new FormData()
    this.holidayForm.controls.holidays.value.forEach((element,index) => {
      console.log("indside ",element.date.startDate.format('YYYY-MM-DD'),element.date.endDate.format('YYYY-MM-DD'),element.des,element.locations)
      formData.append(index,JSON.stringify({'start_date':element.date.startDate.format('YYYY-MM-DD'),'end_date':element.date.endDate.format('YYYY-MM-DD'),
      'holiday':element.des,'locations':element.locations,'holiday_year':this.selectedYear, 'holiday_count':element.count,
      'holiday_date':element.date.startDate.format('YYYY-MM-DD')}))
    });
    
    this.http.request('post','update-location-holiday-cal/','',formData).subscribe(res=>{
      if(res.status == 201){
        console.log("===========================================",res.body);
        this.editMode = false
        this.getHolidayList(this.selectedYear);
      }
    })
  }
    private holidayOptionSubscriber:Subscription; 
    options = []

    showOptionIndex = -1
    getHolidayOptions(i){
    //   let l=[]
    //   this.defaultHoliday.forEach(e=>{
    //     if(e['holiday_name'].toLowerCase().includes(evt.toLowerCase())){
    //       l.push(e)
    //     }
    // })
    // this.holidayForm.controls.locations.
    this.showOptionIndex = i
    let l=[]
    this.options=[]
    console.log("------------aliases",this.aliases['controls'][i])
    this.holidayOptionSubscriber = this.aliases['controls'][i]['controls'].des.valueChanges.subscribe(val=>{
      console.log("------------value changes",i,val)

      l=[]
      this.defaultHoliday.forEach(e=>{
        if(e['name'].toLowerCase().includes(val.toLowerCase())){
          l.push(e)
        }
      })
      // var error = null;
      // for(let j=0;j<this.aliases['controls'].length;j++){
      //   console.log("------------------------------matching-------",i,j,val.toLowerCase(),this.aliases['controls'][j]['controls'].des.value.toLowerCase())
      //   if(j!=i){
      //     if(val.toLowerCase() === this.aliases['controls'][j]['controls'].des.value.toLowerCase()){
      //       error = true
      //       break
      //     }
      //   }
      // };
      // console.log("------------------------------error-------",error)
      // this.aliases['controls'][i]['controls'].des.setErrors({'notUnique': error})
      // this.cd.detectChanges();

      // console.log("----------error  ========",this.aliases['controls'][i]['controls'].des)
      this.options = l
      console.log("holiday optionsss     ",l)

    })
  }



getNextYearHoliday(){
  this.selectedYear+=1
  this.getHolidayList(this.selectedYear);
}
getCurrentYearHoliday(){
  this.selectedYear = this.currentDate.getFullYear()
  this.getHolidayList(this.selectedYear);
}

confirmHoliday(){
  let formData = new FormData()
  formData.append("year",this.selectedYear)
  this.http.request('post','confirm-holiday/','',formData).subscribe(res=>{
    if(res.status == 201){
      console.log("===========================================",res.body);
      this.ss.statusMessage.showStatusMessage(true,res.body["results"])
      this.isConfirmed = true
      
    }
    else{
      this.ss.statusMessage.showStatusMessage(false,"Error while notifying")
      this.isConfirmed = false
    }
  })

  
}


  destroyHolidayOptions(i): void {
    
    console.log("--------destroyHolidayOptions ------")
    this.holidayOptionSubscriber.unsubscribe();
    // this.showOptionIndex = -1
    setTimeout(()=>{
      if(this.showOptionIndex==i){
          this.showOptionIndex = -1;
        }else{
          console.log('====destroyHolidayOptions====used by',this.showOptionIndex)
        }
    
    },250)
  }
   uniqueText(control:FormControl): Promise<any>|Observable<any> {
    
      let promise =  new Promise((resolve,reject)=>{

      var error = null;
      var count = 0
      for(let j=0;j<this.aliases['controls'].length;j++){
        console.log("------------------------------matching-------",j,this.showOptionIndex,control.value,this.aliases['controls'][j]['controls'].des.value.toLowerCase())
        // if(j!=this.showOptionIndex){
          if(control.value.toLowerCase() === this.aliases['controls'][j]['controls'].des.value.toLowerCase()){
            // error = true
            // break
          // }
          count ++
        
        }
      };
      error = (count >1) ? true:null;
      if(error==true){
      resolve( { 'notUnique': true } );
      }
      else{
        resolve(null);
      }
    })
    return promise
  }

  uniqueDate(control:FormControl): Promise<any>|Observable<any> {
    
    let promise =  new Promise((resolve,reject)=>{

    var error = null;
    var all_dates = []
    for(let j=0;j<this.aliases['controls'].length;j++){
      console.log("------------------------------matching-------",j,this.showOptionIndex,control.value,this.aliases['controls'][j]['controls'].date.value)
      // if((control.value['startDate'] != null) && (control.value['startDate'] != undefined)){
      //   var start_yr = control.value['startDate'].format('YYYY');
        
      //   this.aliases['controls'][j]['controls'].date.value
         
      
      // }
      if(this.aliases['controls'][j]['controls'].date.value['startDate']!=null){
        
        if(all_dates.indexOf(this.aliases['controls'][j]['controls'].date.value['startDate'].format("YYYY-MM-DD"))==-1){
        all_dates.push(this.aliases['controls'][j]['controls'].date.value['startDate'].format("YYYY-MM-DD"))
      }else{
        error =true
        break
      }
    }

    };
    console.log("-----array dates----",all_dates)
    if(error==true){
    resolve( { 'notUniqueDate': true } );
    }
    else{
      resolve(null);
    }
  })
  return promise
}
 
}


