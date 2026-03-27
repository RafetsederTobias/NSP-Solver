import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar';
import { Users } from './users/users';

export const routes: Routes = [
  { path: 'calendar', component: CalendarComponent },
  { path: 'users', component: Users },
  { path: 'settings', component: CalendarComponent },
  { path: '', redirectTo: 'calendar', pathMatch: 'full' }
];
