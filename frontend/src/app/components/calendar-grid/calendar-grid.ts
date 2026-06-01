import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CalendarMode = 'fixed' | 'blocked';

export interface CalendarGridSelection {
  fixedDays: number[];
  blockedDays: number[];
}

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      .cal-tabs {
        display: flex;
        gap: 6px;
        margin-bottom: 10px;
      }
      .cal-tab {
        flex: 1;
        padding: 6px 0;
        border-radius: 8px;
        border: 0.5px solid #e2e8f0;
        background: transparent;
        font-size: 12px;
        color: #64748b;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.1s;
      }
      .cal-tab.active-fixed {
        background: #eef2ff;
        border-color: #c7d2fe;
        color: #4338ca;
      }
      .cal-tab.active-blocked {
        background: #fff1f2;
        border-color: #fecdd3;
        color: #be123c;
      }
      .cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 3px;
      }
      .cal-dow {
        text-align: center;
        font-size: 10px;
        font-weight: 500;
        color: #cbd5e1;
        padding-bottom: 4px;
        text-transform: uppercase;
      }
      .cal-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        font-size: 12px;
        color: #1e293b;
        cursor: pointer;
        border: 0.5px solid transparent;
        transition: all 0.1s;
        user-select: none;
      }
      .cal-day:hover:not(.empty):not(.weekend):not(.blocked-by-other):not(.past-day) {
        background: #f1f5f9;
      }
      .cal-day.empty {
        pointer-events: none;
      }
      .cal-day.weekend {
        color: #cbd5e1;
        pointer-events: none;
      }
      .cal-day.selected-fixed {
        background: #eef2ff;
        border-color: #c7d2fe;
        color: #4338ca;
        font-weight: 600;
      }
      .cal-day.selected-blocked {
        background: #fff1f2;
        border-color: #fecdd3;
        color: #be123c;
        font-weight: 600;
      }
      .cal-day.blocked-by-other {
        opacity: 0.3;
        cursor: not-allowed;
        pointer-events: none;
      }
      .cal-day.past-day {
        opacity: 0.3;
        cursor: not-allowed;
        pointer-events: none;
      }
      .cal-legend {
        display: flex;
        gap: 12px;
        margin-top: 8px;
      }
      .cal-legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: #94a3b8;
      }
      .cal-legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .cal-cap-hint {
        font-size: 11px;
        color: #94a3b8;
        text-align: right;
        margin-top: 4px;
      }
      .cal-cap-hint.at-cap {
        color: #f59e0b;
      }
    `,
  ],
  template: `
    @if (modes.length > 1) {
      <div class="cal-tabs">
        <button
          class="cal-tab"
          [class.active-fixed]="calMode === 'fixed'"
          (click)="calMode = 'fixed'"
        >
          Diese Tage fix
          @if (_fixedDays.length) {
            <span style="margin-left:4px;opacity:0.7;">({{ _fixedDays.length }})</span>
          }
        </button>
        <button
          class="cal-tab"
          [class.active-blocked]="calMode === 'blocked'"
          (click)="calMode = 'blocked'"
        >
          An diesen Tagen nicht
          @if (_blockedDays.length) {
            <span style="margin-left:4px;opacity:0.7;">({{ _blockedDays.length }})</span>
          }
        </button>
      </div>
    }

    @if (calMode === 'fixed' && fixedCap != null) {
      <div class="cal-cap-hint" [class.at-cap]="fixedAtCap">
        {{ fixedDays.length }} / {{ fixedCap }} Tage ausgewählt
      </div>
    }

    <div class="cal-grid" style="margin-top:6px;">
      @for (dow of dows; track dow) {
        <div class="cal-dow">{{ dow }}</div>
      }
      @for (cell of calendarCells; track $index) {
        <div
          class="cal-day"
          [class.empty]="cell === null"
          [class.weekend]="cell !== null && isWeekend(cell)"
          [class.selected-fixed]="cell !== null && isFixed(cell)"
          [class.selected-blocked]="cell !== null && isBlocked(cell)"
          [class.blocked-by-other]="cell !== null && isBlockedByOther(cell)"
          [class.past-day]="cell !== null && isPastDay(cell)"
          (click)="cell !== null && toggleDay(cell)"
        >
          {{ cell ?? '' }}
        </div>
      }
    </div>

    <div class="cal-legend">
      @if (modes.includes('fixed')) {
        <div class="cal-legend-item">
          <div class="cal-legend-dot" style="background:#eef2ff;border:0.5px solid #c7d2fe;"></div>
          Fix
        </div>
      }
      @if (modes.includes('blocked')) {
        <div class="cal-legend-item">
          <div class="cal-legend-dot" style="background:#fff1f2;border:0.5px solid #fecdd3;"></div>
          Nicht verfügbar
        </div>
      }
    </div>
  `,
})
export class CalendarGridComponent implements OnChanges {
  @Input() currentDate: Date = new Date();
  @Input() fixedDays: number[] = [];
  @Input() blockedDays: number[] = [];
  @Input() fixedCap: number | null = null;
  @Input() modes: CalendarMode[] = ['fixed', 'blocked'];

  @Output() selectionChange = new EventEmitter<CalendarGridSelection>();

  calMode: CalendarMode = 'fixed';
  readonly dows = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  protected _fixedDays: number[] = [];
  protected _blockedDays: number[] = [];

  ngOnChanges() {
    this._fixedDays = [...this.fixedDays];
    this._blockedDays = [...this.blockedDays];

    // If only one mode is allowed, lock to it
    if (this.modes.length === 1) {
      this.calMode = this.modes[0];
    }
  }

  get calendarCells(): (number | null)[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDow = new Date(year, month, 1).getDay();
    firstDow = firstDow === 0 ? 6 : firstDow - 1; // Monday-first
    const cells: (number | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  get fixedAtCap(): boolean {
    return this.fixedCap != null && this._fixedDays.length >= this.fixedCap;
  }

  isWeekend(day: number): boolean {
    const dow = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day).getDay();
    return dow === 0 || dow === 6;
  }

  // Past days should not be selectable as blocked
  isPastDay(day: number): boolean {
    if (this.modes.length !== 1 || this.modes[0] !== 'blocked') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
    return cellDate < today;
  }

  isFixed(day: number) {
    return this._fixedDays.includes(day);
  }

  isBlocked(day: number) {
    return this._blockedDays.includes(day);
  }

  isBlockedByOther(day: number): boolean {
    if (this.calMode === 'fixed') return this.isBlocked(day);
    if (this.calMode === 'blocked') return this.isFixed(day);
    return false;
  }

  toggleDay(day: number) {
    if (this.calMode === 'blocked' && this.isPastDay(day)) return;

    if (this.calMode === 'fixed') {
      const idx = this._fixedDays.indexOf(day);
      if (idx >= 0) this._fixedDays.splice(idx, 1);
      else if (!this.fixedAtCap) this._fixedDays = [...this._fixedDays, day];
    } else {
      const idx = this._blockedDays.indexOf(day);
      if (idx >= 0) this._blockedDays.splice(idx, 1);
      else this._blockedDays = [...this._blockedDays, day];
    }

    this.selectionChange.emit({
      fixedDays: [...this._fixedDays],
      blockedDays: [...this._blockedDays],
    });
  }
}
