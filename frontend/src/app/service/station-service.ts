import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface Station {
  id: number;
  name: string;
  maxAssignments: number;
  skills_needed: string[];
}

type StationPayload = Omit<Station, 'id'>;

@Injectable({ providedIn: 'root' })
export class StationService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api/v1/stations';

  private _stations = signal<Station[]>([]);
  readonly stations = this._stations.asReadonly();

  loadAll() {
    return this.http
      .get<Station[]>(this.base)
      .pipe(tap((stations) => this._stations.set(stations)));
  }

  getById(id: number) {
    return this.http.get<Station>(`${this.base}/${id}`);
  }

  add(data: StationPayload) {
    return this.http
      .post<Station>(this.base, data)
      .pipe(tap((station) => this._stations.update((list) => [...list, station])));
  }

  update(id: number, data: StationPayload) {
    return this.http
      .put<Station>(`${this.base}/${id}`, data)
      .pipe(
        tap((updated) =>
          this._stations.update((list) => list.map((s) => (s.id === id ? updated : s))),
        ),
      );
  }

  delete(id: number) {
    return this.http
      .delete<void>(`${this.base}/${id}`)
      .pipe(tap(() => this._stations.update((list) => list.filter((s) => s.id !== id))));
  }
}
