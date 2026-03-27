import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar';
import { Users } from './users/users';
import { CreateUserComponent } from './create-user-component/create-user-component';

export const routes: Routes = [
  { path: 'calendar', component: CalendarComponent },
  { path: 'users', component: Users },
  { path: 'settings', component: CreateUserComponent },
  { path: 'users/create', component: CreateUserComponent },
  { path: 'users/:id/edit', component: CreateUserComponent },
  { path: '', redirectTo: 'calendar', pathMatch: 'full' },
];
