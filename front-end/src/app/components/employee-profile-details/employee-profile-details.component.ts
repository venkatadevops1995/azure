import { HttpParams } from '@angular/common/http';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClientService } from 'src/app/services/http-client.service';

@Component({
  selector: 'app-employee-profile-details',
  templateUrl: './employee-profile-details.component.html',
  styleUrls: ['./employee-profile-details.component.scss']
})
export class EmployeeProfileDetailsComponent implements OnInit {

  showToolTip: boolean = false;
  constructor(private http: HttpClientService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<any>) {

  }

  onCopy() {
    this.showToolTip = true;
    console.log(this.showToolTip)
    setTimeout(() => {
      this.showToolTip = false;
    }, 1000)
  }

  onClickClose() {
    // 
    this.dialogRef.close()
  }

  ngOnInit(): void {
  }
  ngOnChanges() {
  }

}
