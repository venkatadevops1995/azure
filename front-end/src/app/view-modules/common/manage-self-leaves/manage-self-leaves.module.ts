import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ManageSelfLeavesComponent } from './manage-self-leaves.component';
import { ButtonModule } from 'src/app/components/button/button.module';
import { MatTableModule } from '@angular/material/table';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
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
@NgModule({
  declarations: [ManageSelfLeavesComponent],
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
    NgxDaterangepickerMd.forRoot(),
    MatCheckboxModule,
    ConfirmDialogModule,
    StripTableModule,
    LeaveDetailsModule,
    FileUploadModule,
    SvgIconModule
  ],
  providers:[ 
  ]
})
export class ManageSelfLeavesModule { }
