import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ManageSelfLeavesComponent } from './manage-self-leaves.component';
import { ButtonModule } from 'src/app/components/button/button.module';
import { MatTableModule } from '@angular/material/table'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {MatRadioModule} from '@angular/material/radio';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { ConfirmDialogModule } from 'src/app/components/confirm-dialog/confirm-dialog.module'; 
import { StripTableModule } from 'src/app/components/strip-table/strip-table.module';
import { LeaveDetailsModule } from 'src/app/components/leave-details/leave-details.module';
import { FileUploadModule } from 'src/app/components/input-file/input-file.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import { PopUpModule } from 'src/app/components/pop-up/pop-up.module';
import { MatTabsModule } from '@angular/material/tabs';
import { ApplyLeaveComponent } from './apply-leave/apply-leave.component';
@NgModule({
  declarations: [ManageSelfLeavesComponent, ApplyLeaveComponent],
  imports: [
    CommonModule,
    ButtonModule,
    MatTableModule,
    FormsModule,
    ModalPopupModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule, 
    MatCheckboxModule,
    ConfirmDialogModule,
    StripTableModule,
    LeaveDetailsModule,
    FileUploadModule,
    SvgIconModule,
    AtaiDateRangeModule,
    PopUpModule,
    MatTabsModule
  ],
  providers:[ 
  ]
})
export class ManageSelfLeavesModule { }
