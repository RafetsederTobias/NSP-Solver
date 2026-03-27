import { Injectable, signal } from '@angular/core';

export interface User {
  id: number;
  name: string;
  kompetenzen: string[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private _users = signal<User[]>([
    { id: 1, name: 'John Doe', kompetenzen: ['Angular', 'TypeScript', 'RxJS'] },
    { id: 2, name: 'Jane Smith', kompetenzen: ['UX Design', 'Figma'] },
  ]);

  readonly users = this._users.asReadonly();

  getById(id: number): User | undefined {
    return this._users().find(u => u.id === id);
  }

  add(data: Omit<User, 'id'>): void {
    const id = Date.now();
    this._users.update(list => [...list, { id, ...data }]);
  }

  update(id: number, data: Omit<User, 'id'>): void {
    this._users.update(list =>
      list.map(u => u.id === id ? { id, ...data } : u)
    );
  }

  delete(id: number): void {
    this._users.update(list => list.filter(u => u.id !== id));
  }
}