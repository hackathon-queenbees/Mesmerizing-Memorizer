import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ReminderComponent } from './reminder/reminder.component';

const routes: Routes = [
  {
    path: "",
    component: HomeComponent,
  },
  {
    path: "home",
   component: HomeComponent,
  },
  {
    path: "reminder",
   component: ReminderComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {
 
 }
