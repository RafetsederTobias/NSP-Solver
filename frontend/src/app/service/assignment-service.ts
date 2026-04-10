import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { User } from './user-service';

export interface Assignment {
  id: number;
  date: string;
  users: string[];
}

type AssignmentPayload = Omit<Assignment, 'id'>;

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api/v1/assignments';

  private _assignments = signal<Assignment[]>([]);
  readonly assignments = this._assignments.asReadonly();

  loadAll() {
    return this.http
      .get<Assignment[]>(this.base)
      .pipe(tap((assignments) => this._assignments.set(assignments)));
  }

  loadByDate(date: string) {
    return this.http.get<Assignment[]>(`${this.base}/by-date/${date}`);
  }

  getById(id: number) {
    return this.http.get<Assignment>(`${this.base}/${id}`);
  }

  add(data: AssignmentPayload) {
    return this.http
      .post<Assignment>(this.base, data)
      .pipe(tap((assignment) => this._assignments.update((list) => [...list, assignment])));
  }

  update(id: number, data: AssignmentPayload) {
    return this.http
      .put<Assignment>(`${this.base}/${id}`, data)
      .pipe(
        tap((updated) =>
          this._assignments.update((list) => list.map((a) => (a.id === id ? updated : a))),
        ),
      );
  }

  delete(id: number) {
    return this.http
      .delete<void>(`${this.base}/${id}`)
      .pipe(tap(() => this._assignments.update((list) => list.filter((a) => a.id !== id))));
  }

  getUsersByDate(date: string) {
    return this.http.get<User[]>(`${this.base}/by-date/${date}/users`);
  }
}
