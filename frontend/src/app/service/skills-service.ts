import { Injectable, signal } from '@angular/core';

export interface Skill {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class SkillsService {
  private _skills = signal<Skill[]>([
    { id: 1, name: 'Blutabnahme' },
    { id: 2, name: 'Röntgen' },
    { id: 3, name: 'EKG' },
  ]);

  readonly skills = this._skills.asReadonly();

  getById(id: number): Skill | undefined {
    return this._skills().find((u) => u.id === id);
  }

  add(data: Omit<Skill, 'id'>): void {
    const id = Date.now();
    this._skills.update((list) => [...list, { id, ...data }]);
  }

  update(id: number, data: Omit<Skill, 'id'>): void {
    this._skills.update((list) => list.map((u) => (u.id === id ? { id, ...data } : u)));
  }

  delete(id: number): void {
    this._skills.update((list) => list.filter((u) => u.id !== id));
  }
}
