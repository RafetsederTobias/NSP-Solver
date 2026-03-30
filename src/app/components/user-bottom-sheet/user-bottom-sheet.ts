import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import {
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { FullCalendarModule } from '@fullcalendar/angular';
import { Draggable } from '@fullcalendar/interaction/index.js';
import { UserService } from '../../service/user-service';

@Component({
  selector: 'app-user-bottom-sheet',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatBottomSheetModule, FullCalendarModule],
  template: `
    <div
      class="bottom-sheet-container p-6 flex flex-row flex-wrap max-w-[65vw] items-center justify-center"
    >
      <div #externalEvents class="external-events w-full">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-semibold tracking-widest text-slate-400 uppercase">Mitarbeiter</p>
          <button
            (click)="close()"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150"
          >
            <span class="material-icons-round text-[18px]">close</span>
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            class="fc-event min-w-[7vw] inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full cursor-grab text-sm font-medium transition-all duration-200 active:cursor-grabbing active:scale-95 active:bg-indigo-200 select-none"
            *ngFor="let user of userList()"
          >
            {{ user.name }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bottom-sheet-container {
      }
      .external-events {
      }
      .fc-event {
      }
    `,
  ],
})
export class UserBottomSheet {
  private userService = inject(UserService);

  userList = this.userService.users;

  constructor(private bottomSheetRef: MatBottomSheetRef<UserBottomSheet>) {}

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
