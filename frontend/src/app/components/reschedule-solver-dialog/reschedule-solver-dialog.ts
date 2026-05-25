import { Component, inject, OnInit, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ConstraintsService } from '../../service/constraint-service';
import { UserConstraintsDialogComponent } from '../user-constraints-dialog/user-constraints-dialog';
import { UserConstraint } from '../../service/user-service';
import { WorkdayService } from '../../service/workday-service';
import { SolverDialogData, SolverDialogResult } from '../solver-dialog/solver-dialog';
import { RescheduleConstraintDialogComponent } from '../reschedule-constraint-dialog/reschedule-constraint-dialog';

@Component({
  selector: 'app-reschedule-solver-dialog',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 20, 35, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .dialog {
        background: white;
        border-radius: 16px;
        width: 440px;
        max-height: 90vh;
        border: 0.5px solid #e2e8f0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .header {
        padding: 1.25rem 1.5rem 1rem;
        border-bottom: 0.5px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-shrink: 0;
      }
      .user-list {
        overflow-y: auto;
        padding: 0.75rem 1rem;
        flex: 1;
      }
      .user-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0.6rem 0.75rem;
        border-radius: 10px;
        border: 0.5px solid transparent;
      }
      .user-row:hover {
        background: #f8fafc;
        border-color: #f1f5f9;
      }
      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #eef2ff;
        color: #4f46e5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 500;
        flex-shrink: 0;
      }
      .badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 99px;
        background: #eef2ff;
        color: #4338ca;
        white-space: nowrap;
      }
      .badge.empty {
        background: #f8fafc;
        color: #94a3b8;
      }
      .icon-btn {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 0.5px solid #e2e8f0;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        font-size: 14px;
        flex-shrink: 0;
      }
      .icon-btn:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
      .options-bar {
        padding: 0.6rem 1.5rem;
        border-top: 0.5px solid #f1f5f9;
        flex-shrink: 0;
      }
      .toggle-row {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
      }
      .toggle-row:hover .toggle-label {
        color: #1e293b;
      }
      .toggle-label {
        font-size: 13px;
        color: #475569;
        transition: color 0.15s;
      }
      .toggle-switch {
        position: relative;
        width: 34px;
        height: 20px;
        flex-shrink: 0;
      }
      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }
      .toggle-track {
        position: absolute;
        inset: 0;
        border-radius: 99px;
        background: #cbd5e1;
        transition: background 0.2s;
        cursor: pointer;
      }
      .toggle-track::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s;
      }
      .toggle-switch input:checked + .toggle-track {
        background: #6366f1;
      }
      .toggle-switch input:checked + .toggle-track::after {
        transform: translateX(14px);
      }
      .footer {
        padding: 1rem 1.5rem;
        border-top: 0.5px solid #f1f5f9;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        flex-shrink: 0;
      }
      .btn-ghost {
        padding: 0.4rem 1rem;
        border-radius: 8px;
        border: 0.5px solid #cbd5e1;
        background: transparent;
        font-size: 13px;
        color: #64748b;
        cursor: pointer;
      }
      .btn-ghost:hover {
        background: #f8fafc;
      }
      .btn-primary {
        padding: 0.4rem 1rem;
        border-radius: 8px;
        border: none;
        background: #6366f1;
        color: white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .btn-primary:hover {
        background: #4f46e5;
      }
    `,
  ],
  template: `
    <div class="overlay" (click)="onBackdropClick($event)">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="header">
          <div>
            <div style="font-size:15px;font-weight:500;color:#1e293b;">
              Solver - {{ monthLabel }}
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-top:2px;">
              Ausfälle definieren
            </div>
          </div>
          <button class="btn-ghost" style="padding:0.2rem 0.5rem;" (click)="close()">✕</button>
        </div>

        <div class="user-list">
          @for (user of data.users; track user.id) {
            <div class="user-row">
              <div class="avatar">{{ initials(user.name) }}</div>
              <div style="flex:1;font-size:14px;color:#1e293b;">{{ user.name }}</div>
              <span class="badge" [class.empty]="!hasSummary(user.id)">
                {{ summary(user.id) }}
              </span>
              <button class="icon-btn" (click)="openUserSettings(user)" title="Einstellungen">
                <span class="material-icons-round" style="font-size: 16px;">settings</span>
              </button>
            </div>
          }
        </div>

        <div class="footer">
          <button class="btn-ghost" (click)="close()">Abbrechen</button>
          <button class="btn-primary" (click)="solve()">
            <span class="material-icons-round">start</span> Neu planen
          </button>
        </div>
      </div>
    </div>
  `,
})
export class RescheduleSolverDialog {
  dialogRef = inject(DialogRef<SolverDialogResult>);
  data: SolverDialogData = inject(DIALOG_DATA);
  private dialog = inject(Dialog);
  private constraintsService = inject(ConstraintsService);
  private workdayService = inject(WorkdayService);


  get monthLabel() {
    return this.data.currentDate.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
  }

  private workdaysInMonth(): number {
    return this.workdayService.countWorkdays(this.data.currentDate);
  }

  initials(name: string) {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  hasSummary(userId: string): boolean {
    return this.constraintsService.getMissingDays(userId) != null;
  }

  summary(userId: string): string {
    return this.constraintsService.getMissingDays(userId).length > 0
      ? 'Hat Fehlzeiten'
      : 'Kein Ausfall';
  }

  openUserSettings(user: { id: string; name: string }) {
    const ref = this.dialog.open(RescheduleConstraintDialogComponent, {
      data: {
        user,
        constraints: {
          userId: user.id,
          blockedDays: this.constraintsService.getMissingDays(user.id),
        },
        currentDate: this.data.currentDate,
      },
    });
    ref.closed.subscribe((result : any) => {
      if (result != null)
        this.constraintsService.saveMissingDays(user.id, result.blockedDays ?? []);
    });
  }

  solve() {
    const workdays = this.workdaysInMonth();
    const constraints = this.data.users.map((u) => ({
      ...this.constraintsService.get(u.id, workdays),
      blockedDays: this.constraintsService.getMissingDays(u.id),
    }));
    this.dialogRef.close({
      constraints,
      keepExistingAssignments: false,
      newPlan: false,
      alternativePlan: false
    });
  }

  onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close();
  }

  close() {
    this.dialogRef.close();
  }
}
