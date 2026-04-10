import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { User } from '../../service/user-service';
import { StationService } from '../../service/station-service';
import { Assignment, AssignmentService } from '../../service/assignment-service';

interface StationUserAssignment {
  stationId: number;
  selectedUserId: number | null;
}

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
  styles: [
    `
      .station-row:not(:last-child) {
        border-bottom: 1px solid #f1f5f9;
      }
    `,
  ],
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
              {{ date | date: 'EEEE' }}
            </p>
            <h1 class="text-2xl font-semibold text-slate-800 tracking-tight leading-tight">
              {{ date | date: 'd. MMMM yyyy' }}
            </h1>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div
            class="grid grid-cols-[1fr_280px] items-center px-6 py-3 bg-slate-50 border-b border-slate-100"
          >
            <span class="text-xs font-semibold uppercase tracking-widest text-slate-400"
              >Station</span
            >
            <span class="text-xs font-semibold uppercase tracking-widest text-slate-400"
              >Mitarbeiter</span
            >
          </div>

          <div
            *ngFor="let station of stationService.stations()"
            class="station-row grid grid-cols-[1fr_280px] items-center px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <span class="text-sm font-medium text-slate-700">{{ station.name }}</span>

            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-select
                [(ngModel)]="getAssignment(station.id).selectedUserId"
                placeholder="— Niemand —"
              >
                <mat-option [value]="null">— Niemand —</mat-option>
                <mat-option *ngFor="let user of this.users" [value]="user.id">
                  {{ user.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DayDetailComponent {
  private assignments = new Map<number, StationUserAssignment>();
  private route = inject(ActivatedRoute);
  public users : User[] = [];
  public date = new Date();

  router = inject(Router);
  stationService = inject(StationService);
  assignmentService = inject(AssignmentService);

  ngOnInit() {
    this.stationService.loadAll().subscribe(() => {
      for (const station of this.stationService.stations()) {
        this.assignments.set(station.id, { stationId: station.id, selectedUserId: null });
      }
    });

    let info = this.route.snapshot.paramMap.get('assignment')!;
    const assignmentId = +info.split(";")[0];
    if (assignmentId == -1) return;
    this.assignmentService.getUsersByAssignment(assignmentId).subscribe((data) => {
      this.users = data;
    });
  }

  getAssignment(stationId: number): StationUserAssignment {
    if (!this.assignments.has(stationId)) {
      this.assignments.set(stationId, { stationId, selectedUserId: null });
    }
    return this.assignments.get(stationId)!;
  }
}
