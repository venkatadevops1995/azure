import { AnimationsService } from './services/animations.service';
import { AuthInterceptor } from './services/auth-interceptor';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { ButtonModule } from './components/button/button.module';
import { AuthGuardService } from './services/auth-guard.service';
import { HttpClientService } from 'src/app/services/http-client.service';
import { StatusMessageComponent } from './components/status-message/status-message.component';
import { LoaderComponent } from './components/loader/loader.component';
import { SvgComponent } from './layout/svg/svg.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UserService } from './services/user.service';
import { WindowReferenceService } from './services/window-reference.service';
import { SingletonService } from './services/singleton.service';
import { XhrProgressService } from './services/xhr-progress.service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ButtonComponent } from './components/button/button.component';
import { ModalPopupModule } from './components/modal-popup/modal-popup.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {DatePipe} from '@angular/common';
import { ConfigGridComponent } from './components/config-grid/config-grid.component'; 
import { ConfirmDialogModule } from './components/confirm-dialog/confirm-dialog.module'; 
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HeaderSearchModule } from './components/header-search/header-search.module';
import { AddProjectComponent } from './view-modules/common/add-project/add-project.component';

@NgModule({
  declarations: [
    AppComponent,
    SvgComponent,
    LoaderComponent,
    StatusMessageComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent ,
    ProgressBarComponent,
    ConfigGridComponent,
    AddProjectComponent,
  ],
  imports: [
    BrowserModule,  
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ButtonModule,
    SvgIconModule,
    ModalPopupModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    HeaderSearchModule,
    // InputTextModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSelectModule,
    ConfirmDialogModule,
    FileDownloadModule
  ],
  providers: [
    HttpClientService,
    UserService,
    AuthGuardService,
    WindowReferenceService,
    SingletonService,
    AnimationsService,
    XhrProgressService,
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
