import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { Draggable } from '@fullcalendar/interaction/index.js';

@Component({
  selector: 'app-user-bottom-sheet',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatBottomSheetModule, FullCalendarModule],
  template: `
    <div class="bottom-sheet-container">
      <div #externalEvents class="external-events">
        <p><strong>Mitarbeiter</strong></p>
        <div class="fc-event" *ngFor="let event of externalEventsList">{{ event.title }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .bottom-sheet-container {
        padding: 16px;
        display: flex;
        flex-flow: row, wrap;
        max-width: 65vw;
        align-items:center;
        justify-content:center;
      }

      .fc-event {
        min-width:7vw;
        margin: 5px;
        display: inline-block;
        padding: 6px 12px;
        background-color: #257e4a;
        color: white;
        border-radius: 999px;
        cursor: grab;
        font-size: 0.875rem;
        transition:
          transform 0.2s,
          background-color 0.2s;
      }

      .fc-event:active {
        cursor: grabbing;
        transform: scale(0.95);
        background-color: #1f6b3d;
      }
    `,
  ],
})
export class UserBottomSheet {
  constructor(private bottomSheetRef: MatBottomSheetRef<UserBottomSheet>) {}

  externalEventsList = [
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann 2' },
    { title: 'Max Mustermann 3' },
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann' },
    { title: 'Max Mustermann' },
  ];
  close() {
    this.bottomSheetRef.dismiss();
  }
  ngAfterViewInit() {
    const containerEl = document.querySelector('.external-events');
    new Draggable(containerEl as HTMLElement, {
      itemSelector: '.fc-event',
      eventData: function (el) {
        return { title: el.innerText };
      },
    });
  }
}
