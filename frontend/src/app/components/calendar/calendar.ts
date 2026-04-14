import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import { DateClickArg, EventReceiveArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UserBottomSheet } from '../user-bottom-sheet/user-bottom-sheet';
import { AssignmentService } from '../../service/assignment-service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StationAssignmentService } from '../../service/station-assignment-service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    `,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 px-6 py-10">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-semibold text-slate-800 tracking-tight">Kalender</h1>
          <button
            (click)="toggleBottomSheet()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all duration-150 active:scale-95"
            [class.bg-indigo-600]="!bottomSheetRef"
            [class.hover:bg-indigo-700]="!bottomSheetRef"
            [class.text-white]="!bottomSheetRef"
            [class.bg-white]="!!bottomSheetRef"
            [class.text-slate-600]="!!bottomSheetRef"
            [class.ring-1]="!!bottomSheetRef"
            [class.ring-slate-200]="!!bottomSheetRef"
          >
            <span class="material-icons-round text-[18px]">
              {{ bottomSheetRef ? 'close' : 'person_add' }}
            </span>
            {{ bottomSheetRef ? 'Schließen' : 'Mitarbeiter zuteilen' }}
          </button>
        </div>

        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden p-6">
          <full-calendar
            *ngIf="calendarOptions$ | async as calendarOptions"
            [options]="calendarOptions"
          />
        </div>
      </div>
    </div>
  `,
})
export class CalendarComponent implements OnInit {
  private stationassignmentService = inject(StationAssignmentService);
  private router = inject(Router);
  private bottomSheet = inject(MatBottomSheet);

  bottomSheetRef: MatBottomSheetRef | null = null;
  calendarOptions$!: Observable<CalendarOptions>;

  ngOnInit() {
    this.calendarOptions$ = this.stationassignmentService.loadAll().pipe(
      map((assignments) => ({
        initialView: 'dayGridMonth',
        weekends: false,
        plugins: [dayGridPlugin, interactionPlugin],
        editable: true,
        droppable: true,
        selectable: true,
        locale: deLocale,
        events: assignments.map((a) => ({
          title:a.user.name,
          date: a.date,
        })),
        dateClick: (info: DateClickArg) => {
          this.router.navigate(['/calendar', info.dateStr]);
        },
      })),
    );
  }

  toggleBottomSheet() {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
      this.bottomSheetRef = null;
    } else {
      this.bottomSheetRef = this.bottomSheet.open(UserBottomSheet, { hasBackdrop: false });
      this.bottomSheetRef.afterDismissed().subscribe(() => {
        this.bottomSheetRef = null;
      });
    }
  }
}
