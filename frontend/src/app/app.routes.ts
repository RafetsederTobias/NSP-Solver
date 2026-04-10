import { Routes } from '@angular/router';
import { CalendarComponent } from './components/calendar/calendar';
import { Users } from './components/users/users';
import { CreateUserComponent } from './components/create-user-component/create-user-component';
import { Stations } from './components/stations/stations';
import { CreateStationComponent } from './components/create-station/create-station';
import { Skills } from './components/skills/skills';
import { DayDetailComponent } from './components/day-detail-component/day-detail-component';

export const routes: Routes = [
  { path: 'calendar', component: CalendarComponent },
  { path: 'users', component: Users },
  { path: 'stations', component: Stations },
  { path: 'skills', component: Skills },
  { path: 'users/create', component: CreateUserComponent },
  { path: 'users/:id/edit', component: CreateUserComponent },
  { path: 'stations/:id/edit', component: CreateStationComponent },
  { path: 'stations/create', component: CreateStationComponent },
  { path: 'calendar/:assignment', component: DayDetailComponent },
  { path: '', redirectTo: 'calendar', pathMatch: 'full' },
];
