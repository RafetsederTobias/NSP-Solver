import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserConstraint } from '../../service/user-service';
import { WorkdayService } from '../../service/workday-service';
import { CalendarGridComponent, CalendarGridSelection } from '../calendar-grid/calendar-grid';

export interface UserConstraintsDialogData {
  user: { id: string; name: string };
  constraints: UserConstraint;
  currentDate: Date;
}

type DayMode = 'fulltime' | 'exact' | 'minmax';
type CalendarMode = 'fixed' | 'blocked';

@Component({
  selector: 'app-user-constraints-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarGridComponent],
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 20, 35, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
      }
      .dialog {
        background: white;
        border-radius: 16px;
        width: 360px;
        border: 0.5px solid #e2e8f0;
        overflow: hidden;
      }
      .header {
        padding: 1.25rem 1.5rem 1rem;
        border-bottom: 0.5px solid #f1f5f9;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .body {
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow-y: auto;
        max-height: calc(90vh - 130px);
      }
      .footer {
        padding: 1rem 1.5rem;
        border-top: 0.5px solid #f1f5f9;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        flex-shrink: 0;
      }
      .section-label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
        margin-bottom: 10px;
      }
      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .radio-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 8px;
        border: 0.5px solid transparent;
        cursor: pointer;
        transition: background 0.1s;
      }
      .radio-row:hover {
        background: #f8fafc;
        border-color: #f1f5f9;
      }
      .radio-row.active {
        background: #eef2ff;
        border-color: #c7d2fe;
      }
      .radio-row input[type='radio'] {
        accent-color: #6366f1;
        width: 14px;
        height: 14px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .radio-label {
        font-size: 13px;
        color: #1e293b;
        flex: 1;
      }
      .radio-hint {
        font-size: 11px;
        color: #94a3b8;
      }
      .or-divider {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 2px 0;
      }
      .or-divider::before,
      .or-divider::after {
        content: '';
        flex: 1;
        height: 0.5px;
        background: #f1f5f9;
      }
      .or-label {
        font-size: 11px;
        color: #cbd5e1;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .inline-input-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
        margin-top: 2px;
      }
      input[type='number'] {
        width: 64px;
        text-align: center;
        padding: 0.3rem 0.5rem;
        font-size: 13px;
        border-radius: 8px;
        border: 0.5px solid #cbd5e1;
        background: white;
        color: #1e293b;
        transition: opacity 0.15s;
      }
      input[type='number']:disabled {
        opacity: 0.35;
        cursor: not-allowed;
        background: #f8fafc;
      }
      .btn-ghost {
        padding: 0.4rem 1rem;
        border-radius: 8px;
        border: 0.5px solid #cbd5e1;
        background: transparent;
        font-size: 13px;
        color: #64748b;
        cursor: pointer;
      }
      .btn-ghost:hover {
        background: #f8fafc;
      }
      .btn-primary {
        padding: 0.4rem 1rem;
        border-radius: 8px;
        border: none;
        background: #6366f1;
        color: white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }
      .btn-primary:hover {
        background: #4f46e5;
      }
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #eef2ff;
        color: #4f46e5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 500;
        flex-shrink: 0;
      }
      .divider {
        height: 0.5px;
        background: #f1f5f9;
      }
    `,
  ],
  template: `
    <div class="overlay" (click)="onBackdropClick($event)">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar">{{ initials }}</div>
            <div>
              <div style="font-size:15px;font-weight:500;color:#1e293b;">{{ data.user.name }}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Spontaner Ausfall</div>
            </div>
          </div>
          <button class="btn-ghost" style="padding:0.2rem 0.5rem;" (click)="close()">✕</button>
        </div>

        <div class="body">
          <div>
            <div>
              <div class="section-label">Verfügbarkeit</div>

              <app-calendar-grid
                [currentDate]="data.currentDate"
                [modes]="['blocked']"
                [blockedDays]="draft.blockedDays ?? []"
                (selectionChange)="onCalendarChange($event)"
              />

              <div class="footer">
                <button class="btn-ghost" (click)="close()">Abbrechen</button>
                <button class="btn-primary" (click)="save()">Speichern</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RescheduleConstraintDialogComponent {
  dialogRef = inject(DialogRef);
  data: UserConstraintsDialogData = inject(DIALOG_DATA);
  private workdayService = inject(WorkdayService);

  draft: UserConstraint = {
    ...this.data.constraints,
    fixedDays: [...(this.data.constraints.fixedDays ?? [])],
    blockedDays: [...(this.data.constraints.blockedDays ?? [])],
  };

  mode: DayMode = this.inferMode();

  get initials() {
    return this.data.user.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get workdays(): number {
    return this.workdayService.countWorkdays(this.data.currentDate);
  }

  get workedaysLabel(): string {
    return `${this.workdays} Tage`;
  }

  private inferMode(): DayMode {
    const c = this.data.constraints;
    const workdays = this.workdayService.countWorkdays(this.data.currentDate);
    if (c.exactDaysPerMonth != null && c.exactDaysPerMonth !== workdays) return 'exact';
    if (c.maxDaysPerMonth != null || c.minDaysPerMonth != null) return 'minmax';
    return 'fulltime';
  }
  onModeChange() {
    this.draft.exactDaysPerMonth = null as any;
    this.draft.maxDaysPerMonth = null as any;
    this.draft.minDaysPerMonth = null as any;
    if (this.mode === 'fulltime') {
      this.draft.exactDaysPerMonth = this.workdays;
    }
    this.trimFixedDaysTocap();
  }

  onExactDaysChange() {
    this.trimFixedDaysTocap();
  }

  /* Max allowed fixed days ( null means no cap) */
  get fixedCap(): number | null {
    if (this.mode === 'fulltime') return this.workdays;
    if (this.mode === 'exact' && this.draft.exactDaysPerMonth != null)
      return this.draft.exactDaysPerMonth;
    return null;
  }

  get fixedAtCap(): boolean {
    return this.fixedCap != null && (this.draft.fixedDays?.length ?? 0) >= this.fixedCap;
  }

  private trimFixedDaysTocap() {
    const cap = this.fixedCap;
    if (cap != null && (this.draft.fixedDays?.length ?? 0) > cap) {
      this.draft.fixedDays = this.draft.fixedDays!.slice(0, cap);
    }
  }

  onCalendarChange(sel: CalendarGridSelection) {
    this.draft.fixedDays = sel.fixedDays;
    this.draft.blockedDays = sel.blockedDays;
  }

  save() {
    if (this.mode === 'fulltime') {
      this.draft.exactDaysPerMonth = this.workdays;
    }
    this.dialogRef.close(this.draft);
  }

  onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close();
  }

  close() {
    this.dialogRef.close(null);
  }
}
