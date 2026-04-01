import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserService } from '../../service/user-service'
import { StationService } from '../../service/station-service';

interface Assignment {
  stationId: number;
  selectedUserId: number | null;
}

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
  styles: [`
    .station-row:not(:last-child) {
      border-bottom: 1px solid #f1f5f9;
    }
    .group-header {
      background: #f8fafc;
    }
  `],
  template: `
    <div class="min-h-screen bg-slate-50 px-6 py-10">
      <div class="max-w-5xl mx-auto">

        <div class="flex items-center gap-3 mb-6">
          <button
            (click)="router.navigate(['/calendar'])"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span class="material-icons-round text-[20px]">arrow_back</span>
          </button>
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              {{ date | date:'EEEE' }}
            </p>
            <h1 class="text-2xl font-semibold text-slate-800 tracking-tight leading-tight">
              {{ date | date:'d. MMMM yyyy' }}
            </h1>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">

          <div class="grid grid-cols-[1fr_280px] items-center px-6 py-3 bg-slate-50 border-b border-slate-100">
            <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">Station</span>
            <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">Mitarbeiter</span>
          </div>

          <ng-container *ngFor="let group of stationGroups">

            <div class="group-header px-6 py-2">
              <span class="text-[11px] font-bold uppercase tracking-widest text-indigo-300">{{ group.name }}</span>
            </div>

            <div
              *ngFor="let stationId of group.stationIds"
              class="station-row grid grid-cols-[1fr_280px] items-center px-6 py-3 hover:bg-slate-50 transition-colors"
            >
              <span class="text-sm font-medium text-slate-700">
                {{ stationService.getById(stationId)?.name }}
              </span>

              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                <mat-select
                  [(ngModel)]="getAssignment(stationId).selectedUserId"
                  placeholder="— Niemand —"
                >
                  <mat-option [value]="null">— Niemand —</mat-option>
                  <mat-option *ngFor="let user of userService.users()" [value]="user.id">
                    {{ user.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

          </ng-container>
        </div>

      </div>
    </div>
  `,
})
export class DayDetailComponent {
  date: Date;

  private assignments = new Map<number, Assignment>();

  stationGroups = [
    { name: 'Leitung',   stationIds: [1, 2, 3] },
    { name: 'OP',        stationIds: [4, 5, 6] },
    { name: 'KAT',       stationIds: [7, 8, 9, 10] },
    { name: 'Sonstige',  stationIds: [11, 12, 13, 14] },
    { name: 'Ambulanz',  stationIds: [15, 16, 17, 18, 19, 20, 21, 22] },
  ];

  constructor(
    route: ActivatedRoute,
    public router: Router,
    public userService: UserService,
    public stationService: StationService,
  ) {
    const dateStr = route.snapshot.paramMap.get('date') ?? '';
    this.date = new Date(dateStr);

    for (const station of this.stationService.stations()) {
      this.assignments.set(station.id, { stationId: station.id, selectedUserId: null });
    }
  }

  getAssignment(stationId: number): Assignment {
    return this.assignments.get(stationId)!;
  }
}