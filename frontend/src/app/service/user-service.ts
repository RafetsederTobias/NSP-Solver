import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  skills: string[];
}

export interface UserConstraint {
  userId: number;
  maxDaysPerMonth: number | null;
  minDaysPerMonth: number | null;
  exactDaysPerMonth: number;
}

type UserPayload = Omit<User, 'id'>;

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api/v1/users';

  private _users = signal<User[]>([]);
  readonly users = this._users.asReadonly();

  loadAll() {
    return this.http.get<User[]>(this.base).pipe(tap((users) => this._users.set(users)));
  }
  add(data: UserPayload) {
    return this.http
      .post<User>(this.base, data)
      .pipe(tap((user) => this._users.update((list) => [...list, user])));
  }

  getById(id: number) {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  update(id: number, data: UserPayload) {
    return this.http
      .put<User>(`${this.base}/${id}`, data)
      .pipe(
        tap((updated) =>
          this._users.update((list) => list.map((u) => (u.id === id ? updated : u))),
        ),
      );
  }

  delete(id: number) {
    return this.http
      .delete<void>(`${this.base}/${id}`)
      .pipe(tap(() => this._users.update((list) => list.filter((u) => u.id !== id))));
  }
}
