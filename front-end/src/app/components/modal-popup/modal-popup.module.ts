import { ButtonModule } from './../button/button.module';
import { MatIconModule } from '@angular/material/icon';
// import { SvgIconModule } from './../../directives/svg-icon/svg-icon.module';
import { ModalPopupComponent } from './modal-popup.component';
//import { PipesModule } from './../../pipes/pipes.module';
//import { UtilitiesModule } from './../utilities.module'; 
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
// import { ScrollBarModule } from '../scroll-bar/scroll-bar.module';

@NgModule({
    declarations: [
        ModalPopupComponent
    ],
    imports: [
        //PipesModule,
        CommonModule, RouterModule,  
        SvgIconModule,
        ButtonModule
    ],
    exports: [
        ModalPopupComponent
    ]
})
export class ModalPopupModule {
}