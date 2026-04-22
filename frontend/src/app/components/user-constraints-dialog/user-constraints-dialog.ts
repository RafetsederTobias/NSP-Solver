import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserConstraint } from '../../service/user-service';

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
  imports: [CommonModule, FormsModule],
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(15,20,35,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1100; }
    .dialog { background: white; border-radius: 16px; width: 360px;
      border: 0.5px solid #e2e8f0; overflow: hidden; }
    .header { padding: 1.25rem 1.5rem 1rem; border-bottom: 0.5px solid #f1f5f9;
      display: flex; align-items: flex-start; justify-content: space-between; }
    .body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem;
      overflow-y: auto; max-height: calc(90vh - 130px); }
    .footer { padding: 1rem 1.5rem; border-top: 0.5px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 8px; flex-shrink: 0; }
    .section-label { font-size: 11px; font-weight: 500; text-transform: uppercase;
      letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 10px; }
    .radio-group { display: flex; flex-direction: column; gap: 6px; }
    .radio-row { display: flex; align-items: center; gap: 8px; padding: 7px 10px;
      border-radius: 8px; border: 0.5px solid transparent; cursor: pointer; transition: background 0.1s; }
    .radio-row:hover { background: #f8fafc; border-color: #f1f5f9; }
    .radio-row.active { background: #eef2ff; border-color: #c7d2fe; }
    .radio-row input[type=radio] { accent-color: #6366f1; width: 14px; height: 14px; cursor: pointer; flex-shrink: 0; }
    .radio-label { font-size: 13px; color: #1e293b; flex: 1; }
    .radio-hint { font-size: 11px; color: #94a3b8; }
    .or-divider { display: flex; align-items: center; gap: 10px; margin: 2px 0; }
    .or-divider::before, .or-divider::after { content: ''; flex: 1; height: 0.5px; background: #f1f5f9; }
    .or-label { font-size: 11px; color: #cbd5e1; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
    .inline-input-row { display: flex; align-items: center; justify-content: space-between;
      padding: 0 10px; margin-top: 2px; }
    input[type=number] { width: 64px; text-align: center; padding: 0.3rem 0.5rem;
      font-size: 13px; border-radius: 8px; border: 0.5px solid #cbd5e1;
      background: white; color: #1e293b; transition: opacity 0.15s; }
    input[type=number]:disabled { opacity: 0.35; cursor: not-allowed; background: #f8fafc; }
    .btn-ghost { padding: 0.4rem 1rem; border-radius: 8px; border: 0.5px solid #cbd5e1;
      background: transparent; font-size: 13px; color: #64748b; cursor: pointer; }
    .btn-ghost:hover { background: #f8fafc; }
    .btn-primary { padding: 0.4rem 1rem; border-radius: 8px; border: none;
      background: #6366f1; color: white; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary:hover { background: #4f46e5; }
    .avatar { width: 28px; height: 28px; border-radius: 50%; background: #eef2ff;
      color: #4f46e5; display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 500; flex-shrink: 0; }
    .divider { height: 0.5px; background: #f1f5f9; }

    /* Calendar */
    .cal-tabs { display: flex; gap: 6px; margin-bottom: 10px; }
    .cal-tab { flex: 1; padding: 6px 0; border-radius: 8px; border: 0.5px solid #e2e8f0;
      background: transparent; font-size: 12px; color: #64748b; cursor: pointer;
      font-weight: 500; transition: all 0.1s; }
    .cal-tab.active-fixed { background: #eef2ff; border-color: #c7d2fe; color: #4338ca; }
    .cal-tab.active-blocked { background: #fff1f2; border-color: #fecdd3; color: #be123c; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
    .cal-dow { text-align: center; font-size: 10px; font-weight: 500; color: #cbd5e1;
      padding-bottom: 4px; text-transform: uppercase; }
    .cal-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      border-radius: 6px; font-size: 12px; color: #1e293b; cursor: pointer;
      border: 0.5px solid transparent; transition: all 0.1s; user-select: none; }
    .cal-day:hover:not(.empty):not(.weekend):not(.blocked-by-other) { background: #f1f5f9; }
    .cal-day.empty { pointer-events: none; }
    .cal-day.weekend { color: #cbd5e1; pointer-events: none; }
    .cal-day.selected-fixed { background: #eef2ff; border-color: #c7d2fe; color: #4338ca; font-weight: 600; }
    .cal-day.selected-blocked { background: #fff1f2; border-color: #fecdd3; color: #be123c; font-weight: 600; }
    .cal-day.blocked-by-other { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
    .cal-legend { display: flex; gap: 12px; margin-top: 8px; }
    .cal-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #94a3b8; }
    .cal-legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
    .cal-cap-hint { font-size: 11px; color: #94a3b8; text-align: right; margin-top: 4px; }
    .cal-cap-hint.at-cap { color: #f59e0b; }
  `],
  template: `
    <div class="overlay" (click)="onBackdropClick($event)">
      <div class="dialog" (click)="$event.stopPropagation()">

        <div class="header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar">{{ initials }}</div>
            <div>
              <div style="font-size:15px;font-weight:500;color:#1e293b;">{{ data.user.name }}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Einschränkungen definieren</div>
            </div>
          </div>
          <button class="btn-ghost" style="padding:0.2rem 0.5rem;" (click)="close()">✕</button>
        </div>

        <div class="body">

          <div>
            <div class="section-label">Schichten</div>
            <div class="radio-group">

              <label class="radio-row" [class.active]="mode === 'fulltime'">
                <input type="radio" name="dayMode" value="fulltime"
                       [(ngModel)]="mode" (ngModelChange)="onModeChange()">
                <span class="radio-label">Vollzeit</span>
                <span class="radio-hint">{{ workedaysLabel }}</span>
              </label>

              <label class="radio-row" [class.active]="mode === 'exact'">
                <input type="radio" name="dayMode" value="exact"
                       [(ngModel)]="mode" (ngModelChange)="onModeChange()">
                <span class="radio-label">Genau X Tage / Monat</span>
              </label>
              @if (mode === 'exact') {
                <div class="inline-input-row">
                  <span style="font-size:12px;color:#94a3b8;">Anzahl Tage</span>
                  <input type="number" [(ngModel)]="draft.exactDaysPerMonth"
                         (ngModelChange)="onExactDaysChange()"
                         min="0" max="23" placeholder="—">
                </div>
              }

              <div class="or-divider"><span class="or-label">oder</span></div>

              <label class="radio-row" [class.active]="mode === 'minmax'">
                <input type="radio" name="dayMode" value="minmax"
                       [(ngModel)]="mode" (ngModelChange)="onModeChange()">
                <span class="radio-label">Min. / Max. Tage / Monat</span>
              </label>
              @if (mode === 'minmax') {
                <div class="inline-input-row">
                  <span style="font-size:12px;color:#94a3b8;">Max. Tage</span>
                  <input type="number" [(ngModel)]="draft.maxDaysPerMonth" min="0" max="23" placeholder="—">
                </div>
                <div class="inline-input-row" style="margin-top:6px;">
                  <span style="font-size:12px;color:#94a3b8;">Min. Tage</span>
                  <input type="number" [(ngModel)]="draft.minDaysPerMonth" min="0" max="23" placeholder="—">
                </div>
              }

            </div>
          </div>

          <div class="divider"></div>

          <div>
            <div class="section-label">Verfügbarkeit</div>

            <div class="cal-tabs">
              <button class="cal-tab" [class.active-fixed]="calMode === 'fixed'"
                      (click)="calMode = 'fixed'">
                 Diese Tage fix
                @if (draft.fixedDays?.length) {
                  <span style="margin-left:4px;opacity:0.7;">({{ draft.fixedDays!.length }})</span>
                }
              </button>
              <button class="cal-tab" [class.active-blocked]="calMode === 'blocked'"
                      (click)="calMode = 'blocked'">
                 An diesen Tagen nicht
                @if (draft.blockedDays?.length) {
                  <span style="margin-left:4px;opacity:0.7;">({{ draft.blockedDays!.length }})</span>
                }
              </button>
            </div>

            <!-- Cap hint for fixed days -->
            @if (calMode === 'fixed' && fixedCap != null) {
              <div class="cal-cap-hint" [class.at-cap]="fixedAtCap">
                {{ draft.fixedDays?.length ?? 0 }} / {{ fixedCap }} Tage ausgewählt
              </div>
            }

            <!-- Calendar grid -->
            <div class="cal-grid" style="margin-top:6px;">
              @for (dow of dows; track dow) {
                <div class="cal-dow">{{ dow }}</div>
              }
              @for (cell of calendarCells; track $index) {
                <div class="cal-day"
                     [class.empty]="cell === null"
                     [class.weekend]="cell !== null && isWeekend(cell)"
                     [class.selected-fixed]="cell !== null && isFixed(cell)"
                     [class.selected-blocked]="cell !== null && isBlocked(cell)"
                     [class.blocked-by-other]="cell !== null && isBlockedByOther(cell)"
                     (click)="cell !== null && toggleDay(cell)">
                  {{ cell ?? '' }}
                </div>
              }
            </div>

            <div class="cal-legend">
              <div class="cal-legend-item">
                <div class="cal-legend-dot" style="background:#eef2ff;border:0.5px solid #c7d2fe;"></div>
                Fix
              </div>
              <div class="cal-legend-item">
                <div class="cal-legend-dot" style="background:#fff1f2;border:0.5px solid #fecdd3;"></div>
                Nicht verfügbar
              </div>
            </div>
          </div>

        </div>

        <div class="footer">
          <button class="btn-ghost" (click)="close()">Abbrechen</button>
          <button class="btn-primary" (click)="save()">Speichern</button>
        </div>

      </div>
    </div>
  `,
})
export class UserConstraintsDialogComponent {
  dialogRef = inject(DialogRef);
  data: UserConstraintsDialogData = inject(DIALOG_DATA);

  draft: UserConstraint = {
    ...this.data.constraints,
    fixedDays: [...(this.data.constraints.fixedDays ?? [])],
    blockedDays: [...(this.data.constraints.blockedDays ?? [])],
  };

  mode: DayMode = this.inferMode();
  calMode: CalendarMode = 'fixed';

  readonly dows = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  get initials() {
    return this.data.user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }


  get workdays(): number {
    return this.countWorkdays(this.data.currentDate);
  }

  get workedaysLabel(): string {
    return `${this.workdays} Tage`;
  }

  private countWorkdays(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0 && day !== 6) count++;
    }
    return count;
  }

  private inferMode(): DayMode {
    const c = this.data.constraints;
    if (c.exactDaysPerMonth != null) return 'exact';
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

  /* Max allowed fixed days — null means no cap */
  get fixedCap(): number | null {
    if (this.mode === 'fulltime') return this.workdays;
    if (this.mode === 'exact' && this.draft.exactDaysPerMonth != null) return this.draft.exactDaysPerMonth;
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

  // Calendar

  /* Cells for the month grid */
  get calendarCells(): (number | null)[] {
    const date = this.data.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // getDay() returns 0=Sun..6=Sat; convert to Mon-first (0=Mon..6=Sun)
    let firstDow = new Date(year, month, 1).getDay();
    firstDow = firstDow === 0 ? 6 : firstDow - 1;
    const cells: (number | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  private isoDate(day: number): string {
    const d = this.data.currentDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  isWeekend(day: number): boolean {
    const dow = new Date(this.data.currentDate.getFullYear(), this.data.currentDate.getMonth(), day).getDay();
    return dow === 0 || dow === 6;
  }

  isFixed(day: number): boolean {
    return this.draft.fixedDays?.includes(this.isoDate(day)) ?? false;
  }

  isBlocked(day: number): boolean {
    return this.draft.blockedDays?.includes(this.isoDate(day)) ?? false;
  }

  /* dim day that is selected */
  isBlockedByOther(day: number): boolean {
    if (this.calMode === 'fixed') return this.isBlocked(day);
    if (this.calMode === 'blocked') return this.isFixed(day);
    return false;
  }

  toggleDay(day: number) {
    const iso = this.isoDate(day);
    if (this.calMode === 'fixed') {
      const idx = this.draft.fixedDays?.indexOf(iso) ?? -1;
      if (idx >= 0) {
        this.draft.fixedDays!.splice(idx, 1);
      } else if (!this.fixedAtCap) {
        this.draft.fixedDays = [...(this.draft.fixedDays ?? []), iso];
      }
    } else {
      const idx = this.draft.blockedDays?.indexOf(iso) ?? -1;
      if (idx >= 0) {
        this.draft.blockedDays!.splice(idx, 1);
      } else {
        this.draft.blockedDays = [...(this.draft.blockedDays ?? []), iso];
      }
    }
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

  close() { this.dialogRef.close(null); }
}