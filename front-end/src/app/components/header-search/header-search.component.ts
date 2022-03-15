import { HttpParams } from '@angular/common/http';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HttpClientService } from 'src/app/services/http-client.service';
import { EmployeeProfileDetailsComponent } from '../employee-profile-details/employee-profile-details.component';
import { ModalPopupComponent } from '../modal-popup/modal-popup.component';

@Component({
  selector: 'app-header-search',
  templateUrl: './header-search.component.html',
  styleUrls: ['./header-search.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class HeaderSearchComponent implements OnInit {
  filteredManagers: Observable<any>;
  search: FormControl = new FormControl("");
  employeesOptions: Array<any> = []
  employeeList: any[];
  employeeInput: any = {};
  value: any;

  constructor(
    private http: HttpClientService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog 
  ) {
    this.filteredManagers = this.search.valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this.filterManagerList(state) : this.employeesOptions.slice())
      );
  }
  searchForm = this.formBuilder.group({
    search: '',
  });
  ngOnInit(): void {
    this.getEmployees();
  }
  filterManagerList(value: string) {
    const filterValue = value.toLowerCase();
    return this.employeesOptions.filter(option => option.emp_name.toLowerCase().includes(filterValue) || option.staff_no.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }
  filterValues(search: string) {
    return this.employeesOptions.filter(value =>
      value.emp_name.toLowerCase().indexOf(search.toLowerCase()) === 0);
  }
  getEmployees() {
    let params = new HttpParams({
      fromObject: {
        str: '',
        type: 'hierarchy',
        hierarchy_type: 'all'
      }
    })
    this.http.request('get', 'users/', params).subscribe((res) => {
      if (res.status == 200) {
        this.employeesOptions = []
        // this.employeesOptions.push({ emp_id: 'all', emp_name: 'ALL' })
        res.body['results'].forEach(element => {
          this.employeesOptions.push(element)
        });
        this.employeeList = [...this.employeesOptions]
        // console.log(this.employeesOptions);
      }
    })
  }
  openEmployeepopUp() {

    let searchedValue = this.search.value.trim();
    if (searchedValue != '') {
      this.getemployeeDetails(searchedValue);
    }

  }
  onSubmitResolvedLeaveFilter(e) {
    let fgValue: any = this.search.value
    this.openEmployeepopUp()
    console.log(fgValue, e);
  }


  getemployeeDetails(emp_name) {
    let params = new HttpParams({
      fromObject: {
        emp_name: emp_name
      }
    })
    this.http.request('get', 'employeeData/', params).subscribe((res) => {
      if (res.status == 200) {
        this.employeeInput = { emp_name: emp_name, emp_details: res.body[0] }
        let dialogRef =  this.dialog.open(EmployeeProfileDetailsComponent, {
          panelClass: 'employee-profile-details',
          backdropClass:'',
          data: this.employeeInput
        })
      } else {
        console.log("INVALID")
      }
    })
  }

  onClose() {
    this.searchForm.reset();
    this.value = "";
  }

}
