import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageProjectComponent } from './manage-project.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ButtonModule } from 'src/app/components/button/button.module';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';


@NgModule({
  declarations: [ManageProjectComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    ButtonModule,
    MatSelectModule,
    ModalPopupModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule,
    SvgIconModule,
    FileDownloadModule,
    TooltipModule,
    MatAutocompleteModule
  ]
})
export class ManageProjectModule { }
