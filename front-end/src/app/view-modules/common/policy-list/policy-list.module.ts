import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyListComponent } from './policy-list.component';
import { MatTableModule } from '@angular/material/table';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { ButtonModule } from 'src/app/components/button/button.module';
// import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { PdfViewerModule } from 'ng2-pdf-viewer';



@NgModule({
  declarations: [PolicyListComponent],
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
export class PolicyListModule { }
