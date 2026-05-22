import { Component, inject, OnInit, computed, ViewChild, signal, effect } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StationAssignmentService } from '../../service/station-assignment-service';
import { SchedulePayload, ScheduleService } from '../../service/schedule-service';
import { Dialog } from '@angular/cdk/dialog';
import { UserService } from '../../service/user-service';
import { SolverDialogComponent, SolverDialogResult } from '../solver-dialog/solver-dialog';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { RescheduleSolverDialog } from '../reschedule-solver-dialog/reschedule-solver-dialog';
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    FullCalendarModule,
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatDividerModule,
  ],
  styles: [
    `
      :host {
        display: block;
      }
      full-calendar {
        --fc-border-color: #e2e8f0;
        --fc-daygrid-event-dot-width: 6px;
        --fc-today-bg-color: #eef2ff;
        --fc-neutral-bg-color: #f8fafc;
        --fc-page-bg-color: transparent;
        --fc-event-bg-color: #6366f1;
        --fc-event-border-color: #6366f1;
        --fc-event-text-color: #fff;
      }
      full-calendar ::ng-deep .fc {
        font-family: inherit;
        font-size: 0.875rem;
      }
      full-calendar ::ng-deep .fc-toolbar-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
      }
      full-calendar ::ng-deep .fc-button {
        background: white !important;
        border: 1px solid #e2e8f0 !important;
        color: #475569 !important;
        font-size: 0.8125rem !important;
        font-weight: 500 !important;
        padding: 0.375rem 0.875rem !important;
        border-radius: 0.625rem !important;
        box-shadow: none !important;
        transition:
          background 0.15s,
          color 0.15s !important;
      }
      full-calendar ::ng-deep .fc-button:hover {
        background: #f1f5f9 !important;
        color: #1e293b !important;
      }
      full-calendar ::ng-deep .fc-button-active,
      full-calendar ::ng-deep .fc-button:focus {
        background: #eef2ff !important;
        color: #6366f1 !important;
        border-color: #c7d2fe !important;
        outline: none !important;
      }
      full-calendar ::ng-deep .fc-col-header-cell {
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #94a3b8;
        padding: 0.625rem 0;
        background: #f8fafc;
      }
      full-calendar ::ng-deep .fc-col-header-cell a {
        color: inherit !important;
      }
      full-calendar ::ng-deep .fc-daygrid-day-number {
        font-size: 0.8125rem;
        color: #64748b;
        padding: 0.375rem 0.625rem;
      }
      full-calendar ::ng-deep .fc-day-today .fc-daygrid-day-number {
        background: #6366f1;
        color: white;
        border-radius: 9999px;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 4px;
        padding: 0;
      }
      full-calendar ::ng-deep .fc-event {
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 500;
        padding: 1px 6px;
        border: none;
      }
      full-calendar ::ng-deep .fc-scrollgrid {
        border-radius: 0 !important;
        border-left: none !important;
        border-top: none !important;
      }
      full-calendar ::ng-deep .fc-scrollgrid td:last-child,
      full-calendar ::ng-deep .fc-scrollgrid th:last-child {
        border-right: none !important;
      }
      full-calendar ::ng-deep .fc-scrollgrid-section-body tr:last-child td {
        border-bottom: none !important;
      }
      full-calendar ::ng-deep .fc-daygrid-day.fc-day-other {
        background: transparent;
      }
      full-calendar ::ng-deep .fc .fc-daygrid-body-natural .fc-daygrid-day-events {
        margin-left: 0;
      }
      full-calendar ::ng-deep .fc .fc-timegrid-axis {
        width: 0;
      }
      full-calendar ::ng-deep .fc-daygrid-week-number {
        display: none;
      }
      full-calendar ::ng-deep td.fc-timegrid-axis,
      full-calendar ::ng-deep th.fc-timegrid-axis {
        width: 0 !important;
      }
      full-calendar ::ng-deep .fc-daygrid-day-events {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 2px !important;
        padding: 2px !important;
      }
      full-calendar ::ng-deep .fc-daygrid-event-harness {
        width: auto !important;
      }

      .loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.25rem;
        animation: fadeIn 0.2s ease;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .loading-card {
        background: white;
        border-radius: 1.25rem;
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
      }
      .spinner {
        width: 44px;
        height: 44px;
        border: 3px solid #e0e7ff;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .loading-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: #1e293b;
      }
      .loading-sub {
        font-size: 0.8125rem;
        color: #94a3b8;
      }

      .error-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
      }
      .error-card {
        background: white;
        border-radius: 1.25rem;
        padding: 2rem;
        max-width: 420px;
        width: calc(100% - 2rem);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.875rem;
        text-align: center;
      }
      .error-icon-wrap {
        width: 52px;
        height: 52px;
        background: #fef2f2;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .error-icon-wrap .material-icons-round {
        color: #ef4444;
        font-size: 1.5rem;
      }
      .error-title {
        font-size: 1rem;
        font-weight: 700;
        color: #1e293b;
      }
      .error-btn {
        margin-top: 0.25rem;
        padding: 0.5rem 1.5rem;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .error-btn:hover {
        background: #4f46e5;
      }
      .error-card.is-warning .error-icon-wrap span {
        color: #f59e0b;
      }

      .error-card.is-warning .error-btn {
        background-color: #f59e0b;
      }
      .warning-list {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 300px;
        overflow-y: auto;
        text-align: left;
        width: 100%;
      }

      .warning-list li {
        padding: 4px 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        font-size: 0.9rem;
      }

      .warning-list li:last-child {
        border-bottom: none;
      }

      .warning-day {
        font-weight: 600;
        min-width: 50px;
        display: inline-block;
      }
    `,
  ],
  template: `
    @if (isLoading()) {
      <div class="loading-overlay">
        <div class="loading-card">
          <div class="spinner"></div>
          <div>
            <div class="loading-title">Dienstplan wird erstellt…</div>
            <div class="loading-sub">Das kann bis zu 15 Sekunden dauern.</div>
          </div>
        </div>
      </div>
    }

    @if (errorMessage() || warningList().length) {
      <div class="error-backdrop" (click)="dismissMessages()">
        <div
          class="error-card"
          [class.is-warning]="warningList().length && !errorMessage()"
          (click)="$event.stopPropagation()"
        >
          <div class="error-icon-wrap">
            <span class="material-icons-round">
              {{ errorMessage() ? 'error_outline' : 'warning_amber' }}
            </span>
          </div>
          <div class="error-title">
            {{ errorMessage() ? 'Kein gültiger Dienstplan gefunden' : 'Stationen ohne Benutzer' }}
          </div>

          @if (errorMessage()) {
            <div class="error-message">{{ errorMessage() }}</div>
          } @else {
            <ul class="warning-list">
              @for (item of warningList(); track $index) {
                <li>
                  <span class="warning-day">Tag {{ item.day }}</span> {{ item.station }}
                </li>
              }
            </ul>
          }

          <button class="error-btn" (click)="dismissMessages()">Schließen</button>
        </div>
      </div>
    }

    @if (rescheduleResult()) {
      <div class="error-backdrop" (click)="rescheduleResult.set(null)">
        <div
          class="error-card is-warning"
          (click)="$event.stopPropagation()"
          style="max-width: 520px;"
        >
          <div class="error-icon-wrap">
            <span class="material-icons-round">swap_horiz</span>
          </div>
          <div class="error-title">Umplanung abgeschlossen</div>

          @if (rescheduleResult()!.dropped.length) {
            <div style="width:100%">
              <div style="font-weight:600; font-size:0.8125rem; color:#ef4444; margin-bottom:4px;">
                Entfernt ({{ rescheduleResult()!.dropped.length }})
              </div>
              <ul class="warning-list">
                @for (item of rescheduleResult()!.dropped; track $index) {
                  <li>
                    <span class="warning-day">Tag {{ item.day }}</span>
                    {{ item.person }} – {{ item.station }}
                  </li>
                }
              </ul>
            </div>
          }

          @if (rescheduleResult()!.added.length) {
            <div style="width:100%">
              <div style="font-weight:600; font-size:0.8125rem; color:#22c55e; margin-bottom:4px;">
                Hinzugefügt ({{ rescheduleResult()!.added.length }})
              </div>
              <ul class="warning-list">
                @for (item of rescheduleResult()!.added; track $index) {
                  <li>
                    <span class="warning-day">Tag {{ item.day }}</span>
                    {{ item.person }} – {{ item.station }}
                  </li>
                }
              </ul>
            </div>
          }

          <button class="error-btn" (click)="rescheduleResult.set(null)">Schließen</button>
        </div>
      </div>
    }

    <div class="min-h-screen bg-slate-50 px-6 py-10">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-2xl font-semibold text-slate-800 tracking-tight">Kalender</h1>

        <div class="flex items-center justify-between mt-6">
          <mat-form-field appearance="outline" style="width: 250px; margin-bottom: 1rem;">
            <mat-label>Mitarbeiter</mat-label>
            <mat-select multiple [(ngModel)]="selectedIds" (ngModelChange)="onFilterChange($event)">
              <div style="padding: 8px 16px; border-bottom: 1px solid #e2e8f0;">
                <button
                  (click)="toggleAll(); $event.stopPropagation()"
                  style="color: #6366f1; font-size: 0.75rem; font-weight: 500; background: none; border: none; cursor: pointer; padding: 0;"
                >
                  {{ selectedIds.length === users().length ? 'Alle abwählen' : 'Alle auswählen' }}
                </button>
              </div>
              @for (user of users(); track user.id) {
                <mat-option [value]="user.id">{{ user.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <div>
            <button
              (click)="openRescheduleDialog()"
              [disabled]="isLoading()"
              class="inline-flex items-center m-5 gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all duration-150 active:scale-95 bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-icons-round">event_busy</span>Spontaner Ausfall
            </button>
            <button
              (click)="openSolverDialog()"
              [disabled]="isLoading()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all duration-150 active:scale-95 bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-icons-round">calendar_month</span>Monat planen
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden p-6">
          <full-calendar #cal [options]="calendarOptions" [events]="events()" />
        </div>
      </div>
    </div>
  `,
})
export class CalendarComponent implements OnInit {
  private stationassignmentService = inject(StationAssignmentService);
  private router = inject(Router);
  private scheduleService = inject(ScheduleService);
  private dialog = inject(Dialog);
  private userService = inject(UserService);
  @ViewChild('cal') calendarRef!: FullCalendarComponent;

  assignments = this.stationassignmentService.assignments;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  dropdownOpen = false;
  selectedUserIds = signal<Set<number>>(new Set());
  selectedIds: number[] = [];
  users = this.userService.users;
  warningList = signal<{ station: string; day: number }[]>([]);
  rescheduleResult = signal<{
    dropped: { day: number; person: string; station: string }[];
    added: { day: number; person: string; station: string }[];
  } | null>(null);

  onFilterChange(ids: number[]) {
    this.selectedUserIds.set(new Set(ids));
  }
  toggleAll() {
    if (this.selectedIds.length === this.users().length) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.users().map((u) => u.id);
    }
    this.selectedUserIds.set(new Set(this.selectedIds));
  }

  constructor() {
    effect(() => {
      const ids = this.users().map((u) => u.id);
      if (ids.length > 0 && this.selectedIds.length === 0) {
        this.selectedIds = ids;
        this.selectedUserIds.set(new Set(ids));
      }
    });
  }

  events = computed(() =>
    this.assignments()
      .filter(
        (a) =>
          a.user?.id == null ||
          this.selectedUserIds().size === 0 ||
          this.selectedUserIds().has(a.user.id),
      )
      .map((a) => ({
        title: a.user?.name ?? 'Placeholder',
        date: a.date,
      })),
  );
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    weekends: false,
    plugins: [dayGridPlugin, interactionPlugin],
    headerToolbar: { center: 'dayGridMonth,dayGridWeek,dayGridDay' },
    locale: deLocale,
    dayMaxEvents: 10,
    moreLinkClick: 'day',
    views: {
      dayGridDay: { dayMaxEvents: false },
      dayGridWeek: { dayMaxEvents: false },
    },
    dateClick: (info: DateClickArg) => {
      this.router.navigate(['/calendar', info.dateStr]);
    },
  };

  ngOnInit() {
    this.userService.loadAll().subscribe();
    this.stationassignmentService.loadAll().subscribe();
  }

  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }
  dismissMessages() {
    this.errorMessage.set(null);
    this.warningList.set([]);
    this.rescheduleResult.set(null);
  }
  openSolverDialog() {
    const calApi = this.calendarRef.getApi();
    const currentDate = calApi.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const daysInCurrentMonth = this.getDaysInMonth(year, month);

    this.userService.loadAll().subscribe(() => {
      const users = this.userService.users();
      const ref = this.dialog.open(SolverDialogComponent, {
        data: { users, currentDate },
      });

      ref.closed.subscribe((value) => {
        const result = value as SolverDialogResult;
        if (!result?.constraints) return;

        const payload: SchedulePayload = {
          currentMonth: month,
          currentYear: year,
          daysInMonth: daysInCurrentMonth,
          keepExistingAssignments: result.keepExistingAssignments,
          constraints: result.constraints,
        };

        this.isLoading.set(true);
        this.scheduleService
          .loadSchedule(payload)
          .pipe(
            tap((response: any) => {
              if (response.unassigned?.length) {
                this.warningList.set(response.unassigned);
              } else {
                this.warningList.set([]);
              }
            }),
            switchMap(() => this.stationassignmentService.loadAll()),
            catchError((err: HttpErrorResponse) => {
              this.isLoading.set(false);
              if (err.status === 409) {
                const detail =
                  err.error?.detail ??
                  'Überprüfen Sie, ob genügend Benutzer die erforderlichen Kompetenzen haben.';
                this.errorMessage.set(detail);
              } else {
                this.errorMessage.set(
                  'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
                );
              }
              return EMPTY;
            }),
          )
          .subscribe(() => this.isLoading.set(false));
      });
    });
  }

  openRescheduleDialog() {
    const calApi = this.calendarRef.getApi();
    const currentDate = calApi.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const daysInCurrentMonth = this.getDaysInMonth(year, month);

    this.userService.loadAll().subscribe(() => {
      const users = this.userService.users();
      const ref = this.dialog.open(RescheduleSolverDialog, {
        data: { users, currentDate },
      });

      ref.closed.subscribe((value) => {
        const result = value as SolverDialogResult;
        if (!result?.constraints) return;

        const payload: SchedulePayload = {
          currentMonth: month,
          currentYear: year,
          daysInMonth: daysInCurrentMonth,
          keepExistingAssignments: result.keepExistingAssignments,
          constraints: result.constraints,
        };

        this.isLoading.set(true);
        this.scheduleService
          .reschedule(payload)
          .pipe(
            tap((response: any) => {
              if (response.unassigned?.length) {
                this.warningList.set(response.unassigned);
              } else {
                this.warningList.set([]);
              }
              if (response.dropped?.length || response.added?.length) {
                this.rescheduleResult.set({
                  dropped: response.dropped ?? [],
                  added: response.added ?? [],
                });
              }
            }),
            switchMap(() => this.stationassignmentService.loadAll()),
            catchError((err: HttpErrorResponse) => {
              this.isLoading.set(false);
              if (err.status === 409) {
                const detail =
                  err.error?.detail ??
                  'Überprüfen Sie, ob genügend Benutzer die erforderlichen Kompetenzen haben.';
                this.errorMessage.set(detail);
              } else {
                this.errorMessage.set(
                  'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
                );
              }
              return EMPTY;
            }),
          )
          .subscribe(() => this.isLoading.set(false));
      });
    });
  }
}
