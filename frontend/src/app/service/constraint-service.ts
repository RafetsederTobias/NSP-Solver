import { Injectable, signal } from '@angular/core';
import { UserConstraint } from '../service/user-service';

@Injectable({ providedIn: 'root' })
export class ConstraintsService {
  private _constraints = signal<Record<string, UserConstraint>>({});
  constraints = this._constraints.asReadonly();

  get(userId: string): UserConstraint {
    return this._constraints()[userId] ?? {
      userId,
      maxDaysPerMonth: null,
      minDaysPerMonth: null,
    };
  }

  save(c: UserConstraint) {
    this._constraints.update(map => ({ ...map, [c.userId]: c }));
  }
}