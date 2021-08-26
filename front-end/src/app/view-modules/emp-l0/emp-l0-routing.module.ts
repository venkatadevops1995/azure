import { L0TimesheetComponent } from './l0-timesheet/l0-timesheet.component';
import { EmpL0Component } from './emp-l0.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { L0DashboardComponent } from './l0-dashboard/l0-dashboard.component';
import { TimesheetViewComponent } from '../common/timesheet-view/timesheet-view.component';
import { AttendenceSheetComponent } from '../common/attendence-sheet/attendence-sheet.component';
import { ManageSelfLeavesComponent } from '../common/manage-self-leaves/manage-self-leaves.component';
import { HolidayComponent } from '../common/holiday/holiday.component';
import { ReportComponent } from '../common/report/report.component';
import { LeavePolicyConfigComponent } from '../common/leave-policy-config/leave-policy-config.component';
import { EmployeeLeaveInfoComponent } from '../common/employee-leave-info/employee-leave-info.component';
import { ImportExportLeaveComponent } from '../common/import-export-leave/import-export-leave.component';
import { LeaveHistoryComponent } from '../common/leave-history/leave-history.component';
import { AddUserComponent } from '../common/manage-user/add-user/add-user.component';
import { EditUserComponent } from '../common/manage-user/edit-user/edit-user.component';
import { ManageUserComponent } from '../common/manage-user/manage-user.component';
import { ManageProjectComponent } from '../common/manage-project/manage-project.component';


const routes: Routes = [
  { path: '', component: EmpL0Component },
  { path: 'timesheet', component: TimesheetViewComponent },
  { path: 'rejected-timesheet', component: TimesheetViewComponent },
  {path:'attendance', component:AttendenceSheetComponent},
  {path:"holiday",component:HolidayComponent},
  {path:"report",component:ReportComponent},
  {path:"dashboard",redirectTo:"timesheet",pathMatch:'full'},
  {path:"manage-self-leaves",component: ManageSelfLeavesComponent},
  {path:"leave-policy-config",component:LeavePolicyConfigComponent},
  {path:"employee-leave-info",component:EmployeeLeaveInfoComponent},
  {path:"import-export-leave",component:ImportExportLeaveComponent},
  {path:"leave-history",component:LeaveHistoryComponent},
  {path:"manage-user",component: ManageUserComponent},
  {path:"add-user",component: AddUserComponent},
  {path:"edit-user",component: EditUserComponent},
  {path:"manage-project",component: ManageProjectComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmpL0RoutingModule { }
