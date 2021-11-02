import { L1DashboardComponent } from './l1-dashboard/l1-dashboard.component';
import { EmpL1Component } from './emp-l1.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TimesheetViewComponent } from '../common/timesheet-view/timesheet-view.component';
import { ApproveTimesheetsComponent } from '../common/approve-timesheets/approve-timesheets.component';
import { AttendenceSheetComponent } from '../common/attendence-sheet/attendence-sheet.component';
import { ManageProjectComponent } from '../common/manage-project/manage-project.component';
import { ManageUserComponent } from '../common/manage-user/manage-user.component';
import { ManageSelfLeavesComponent } from '../common/manage-self-leaves/manage-self-leaves.component';
import { ManageTeamLeavesComponent } from '../common/manage-team-leaves/manage-team-leaves.component';
import { HolidayComponent } from '../common/holiday/holiday.component';
import { ReportComponent } from '../common/report/report.component';
import { EmployeeLeaveInfoComponent } from '../common/employee-leave-info/employee-leave-info.component';
import { ImportExportLeaveComponent } from '../common/import-export-leave/import-export-leave.component';
import { LeavePolicyConfigComponent } from '../common/leave-policy-config/leave-policy-config.component';
import { LeaveHistoryComponent } from '../common/leave-history/leave-history.component';
import { AddUserComponent } from '../common/manage-user/add-user/add-user.component';
import { EditUserComponent } from '../common/manage-user/edit-user/edit-user.component';
import { EmpPolicyListComponent } from '../common/emp-policy-list/emp-policy-list.component';
import { PolicyConfigComponent } from '../common/policy-config/policy-config.component';
import { PolicyListComponent } from '../common/policy-list/policy-list.component';
import { HrAttendanceReportComponent } from '../common/hr-attendance-report/hr-attendance-report.component';
import { HrTimesheetReportComponent } from '../common/hr-timesheet-report/hr-timesheet-report.component';


const routes: Routes = [
  { path: '', component: EmpL1Component },
  // { path: 'dashboard', component: L1DashboardComponent },
  { path: 'approve-timesheets', component: ApproveTimesheetsComponent },
  { path: 'timesheet', component: TimesheetViewComponent },
  { path: 'rejected-timesheet', component: TimesheetViewComponent },
  {path:'attendance', component:AttendenceSheetComponent},
  {path:"manage-user",component: ManageUserComponent},
  {path:"manage-project",component: ManageProjectComponent},
  {path:"holiday",component:HolidayComponent},
  {path:"report",component:ReportComponent},
  { path: "dashboard", redirectTo: "approve-timesheets", pathMatch: 'full' },
  {path:"manage-self-leaves",component: ManageSelfLeavesComponent},
  {path:"manage-team-leaves",component: ManageTeamLeavesComponent},
  {path:"leave-policy-config",component:LeavePolicyConfigComponent},
  {path:"employee-leave-info",component:EmployeeLeaveInfoComponent},
  {path:"import-export-leave",component:ImportExportLeaveComponent},
  {path:"leave-history",component:LeaveHistoryComponent},
  {path:"add-user",component: AddUserComponent},
  {path:"edit-user",component: EditUserComponent},
  {path:"document-config",component:PolicyConfigComponent},
  {path:"document-list",component:PolicyListComponent},
  {path:"emp-document-list",component:EmpPolicyListComponent},
  {path:"hr-attendance-reports",component:HrAttendanceReportComponent},
  {path:"hr-timesheet-reports",component:HrTimesheetReportComponent},
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmpL1RoutingModule { }
