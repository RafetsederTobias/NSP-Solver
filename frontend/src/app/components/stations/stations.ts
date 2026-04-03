import { Component, signal, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Station, StationService } from '../../service/station-service';

@Component({
  selector: 'app-stations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 px-6 py-10">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-semibold text-slate-800 tracking-tight">Stationen</h1>
          <button
            (click)="router.navigate(['/stations/create'])"
            class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-all duration-150"
          >
            <span class="material-icons-round text-[18px]">add_box
            </span>
            Add Station
          </button>
        </div>

        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <table *ngIf="stations().length > 0; else empty" class="w-full">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/60">
                <th
                  class="px-6 py-3 text-left text-[11px] font-semibold tracking-widest text-slate-400 uppercase"
                >
                  Name
                </th>
                <th
                  class="px-6 py-3 text-left text-[11px] font-semibold tracking-widest text-slate-400 uppercase"
                >
                  Benötigte Kompetenzen
                </th>
                <th class="px-6 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let station of stations()"
                (click)="router.navigate(['/stations', station.id, 'edit'])"
                class="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors duration-100"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center flex-shrink-0"
                    >
                      {{ station.name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-sm font-medium text-slate-700">{{ station.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      *ngFor="let s of station.skills_needed"
                      class="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                      >{{ s }}</span
                    >
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      (click)="router.navigate(['/stations', station.id, 'edit'])"
                      title="Edit"
                      class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150"
                    >
                      <span class="material-icons-round text-[17px]">edit</span>
                    </button>
                    <button
                      (click)="$event.stopPropagation(); deleteStation(station)"
                      title="Delete"
                      class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-150"
                    >
                      <span class="material-icons-round text-[17px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #empty>
            <div class="flex flex-col items-center py-16 gap-2 text-center">
              <div
                class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-2"
              >
                <span class="material-icons-round text-[26px] text-slate-400">people_outline</span>
              </div>
              <p class="text-sm font-medium text-slate-600">No stations yet</p>
              <p class="text-xs text-slate-400">Stations will appear here once added.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export class Stations {
  router = inject(Router);
  private stationService = inject(StationService);
  stations = this.stationService.stations;

  constructor() {
    this.stationService.loadAll().subscribe();
  }

  deleteStation(station: Station) {
    this.stationService.delete(station.id).subscribe();
  }
}
