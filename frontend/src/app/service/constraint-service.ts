import { Injectable, signal } from '@angular/core';
import { UserConstraint } from '../service/user-service';

@Injectable({ providedIn: 'root' })
export class ConstraintsService {
  private _constraints = signal<Record<string, UserConstraint>>({});
  constraints = this._constraints.asReadonly();

  private _spontaneousMissingDays = signal<Record<string, number[]>>({});
  spontaneousMissingDays = this._spontaneousMissingDays.asReadonly();

  get(userId: string, defaultExactDays?: number): UserConstraint {
    return (
      this._constraints()[userId] ?? {
        userId,
        exactDaysPerMonth: defaultExactDays ?? null,
        maxDaysPerMonth: null,
        minDaysPerMonth: null,
      }
    );
  }

  save(c: UserConstraint) {
    this._constraints.update((map) => ({ ...map, [c.userId]: c }));
  }

  getMissingDays(userId: string): number[] {
    return this._spontaneousMissingDays()[userId] ?? [];
  }

  saveMissingDays(userId: string, days: number[]) {
    this._spontaneousMissingDays.update((map) => ({ ...map, [userId]: days }));
  }
}