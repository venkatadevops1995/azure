import { TimeSheetService } from './time-sheet.service';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { SingletonService } from './../../../services/singleton.service';
import { Component, OnInit, ViewEncapsulation, Input, SimpleChanges, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { emptyFormArray } from 'src/app/functions/empty-form-array.fn';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { Subject } from 'rxjs';

interface TimeSheet {
	week?: number;
}
@Component({
	selector: 'app-time-sheet',
	templateUrl: './time-sheet.component.html',
	styleUrls: ['./time-sheet.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeSheetComponent implements OnInit {

	// subject to emit for clearing the subscriptions
	destroy$: Subject<any> = new Subject();

	// should we consider IST ?
	// should i only make the dates and times in front end for the time sheet
	// will we have same endpoint for all the data for a week timesheet ? projects, start date , week number etc
	@Input() config: any;

	// input property used to disable the whole time sheet
	@Input() disable: boolean;

	// input property used to disable the whole time sheet
	@Output("evChange") onChange: EventEmitter<any> = new EventEmitter();

	// reference to the active mins element
	@ViewChild('selProject') elSelProject: ElementRef;

	// reference to the modal popup  before remove of project from timesheet
	@ViewChild(ModalPopupComponent) modalConfirmProjectRemoval: ModalPopupComponent;

	// the form group which holds the form controls of the time fields
	fgTimeFields: FormGroup;

	// the form group which holds the form controls of the totaltime fields
	fgTotalTimeFields: FormGroup;

	// property to hold the project index to remove from the timesheet during the confirmation in the modal pop up
	projectIndexToRemove: number;

	// boolean view token to show hide the select project list
	showProjectList: boolean = false;

	// boolean view token to show hide the whole timesheet based on input config 
	showTimeSheet: boolean = false;

	// boolean token to decide whether the timesheet data is valid for final submission
	canFinalSubmit: boolean = false;

	// visible active projects
	visibleActiveProjects: Array<any> = [];

	// hidden active projects which are listed in select project drop down
	hiddenActiveProjects: Array<any> = [];

	// array of keys to hold the boolean values which indicate which days of the week are currently enabled.
	holderInitialConfig: any = [];

	// property which indicates whether the remove project was clicked atleast once
	removedAProject: boolean = false;

	// totalHours related Data 
	totalDayTimeMeta: Array<any> = [];

	//grand Total of all proj
	grandTotal: any;

	// timesheet form group value holder
	timesheetFgValueHolder:any=undefined;

	// form controls count in  active projects
	formControlsCount: number = 0;

	constructor(
		private ss: SingletonService,
		private cd: ChangeDetectorRef,
		private el: ElementRef,
		private tsService:TimeSheetService
	) {
		this.fgTimeFields = this.ss.fb.group({
			active_projects: this.ss.fb.array([]),
			'VACATION': this.ss.fb.array([]),
			'MISCELLANEOUS': this.ss.fb.array([]),
			'HOLIDAY': this.ss.fb.array([])
		});

		this.fgTotalTimeFields = this.ss.fb.group({
			total: this.ss.fb.array([])
		});


		let faTotal = (<FormArray>this.fgTimeFields.get("total"))
		for (let i = 0; i < 7; i++) {
			(<FormArray>this.fgTotalTimeFields.get('total')).push(new FormControl({ h: 0, m: 0 }, []))
		}

		// on value changes the total hours should be calculated
		this.fgTimeFields.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(val => {

			console.log("value changes") 
			
			let totalAcc = [];

			this.totalDayTimeMeta = [];

			// accumulator for projects and vacation for all days . used to decide whether the timesheet can be ready for final submit
			let totalAccForFinalSubmit: any = []

			// if a project is removed then it is equala to a  changed value
			let hasValueChanged = this.removedAProject;
			let hasAllZerosInProject = false;

			for (let i = 0; i < 7; i++) {
				totalAcc.push({ h: 0, m: 0 });
				totalAccForFinalSubmit.push({ h: 0, m: 0 });
			}

			// reusable function to accumulate the time
			let processValue = (val, index, finalSubmitToken = false) => {
				if (val) {
					if (val.h) {
						totalAcc[index].h += val.h;
						if (finalSubmitToken) {
							totalAccForFinalSubmit[index].h += val.h;
						}
					}
					if (val.m) {
						// let valM = (val.m == "00" ? 0 : parseInt(val.m, 10))
						totalAcc[index].m += val.m;
						if (finalSubmitToken) {
							totalAccForFinalSubmit[index].m += val.m;
						}
					}
				}
			}
		   
			//update totals in project
			let updateTotalInProject = (proj,val,updated_hours)=>{
				if (val) {
					console.log(proj);
					console.log('updated_hours'+updated_hours);
					
					if(proj == 'HOLIDAY' || proj == 'MISCELLANEOUS' || proj == 'VACATION'){
						let hours = 0;
						hours = updated_hours.map(item => item.h).reduce((prev, next) => prev + next);
						console.log(hours);
						
						this.config[proj].work_hours.forEach(element => {
							if(element.date == 'Total'){
								element.h = hours;
						}
						});
					
						let mins = 0;
						mins = updated_hours.map(item => item.m).reduce((prev, next) => prev + next);
						this.config[proj].work_hours.forEach(element => {
							if(element.date == 'Total'){
								element.m = 0;
								element.m = mins;
								console.log(element.h);
								
								if(element.m >= 60){
									element.h = hours + Math.floor(element.m/60);
									element.m = element.m % 60;
								} 
						    }
						});
					// }
				}
				else{
					this.config['active_projects'].forEach(elementproj => {
						
					if(elementproj.project_name == proj){
						let hours = 0;
						hours = updated_hours.map(item => item.h).reduce((prev, next) => prev + next);
					// if (val.h) {
						elementproj.work_hours.forEach(element => {
							if(element.date == 'Total'){
								element.h = hours;
						}
						});
					// }
					// if (val.m) {
						// let valM = (val.m == "00" ? 0 : parseInt(val.m, 10))
						let mins = 0;
						mins = updated_hours.map(item => item.m).reduce((prev, next) => prev + next);
						elementproj.work_hours.forEach(element => {
							if(element.date == 'Total'){
								element.m = mins;
								if(element.m >= 60){
									element.h = hours + Math.floor(element.m/60);
									element.m = element.m % 60;
								}
						}
						});
					// }
				}
				});
				}
				}
			}

			val.active_projects.forEach((project, index) => {
				let initialValues = this.holderInitialConfig.visibleActiveProjects[index];
				console.log(initialValues)
				let foundNonZero = false;
				project.forEach((valInner, indexInner) => {
					if (valInner.h !== 0 || valInner.m !== 0) {
						foundNonZero = true;
					}
					processValue(valInner, indexInner, true)
					updateTotalInProject(initialValues['project_name'],valInner,project)
					let valInitial = initialValues.work_hours[indexInner];
					if (valInner.h !== valInitial.h || valInner.m !== valInitial.m) {
						console.log(valInner, valInitial)
						
						hasValueChanged = true;
						console.log(project);
						
						
					}
				});
				if(!foundNonZero){
					hasAllZerosInProject = true;
				}
			});

			this.hiddenActiveProjects.forEach((project, index) => {
				let initialValues = this.holderInitialConfig.hiddenActiveProjects[index];
				project.work_hours.forEach((valInner, indexInner) => {
					let valInitial = initialValues.work_hours[indexInner];
					if (valInner.h !== valInitial.h || valInner.m !== valInitial.m) {
						hasValueChanged = true;
						// updateTotalInProject(initialValues['project_name'],valInner,project)
					}
				});
			})

			val['VACATION'].forEach((day, index) => {
				processValue(day, index, true)
				updateTotalInProject('VACATION',day,val['VACATION'])
				let valInitial = this.holderInitialConfig['VACATION'].work_hours[index];
				if (day.h !== valInitial.h || day.m !== valInitial.m) {
					hasValueChanged = true;
				}
				this.tsService.vacationArray[index] = day.h;
			})

			val['HOLIDAY'].forEach((day, index) => {
				processValue(day, index, true)
				updateTotalInProject('HOLIDAY',day,val['HOLIDAY'])
				let valInitial = this.holderInitialConfig['HOLIDAY'].work_hours[index];
				if (day.h !== valInitial.h || day.m !== valInitial.m) {
					hasValueChanged = true;
					console.log(day);
					// day.total = day.total.h + day.h
				}
				this.tsService.holidayArray[index] = day.h;
			})
			console.log(val['HOLIDAY']);
			

			val['MISCELLANEOUS'].forEach((day, index) => {
				processValue(day, index, true)
				updateTotalInProject('MISCELLANEOUS',day,val['MISCELLANEOUS'])
				let valInitial = this.holderInitialConfig['MISCELLANEOUS'].work_hours[index];
				if (day.h !== valInitial.h || day.m !== valInitial.m) {
					hasValueChanged = true;
				}
			});

			totalAcc.forEach((day, index) => {
				this.totalDayTimeMeta.push(day);
				if (day.m / 60 < 1) {
				} else {
					day.h += parseInt((day.m / 60) + "", 10);
					let dayM = (day.m % 60);
					day.m = dayM;
				}
			});

			let totalHours = this.totalDayTimeMeta.map(item => item.h).reduce((prev, next) => prev + next);
			let totalMins = this.totalDayTimeMeta.map(item => item.m).reduce((prev, next) => prev + next);
			if(totalMins >= 60){
				totalHours = totalHours + Math.floor(totalMins/60);
				totalMins = totalMins % 60;
				}
			
            this.grandTotal = ("00" + totalHours).slice(-JSON.stringify(totalHours).length)+ ' : ' + ("00" + totalMins).slice(-2)
			let enableFinalSubmitArray = [];

			totalAccForFinalSubmit.forEach((day, index) => {
				if (day.m / 60 < 1) {
				} else {
					day.h += parseInt((day.m / 60) + "", 10);
					let dayM = (day.m % 60);
					day.m = dayM;
				}
				if(index == 0 || index == 1){
					enableFinalSubmitArray[index] = true;
				}else{
					enableFinalSubmitArray[index] = (day.m >= 15 || day.h > 0);
				}
			})

			// function used to find out if the total is less than 24 hours
			let checkTotalForValidEntries = () => {
				let validity = true;
				totalAcc.forEach((item, index) => {
					if (item.h > 24) {
						validity = false;
						item.validity = false;
						item.showError = true;
					} else if (item.h == 24 && item.m != 0) {
						validity = false;
						item.validity = false;
						item.showError = true;
					} else {
						item.showError = false;
					}
					setTimeout(() => {
						item.showError = false;
						this.cd.detectChanges();
					}, 4000)
				})
				this.cd.detectChanges();
				return validity;
			}
			// check if all weekdays are filled with valid amount of hours > 15 mins
			this.canFinalSubmit = (enableFinalSubmitArray.indexOf(false) == -1) && checkTotalForValidEntries();
			this.fgTotalTimeFields.get('total').setValue(totalAcc)
			this.tsService.totalArray=totalAcc;
			console.log(this.totalDayTimeMeta)
			this.cd.detectChanges(); 
			// emit the change event with the data
			this.onChange.emit({
				canFinalSubmit: this.canFinalSubmit,
				hasValueChanged: hasValueChanged,
				hasAllZerosInProject:hasAllZerosInProject
			})
			// console.log(this.fgTotalTimeFields.value) 
		})

	}

	ngOnChanges(changes: SimpleChanges) {
		let config = changes.config;
		if (config && config.currentValue != config.previousValue) {
			let configValue = config.currentValue;
			if (configValue) {
				// get the active projects list which are going to be visible by adding first project into the visible list
				this.holderInitialConfig = { ...configValue };
				this.visibleActiveProjects = [];
				this.holderInitialConfig.visibleActiveProjects = [];
				this.hiddenActiveProjects = [];
				this.holderInitialConfig.hiddenActiveProjects = []
				if (configValue.active_projects && configValue.active_projects.length > 0) {
					emptyFormArray((<FormArray>this.fgTimeFields.get('active_projects')));
					configValue.active_projects.forEach((project, index) => {
						if (project.visibilityFlag) {
							this.visibleActiveProjects.push(project);
							// the holder initial config should have visible hidden active projects in sync
							this.holderInitialConfig.visibleActiveProjects.push(this.holderInitialConfig.active_projects[index]);
							project.addedIntoForm = true;
							let fa = this.ss.fb.array([]);
							for (let i = 0; i < 7; i++) {
								fa.push(new FormControl(project.work_hours[i], []))
							}
							(<FormArray>this.fgTimeFields.get('active_projects')).push(fa);
						} else {
							this.hiddenActiveProjects.push(project);
							this.holderInitialConfig.hiddenActiveProjects.push(this.holderInitialConfig.active_projects[index]);
						}
					})
				}
				// add or reform the form controls into the form group which holds the time durations 
				emptyFormArray((<FormArray>this.fgTimeFields.get("VACATION")))
				emptyFormArray((<FormArray>this.fgTimeFields.get("MISCELLANEOUS")))
				emptyFormArray((<FormArray>this.fgTimeFields.get("HOLIDAY")))
				let faVacation = (<FormArray>this.fgTimeFields.get("VACATION"))
				let faMiscellaneous = (<FormArray>this.fgTimeFields.get("MISCELLANEOUS"))
				let faHoliday = (<FormArray>this.fgTimeFields.get("HOLIDAY"))
				// reset enable criteria 
				for (let i = 0; i < 7; i++) {
					if (configValue['VACATION']) {
						faVacation.push(new FormControl(configValue["VACATION"].work_hours[i], []))
					}
					if (configValue['MISCELLANEOUS']) {
						faMiscellaneous.push(new FormControl(configValue["MISCELLANEOUS"].work_hours[i], []))
					}
					if (configValue['HOLIDAY']) {
						faHoliday.push(new FormControl(configValue["HOLIDAY"].work_hours[i], []))
					}
				}
				this.showTimeSheet = true;
			} else {
				this.showTimeSheet = false;
				this.holderInitialConfig = {};
			}
		}
	}

	ngOnInit(): void {

	}

	ngOnDestroy() {
		this.destroy$.next();
	}

	// event listener on document to check if active mins is clicked
	@HostListener("document:click", ['$event'])
	onClickDocument(e) {
		let target: any = e.target;
		if (this.elSelProject && target == this.elSelProject.nativeElement) {
			this.showProjectList = !this.showProjectList;
		} else if (this.elSelProject && isDescendant(this.elSelProject.nativeElement, target) && target.classList.contains('sel-project__project')) {
			let index = Number(target.getAttribute("index"));
			let projectToBeAdded = this.hiddenActiveProjects[index];
			this.visibleActiveProjects.push(projectToBeAdded);
			this.holderInitialConfig.visibleActiveProjects.push(this.holderInitialConfig.hiddenActiveProjects[index]);
			projectToBeAdded.addedIntoForm = true;
			this.hiddenActiveProjects.splice(index, 1);
			this.holderInitialConfig.hiddenActiveProjects.splice(index, 1);
			let fa = this.ss.fb.array([]);
			for (let i = 0; i < 7; i++) {
				fa.push(new FormControl({ h: 0, m: 0 }, []))
			}
			(<FormArray>this.fgTimeFields.get('active_projects')).push(fa);
			projectToBeAdded.work_hours.push({date:'Total',enable: true,h:0,m:0})
			this.showProjectList = false;
		} else {
			this.showProjectList = false;
		}
	}


	// event listener on document to check if remove a project button is clicked
	@HostListener("click", ['$event'])
	onClickHost(e) {
		let target: any = e.target;
		let tempTarget = target;
		while (tempTarget != this.el.nativeElement) {
			// found remove row 
			if (tempTarget.classList.contains('timesheet__row-remove')) {
				this.projectIndexToRemove = parseInt(tempTarget.getAttribute('data-index'), 10);
				this.modalConfirmProjectRemoval.open()
				break;
			} else if (tempTarget.classList.contains('remove-project-cancel')) {
				// close the confirm project removal pop up        
				this.modalConfirmProjectRemoval.close()
				break;
			} else if (tempTarget.classList.contains('remove-project-proceed')) {
				// close the confirm project removal pop up        
				this.removeProjectFromTimeSheet();
				this.modalConfirmProjectRemoval.close()
				break;
			}
			tempTarget = tempTarget.parentNode;
		}
	}


	// remove a project from timesheet                                                                                              
	removeProjectFromTimeSheet() {
		// remove the row from the list 
		this.removedAProject = true;
		this.visibleActiveProjects[this.projectIndexToRemove]['work_hours'].pop();
		this.hiddenActiveProjects.push(this.visibleActiveProjects.splice(this.projectIndexToRemove, 1)[0]);
		this.holderInitialConfig.hiddenActiveProjects.push(this.holderInitialConfig.visibleActiveProjects.splice(this.projectIndexToRemove, 1)[0]);
		(<FormArray>this.fgTimeFields.get('active_projects')).removeAt(this.projectIndexToRemove);
		this.modalConfirmProjectRemoval.close();
		this.cd.detectChanges();
	}

	// method used to get the current timesheet data which can be used in host component of this timesheet
	getTimeSheetData() {
		let config = { ...this.config }
		config['VACATION']['work_hours'] = this.fgTimeFields.get('VACATION').value.map((val, index) => {
			// console.log(config['VACATION']['work_hours'][index], this.fgTimeFields.get('VACATION').value)
			config['VACATION']['work_hours'][index].h = val.h;
			config['VACATION']['work_hours'][index].m = val.m;
			return config['VACATION']['work_hours'][index];
		})
		// delete config['VACATION']['work_hours'][7];
		config['MISCELLANEOUS']['work_hours'] = this.fgTimeFields.get('MISCELLANEOUS').value.map((val, index) => {
			config['MISCELLANEOUS']['work_hours'][index].h = val.h;
			config['MISCELLANEOUS']['work_hours'][index].m = val.m;
			return config['MISCELLANEOUS']['work_hours'][index];
		})
		// delete config['MISCELLANEOUS']['work_hours'][7];
		config['HOLIDAY']['work_hours'] = this.fgTimeFields.get('HOLIDAY').value.map((val, index) => {
			config['HOLIDAY']['work_hours'][index].h = val.h;
			config['HOLIDAY']['work_hours'][index].m = val.m;
			return config['HOLIDAY']['work_hours'][index];
		})
		// delete config['HOLIDAY']['work_hours'][7];
		let tempActiveProjects = this.fgTimeFields.get('active_projects').value.map((item, index) => {
			let temp = {...this.visibleActiveProjects[index]};
			// delete temp['work_hours'][7];
			temp['work_hours'] = item.map((val, indexInner) => {
				temp['work_hours'][indexInner].h = val.h;
				temp['work_hours'][indexInner].m = val.m;
				return temp['work_hours'][indexInner];
			})
			return temp;
		})
		config['active_projects'] = tempActiveProjects;
		// config['active_projects'].forEach(element => {
		// 	element['work_hours'].pop();
		// });
		// this.hiddenActiveProjects.forEach(element => {
		// 	element['work_hours'].pop();
		// });
		// add the project which are added into the timesheet but are currently removed and set their h and m to 0
		this.hiddenActiveProjects.forEach((item, index) => {
			
			if (item.addedIntoForm) {
				item.work_hours.forEach(val => {
					val.h = 0;
					val.m = 0;
				})
				config['active_projects'].push(item);
			} else {
				config['active_projects'].push(item);
			}
		})
		return config
	}
    //adding total hours and minutes of weekly wise
	projectWeekTotal(hours){
	  let TotHours = 0;
	  let TotMins = 0;
	//   console.log(hours);
	  
	  hours.forEach(element => {
		if(element.h >=0){
		TotHours =+ TotHours + element.h;
	}
	if(element.h >=0){
		TotMins =+ TotMins + element.m;
	}
	  });
	  if(TotMins >= 60){
		TotHours = TotHours + Math.floor(TotMins/60);
		TotMins = TotMins % 60;
	  }
	  // console.log(active);
	  return   ("00" + TotHours).slice(-2)+ ' : ' + ("00" + TotMins).slice(-2)
     
	}

}
