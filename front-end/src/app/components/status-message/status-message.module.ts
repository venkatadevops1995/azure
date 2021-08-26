import { MatIconModule } from '@angular/material/icon';
// import { SvgIconModule } from './../../directives/svg-icon/svg-icon.module';
import { StatusMessageComponent } from './status-message.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
@NgModule({
    declarations: [
     StatusMessageComponent
    ],
    imports:[
     CommonModule, RouterModule, MatIconModule
    ],
    exports:[
    StatusMessageComponent
    ]
})
export class StatusMessageModule{
}