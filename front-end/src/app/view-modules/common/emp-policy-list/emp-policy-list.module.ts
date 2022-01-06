import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpPolicyListComponent } from './emp-policy-list.component';
import { MatTableModule } from '@angular/material/table';
import { PdfViewerModule } from 'ng2-pdf-viewer';
// import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { ButtonModule } from 'src/app/components/button/button.module';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';



@NgModule({
  declarations: [EmpPolicyListComponent],
  imports: [
    CommonModule,
    MatTableModule,
    SvgIconModule,
    ModalPopupModule,
    ButtonModule,
    // NgxDocViewerModule,
    PdfViewerModule
  ]
})
export class EmpPolicyListModule { }
