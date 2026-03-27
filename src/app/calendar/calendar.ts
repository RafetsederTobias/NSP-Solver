import { AfterViewInit, Component } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { CommonModule } from '@angular/common';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { UserBottomSheet } from '../user-bottom-sheet/user-bottom-sheet';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, CommonModule, MatButtonModule],
  template: `
    <button mat-raised-button color="primary" (click)="toggleBottomSheet()">
      Mitarbeiter zuteilen
    </button>
    <full-calendar [options]="calendarOptions"></full-calendar>
  `,
  styles: [
    `
      full-calendar {
        max-width: 1000px;
        margin: 0 auto;
      }
    `,
  ],
})
export class CalendarComponent {
  private bottomSheetRef: MatBottomSheetRef | null = null;

  constructor(private bottomSheet: MatBottomSheet) {}

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

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    weekends: false,
    plugins: [dayGridPlugin, interactionPlugin],
    editable: true,
    droppable: true,
    selectable: true,
    locale: deLocale,
    eventDragStart: (info) => {
      console.log(info);
    },
    eventDrop: (info) => {
      console.log(info);
    },

    events: [],
    drop: (info) => {
      console.log('Dropped event:', info);
      alert(`Event "${info.draggedEl.innerText}" added on ${info.date?.toLocaleDateString()}`);
    },
  };
}
