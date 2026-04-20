import { Component, inject, OnInit, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ConstraintsService } from '../../service/constraint-service';
import { UserConstraintsDialogComponent } from '../user-constraints-dialog/user-constraints-dialog';
import { UserConstraint } from '../../service/user-service';

export interface SolverDialogData {
  users: { id: string; name: string }[];
  currentDate: Date;
}

@Component({
  selector: 'app-solver-dialog',
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
              Einschränkungen vor dem Starten konfigurieren
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
                ⚙
              </button>
            </div>
          }
        </div>

        <div class="footer">
          <button class="btn-ghost" (click)="close()">Abbrechen</button>
          <button class="btn-primary" (click)="solve()">
            <span style="font-size:14px;">▶</span> Solver starten
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SolverDialogComponent {
  dialogRef = inject(DialogRef<UserConstraint[]>);
  data: SolverDialogData = inject(DIALOG_DATA);
  private dialog = inject(Dialog);
  private constraintsService = inject(ConstraintsService);

  get monthLabel() {
    return this.data.currentDate.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
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
    const c = this.constraintsService.get(userId);
    return c.maxDaysPerMonth != null || c.minDaysPerMonth != null;
  }

  summary(userId: string): string {
    const c = this.constraintsService.get(userId);
    const parts: string[] = [];
    if (c.maxDaysPerMonth != null) parts.push(`Max ${c.maxDaysPerMonth}d`);
    if (c.minDaysPerMonth != null) parts.push(`Min ${c.minDaysPerMonth}d`);
    return parts.length ? parts.join(' · ') : 'Keine Einschränkungen';
  }

  openUserSettings(user: { id: string; name: string }) {
    const ref = this.dialog.open(UserConstraintsDialogComponent, {
      data: { user, constraints: this.constraintsService.get(user.id) },
    });
    ref.closed.subscribe((result) => {
      if (result) this.constraintsService.save(result as UserConstraint);
    });
  }

  solve() {
    const all = this.data.users.map((u) => this.constraintsService.get(u.id));
    this.dialogRef.close(all);
  }

  onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close();
  }

  close() {
    this.dialogRef.close();
  }
}
