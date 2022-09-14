import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TestComponent } from './test/test.component';
import { environment } from "../environments/environment";
import { AngularFireModule } from '@angular/fire';
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { NavbarcomponentComponent } from './navbarcomponent.component';
import { ReminderComponent } from './reminder/reminder.component';
import { NgxSpinnerModule } from "ngx-spinner";  
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [
    AppComponent,
    TestComponent,
    HomeComponent,
    NavbarcomponentComponent,
    ReminderComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.FireBaseConfig),
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    ToastrModule.forRoot()
  ],
  providers: [{provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'fill'}}],
  bootstrap: [AppComponent]
})
export class AppModule { }
