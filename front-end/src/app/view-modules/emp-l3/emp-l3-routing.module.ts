import { ApproveTimesheetsComponent } from './../common/approve-timesheets/approve-timesheets.component';
import { L3DashboardComponent } from './l3-dashboard/l3-dashboard.component';
import { EmpL3Component } from './emp-l3.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TimesheetViewComponent } from '../common/timesheet-view/timesheet-view.component';
import { L2DashboardComponent } from '../emp-l2/l2-dashboard/l2-dashboard.component';
import { AttendenceSheetComponent } from '../common/attendence-sheet/attendence-sheet.component';
import { ManageUserComponent} from '../common/manage-user/manage-user.component';
import { ManageProjectComponent } from '../common/manage-project/manage-project.component';
import { ManageSelfLeavesComponent } from '../common/manage-self-leaves/manage-self-leaves.component';
import { EmployeeLeaveInfoComponent } from '../common/employee-leave-info/employee-leave-info.component';
import { LeavePolicyConfigComponent } from '../common/leave-policy-config/leave-policy-config.component';
import { ManageTeamLeavesComponent } from '../common/manage-team-leaves/manage-team-leaves.component';
import { HolidayComponent } from '../common/holiday/holiday.component';
import { AddUserComponent } from '../common/manage-user/add-user/add-user.component';
import { EditUserComponent } from '../common/manage-user/edit-user/edit-user.component';
import { ImportExportLeaveComponent } from '../common/import-export-leave/import-export-leave.component';
import { ReportComponent } from '../common/report/report.component';
import { LeaveHistoryComponent } from '../common/leave-history/leave-history.component';


const routes: Routes = [
  { path: '', component: EmpL3Component },
  { path: 'history-dashboard', component: L2DashboardComponent }, 
  { path: 'approve-timesheets', component: ApproveTimesheetsComponent }, 
  { path: 'timesheet', component: TimesheetViewComponent }, 
  { path: 'rejected-timesheet', component: TimesheetViewComponent },
  {path:'attendance', component:AttendenceSheetComponent},
  {path:"manage-user",component: ManageUserComponent},
  {path:"add-user",component: AddUserComponent},
  {path:"edit-user",component: EditUserComponent},
  {path:"manage-project",component: ManageProjectComponent},
  {path:"employee-leave-info",component:EmployeeLeaveInfoComponent},
  {path:"manage-self-leaves",component: ManageSelfLeavesComponent},
  {path:"manage-team-leaves",component: ManageTeamLeavesComponent},
  {path:"leave-policy-config",component:LeavePolicyConfigComponent},
  {path:"holiday",component:HolidayComponent},
  {path:"import-export-leave",component:ImportExportLeaveComponent},
  {path:"report",component:ReportComponent},
  {path:"leave-history",component:LeaveHistoryComponent},
  {path:"dashboard",redirectTo:"history-dashboard",pathMatch:'full'},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmpL3RoutingModule { }
