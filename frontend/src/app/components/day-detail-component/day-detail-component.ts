import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { User, UserService } from '../../service/user-service';
import { StationService, Station } from '../../service/station-service';
import { StationAssignmentService } from '../../service/station-assignment-service';

interface StationRow {
  stationId: number;
  maxAssignments: number;
  selectedUserIds: number[];
}

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatTooltipModule],
  styles: [
    `
      .station-row:not(:last-child) {
        border-bottom: 1px solid #f1f5f9;
      }
      .skill-mismatch-icon {
        font-size: 14px;
        color: #f59e0b;
        vertical-align: middle;
        margin-left: 4px;
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
            class="grid grid-cols-[1fr_280px_280px] items-center px-6 py-3 bg-slate-50 border-b border-slate-100"
          >
            <span class="text-xs font-semibold uppercase tracking-widest text-slate-400"
              >Station</span
            >
            <span class="text-xs font-semibold uppercase tracking-widest text-slate-400"
              >Zuteilungen</span
            >
            <span class="text-xs font-semibold uppercase tracking-widest text-slate-400"
              >Mitarbeiter</span
            >
          </div>

          <div
            *ngFor="let row of rows()"
            class="station-row grid grid-cols-[1fr_280px_280px] items-center px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <span class="text-sm font-medium text-slate-700">{{ stationName(row.stationId) }}</span>
            <span class="text-sm text-slate-500">
              {{ row.selectedUserIds.length }} / {{ row.maxAssignments }}
            </span>

            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-select [multiple]="true" [(ngModel)]="row.selectedUserIds" placeholder="—">
                <mat-option
                  *ngFor="let user of availableUsers(row)"
                  [value]="user.id"
                  [disabled]="isDisabled(row, user.id)"
                >
                  <span>{{ user.name }}</span>
                  <span
                    *ngIf="!hasSkillMatch(user, row.stationId)"
                    class="skill-mismatch-icon material-icons-round"
                    [matTooltip]="skillMismatchTooltip(user, row.stationId)"
                    matTooltipPosition="right"
                    >warning_amber</span
                  >
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="flex justify-end px-6 py-4 border-t border-slate-100">
            <button
              (click)="save()"
              [disabled]="saving()"
              class="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {{ saving() ? 'Speichern…' : 'Speichern' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DayDetailComponent {
  rows = signal<StationRow[]>([]);
  saving = signal(false);

  private persisted = new Map<number, { assignmentId: number; userId: number }[]>();

  router = inject(Router);
  private route = inject(ActivatedRoute);
  private stationService = inject(StationService);
  private userService = inject(UserService);
  private stationAssignmentService = inject(StationAssignmentService);

  users: User[] = [];
  date = new Date();
  dateIso = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.dateIso = params.get('assignment')!;
      this.date = new Date(this.dateIso);

      this.stationService.loadAll().subscribe(() => {
        this.stationAssignmentService.getByDate(this.dateIso).subscribe((existing) => {
          this.persisted.clear();
          this.rows.set(
            this.stationService.stations().map((station) => {
              const matches = existing.filter((a) => a.station_id === station.id);
              this.persisted.set(
                station.id,
                matches.map((m) => ({ assignmentId: m.id, userId: m.user_id })),
              );
              return {
                stationId: station.id,
                maxAssignments: station.maxAssignments ?? 1,
                selectedUserIds: matches.map((m) => m.user_id),
              };
            }),
          );
        });
      });

      this.userService.loadAll().subscribe((data) => {
        this.users = data;
      });
    });
  }

  stationName(id: number): string {
    return this.stationService.stations().find((s) => s.id === id)?.name ?? '';
  }

  private getStation(stationId: number): Station | undefined {
    return this.stationService.stations().find((s) => s.id === stationId);
  }

  hasSkillMatch(user: User, stationId: number): boolean {
    const station = this.getStation(stationId);
    if (!station?.skills_needed?.length) return true;
    if (!user.skills?.length) return false;
    return station.skills_needed.every((skill) => user.skills.includes(skill));
  }
  skillMismatchTooltip(user: User, stationId: number): string {
    const station = this.getStation(stationId);
    const needed = station?.skills_needed ?? [];
    const missing = needed.filter((s) => !user.skills?.includes(s));
    return `Fehlende Skills: ${missing.join(', ')}`;
  }

  availableUsers(row: StationRow): User[] {
    const assignedElsewhere = new Set(
      this.rows()
        .filter((r) => r.stationId !== row.stationId)
        .flatMap((r) => r.selectedUserIds),
    );

    return this.users
      .filter((u) => !assignedElsewhere.has(u.id))
      .sort((a, b) => {
        const aDisabled = !this.hasSkillMatch(a, row.stationId);
        const bDisabled = !this.hasSkillMatch(b, row.stationId);
        return Number(aDisabled) - Number(bDisabled);
      });
  }

  isDisabled(row: StationRow, userId: number): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return true;

    if (!this.hasSkillMatch(user, row.stationId)) return true;

    if (row.selectedUserIds.length >= row.maxAssignments && !row.selectedUserIds.includes(userId))
      return true;

    return false;
  }

  async save() {
    this.saving.set(true);
    const assignments = this.rows().flatMap((row) =>
      row.selectedUserIds.map((userId) => ({
        date: this.dateIso,
        station_id: row.stationId,
        user_id: userId,
      })),
    );
    await firstValueFrom(this.stationAssignmentService.replaceAll(this.dateIso, assignments));
    this.saving.set(false);
  }
}
