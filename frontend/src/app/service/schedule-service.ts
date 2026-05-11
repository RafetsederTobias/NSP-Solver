import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { UserConstraint } from './user-service';

export interface SchedulePayload {
  currentMonth: number;
  currentYear: number;
  daysInMonth: number;
  keepExistingAssignments: Boolean;
  constraints: UserConstraint[];
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api/v1/schedule';

  loadSchedule(payload: SchedulePayload) {
    return this.http.post(this.base, payload);
  }
}
