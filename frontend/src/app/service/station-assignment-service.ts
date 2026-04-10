import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StationAssignment {
  id: number;
  date: string; // 'YYYY-MM-DD'
  station_id: number;
  user_id: number;
}

export interface StationAssignmentCreate {
  date: string;
  station_id: number;
  user_id: number;
}

@Injectable({ providedIn: 'root' })
export class StationAssignmentService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api/v1/station-assignments';

  getByDate(date: string): Observable<StationAssignment[]> {
    return this.http.get<StationAssignment[]>(this.base, { params: { date } });
  }

  getById(id: number): Observable<StationAssignment> {
    return this.http.get<StationAssignment>(`${this.base}/${id}`);
  }

  create(body: StationAssignmentCreate): Observable<StationAssignment> {
    return this.http.post<StationAssignment>(this.base, body);
  }

  update(id: number, body: StationAssignmentCreate): Observable<StationAssignment> {
    return this.http.patch<StationAssignment>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}