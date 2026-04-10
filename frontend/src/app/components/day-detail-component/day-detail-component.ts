import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../../service/user-service';
import { StationService } from '../../service/station-service';
import { AssignmentService } from '../../service/assignment-service';
import { StationAssignmentService } from '../../service/station-assignment-service';

interface StationRow {
  stationId: number;
  assignmentId: number | null;
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
            *ngFor="let row of rows()"
            class="station-row grid grid-cols-[1fr_280px] items-center px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <span class="text-sm font-medium text-slate-700">{{ stationName(row.stationId) }}</span>

            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-select
                [(ngModel)]="row.selectedUserId"
                (ngModelChange)="onSelectionChange(row)"
                placeholder="— Niemand —"
              >
                <mat-option [value]="null">— Niemand —</mat-option>
                <mat-option *ngFor="let user of availableUsers(row)" [value]="user.id">
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
  rows = signal<StationRow[]>([]);

  private route = inject(ActivatedRoute);
  public users: User[] = [];
  public date = new Date();
  public dateIso = '';

  router = inject(Router);
  stationService = inject(StationService);
  assignmentService = inject(AssignmentService);
  stationAssignmentService = inject(StationAssignmentService);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const info = params.get('assignment')!;
      this.dateIso = info;
      this.date = new Date(this.dateIso);

      this.stationService.loadAll().subscribe(() => {
        this.stationAssignmentService.getByDate(this.dateIso).subscribe((existing) => {
          this.rows.set(
            this.stationService.stations().map((station) => {
              const match = existing.find((a) => a.station_id === station.id);
              return {
                stationId: station.id,
                assignmentId: match?.id ?? null,
                selectedUserId: match?.user_id ?? null,
              };
            }),
          );
        });
      });

      this.assignmentService.getUsersByDate(this.dateIso).subscribe((data) => {
        this.users = data;
      });
    });
  }

  stationName(stationId: number): string {
    return this.stationService.stations().find((s) => s.id === stationId)?.name ?? '';
  }

  availableUsers(row: StationRow): User[] {
    const assignedUserIds = this.rows()
      .filter((r) => r.stationId !== row.stationId && r.selectedUserId !== null)
      .map((r) => r.selectedUserId!);

    return this.users.filter((u) => !assignedUserIds.includes(u.id));
  }

  onSelectionChange(row: StationRow): void {
    if (row.selectedUserId === null && row.assignmentId !== null) {
      this.stationAssignmentService
        .delete(row.assignmentId)
        .pipe(
          tap(() => this.updateRow(row.stationId, { assignmentId: null })),
          catchError(() => of(null)),
        )
        .subscribe();
    } else if (row.selectedUserId !== null && row.assignmentId === null) {
      this.stationAssignmentService
        .create({
          date: this.dateIso,
          station_id: row.stationId,
          user_id: row.selectedUserId,
        })
        .pipe(
          tap((saved) => this.updateRow(row.stationId, { assignmentId: saved.id })),
          catchError(() => of(null)),
        )
        .subscribe();
    } else if (row.selectedUserId !== null && row.assignmentId !== null) {
      this.stationAssignmentService
        .update(row.assignmentId, {
          date: this.dateIso,
          station_id: row.stationId,
          user_id: row.selectedUserId,
        })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  private updateRow(stationId: number, patch: Partial<StationRow>): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.stationId === stationId ? { ...r, ...patch } : r)),
    );
  }
}
