import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api/v1/schedule';

  loadSchedule() {
    return this.http.get(this.base);
  }
}
