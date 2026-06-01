import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserConstraint } from './user-service';
import { tap } from 'rxjs';

export interface SchedulePayload {
  currentMonth: number;
  currentYear: number;
  daysInMonth: number;
  keepExistingAssignments: Boolean;
  newPlan: Boolean;
  alternativePlan: Boolean;
  constraints: UserConstraint[];
}

export interface Schedule {
  id: number;
  name: string;
  year: number;
  month: number;
  is_loaded: boolean;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api/v1/schedule';

  private _schedules = signal<Schedule[]>([]);
  readonly schedules = this._schedules.asReadonly();

  // creates/updates new schedule
  loadSchedule(payload: SchedulePayload) {
    return this.http.post(this.base, payload);
  }

  reschedule(payload: SchedulePayload) {
    return this.http.post(this.base + '/reschedule', payload);
  }
  loadAll() {
    return this.http
      .get<Schedule[]>(this.base + '/schedules')
      .pipe(tap((schedules) => this._schedules.set(schedules)));
  }

  // loads schedule for calendar
  load(scheduleId: number) {
    return this.http.patch<Schedule>(`${this.base}/schedules/${scheduleId}/load`, {}).pipe(
      tap((updated) =>
        this._schedules.update((list) =>
          list.map((s) => {
            if (s.year === updated.year && s.month === updated.month) {
              return s.id === updated.id ? updated : { ...s, is_loaded: false };
            }
            return s;
          }),
        ),
      ),
    );
  }
  readonly loadedSchedules = computed(() => this._schedules().filter((s) => s.is_loaded));
}
