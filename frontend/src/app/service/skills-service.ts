import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface Skill {
  id: number;
  name: string;
}

type SkillPayload = Omit<Skill, 'id'>;

@Injectable({ providedIn: 'root' })
export class SkillsService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api/v1/skills';

  private _skills = signal<Skill[]>([]);
  readonly skills = this._skills.asReadonly();

  loadAll() {
    return this.http.get<Skill[]>(this.base).pipe(
      tap(skills => this._skills.set(skills))
    );
  }

  getById(id: number) {
    return this.http.get<Skill>(`${this.base}/${id}`);
  }

  add(data: SkillPayload) {
    return this.http.post<Skill>(this.base, data).pipe(
      tap(skill => this._skills.update(list => [...list, skill]))
    );
  }

  update(id: number, data: SkillPayload) {
    return this.http.put<Skill>(`${this.base}/${id}`, data).pipe(
      tap(updated => this._skills.update(list =>
        list.map(s => s.id === id ? updated : s)
      ))
    );
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this._skills.update(list => list.filter(s => s.id !== id)))
    );
  }
}