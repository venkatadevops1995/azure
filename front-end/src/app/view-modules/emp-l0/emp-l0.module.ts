import { TimesheetViewModule } from './../common/timesheet-view/timesheet-view.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { ButtonModule } from './../../components/button/button.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpL0RoutingModule } from './emp-l0-routing.module';
import { EmpL0Component } from './emp-l0.component';
import { L0DashboardComponent } from './l0-dashboard/l0-dashboard.component';
import { L0TimesheetComponent } from './l0-timesheet/l0-timesheet.component';
import { TimeSheetModule } from '../common/time-sheet/time-sheet.module'; 
import { AttendenceSheetModule } from '../common/attendence-sheet/attendence-sheet.module';
import { ManageSelfLeavesModule } from '../common/manage-self-leaves/manage-self-leaves.module';
import { HolidayModule } from '../common/holiday/holiday.module';
import { ReportModule } from '../common/report/report.module';
import { ImportExportLeaveModule } from '../common/import-export-leave/import-export-leave.module';
import { EmployeeLeaveInfoModule } from '../common/employee-leave-info/employee-leave-info.module';
import { LeavePolicyConfigModule } from '../common/leave-policy-config/leave-policy-config.module';
import { LeaveHistoryModule } from '../common/leave-history/leave-history.module';
import { ManageUserModule } from '../common/manage-user/manage-user.module';
import { ManageProjectModule } from '../common/manage-project/manage-project.module';


@NgModule({
  declarations: [EmpL0Component, L0DashboardComponent, L0TimesheetComponent ],
  imports: [
    CommonModule,
    EmpL0RoutingModule,
    TimeSheetModule,
    ButtonModule,
    SvgIconModule,
    ReactiveFormsModule,
    TimesheetViewModule,
    AttendenceSheetModule,
    ManageSelfLeavesModule,
    ReportModule,
    HolidayModule,
    EmployeeLeaveInfoModule,
    ImportExportLeaveModule,
    LeavePolicyConfigModule,
    LeaveHistoryModule,
    ManageUserModule,
    ManageProjectModule

  ]
})
export class EmpL0Module { }
