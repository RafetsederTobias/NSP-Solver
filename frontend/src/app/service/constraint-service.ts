import { Injectable, signal } from '@angular/core';
import { UserConstraints } from '../service/user-service';

@Injectable({ providedIn: 'root' })
export class ConstraintsService {
  private _constraints = signal<Record<string, UserConstraints>>({});
  constraints = this._constraints.asReadonly();

  get(userId: string): UserConstraints {
    return this._constraints()[userId] ?? {
      userId,
      maxDaysPerMonth: null,
      minDaysPerMonth: null,
    };
  }

  save(c: UserConstraints) {
    this._constraints.update(map => ({ ...map, [c.userId]: c }));
  }
}