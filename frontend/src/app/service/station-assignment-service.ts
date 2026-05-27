import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface StationAssignment {
  id: number;
  date: string; // 'YYYY-MM-DD'
  station_id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
  };
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

  /*loadAll(): Observable<StationAssignment[]> {
    return this.http.get<StationAssignment[]>(`${this.base}/all`);
  }*/

  private _assignments = signal<StationAssignment[]>([]);
  readonly assignments = this._assignments.asReadonly();

  loadAll() {
    return this.http
      .get<StationAssignment[]>(`${this.base}/all`)
      .pipe(tap((assignments) => this._assignments.set(assignments)));
  }

  getByDate(date: string): Observable<StationAssignment[]> {
    return this.http.get<StationAssignment[]>(this.base, { params: { date } });
  }
// not used
  getById(id: number): Observable<StationAssignment> {
    return this.http.get<StationAssignment>(`${this.base}/${id}`);
  }
// not used
  create(body: StationAssignmentCreate): Observable<StationAssignment> {
    return this.http.post<StationAssignment>(this.base, body);
  }
// not used
  update(id: number, body: StationAssignmentCreate): Observable<StationAssignment> {
    return this.http.patch<StationAssignment>(`${this.base}/${id}`, body);
  }
// not used
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
  replaceAll(
    date: string,
    assignments: StationAssignmentCreate[],
  ): Observable<StationAssignment[]> {
    return this.http.put<StationAssignment[]>(`${this.base}/replace/${date}`, assignments);
  }
}
