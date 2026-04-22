import { Component, inject, OnInit } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserConstraint } from '../../service/user-service';

export interface UserConstraintsDialogData {
  user: { id: string; name: string };
  constraints: UserConstraint;
  currentDate: Date;
}

type DayMode = 'fulltime' | 'exact' | 'minmax';

@Component({
  selector: 'app-user-constraints-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 20, 35, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
      }
      .dialog {
        background: white;
        border-radius: 16px;
        width: 360px;
        border: 0.5px solid #e2e8f0;
        overflow: hidden;
      }
      .header {
        padding: 1.25rem 1.5rem 1rem;
        border-bottom: 0.5px solid #f1f5f9;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .body {
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .footer {
        padding: 1rem 1.5rem;
        border-top: 0.5px solid #f1f5f9;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .section-label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
        margin-bottom: 10px;
      }
      .field-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .field-label {
        font-size: 13px;
        color: #1e293b;
      }
      input[type='number'] {
        width: 64px;
        text-align: center;
        padding: 0.3rem 0.5rem;
        font-size: 13px;
        border-radius: 8px;
        border: 0.5px solid #cbd5e1;
        background: white;
        color: #1e293b;
        transition: opacity 0.15s;
      }
      input[type='number']:disabled {
        opacity: 0.35;
        cursor: not-allowed;
        background: #f8fafc;
      }
      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .radio-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 8px;
        border: 0.5px solid transparent;
        cursor: pointer;
        transition: background 0.1s;
      }
      .radio-row:hover {
        background: #f8fafc;
        border-color: #f1f5f9;
      }
      .radio-row.active {
        background: #eef2ff;
        border-color: #c7d2fe;
      }
      .radio-row input[type='radio'] {
        accent-color: #6366f1;
        width: 14px;
        height: 14px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .radio-label {
        font-size: 13px;
        color: #1e293b;
        flex: 1;
      }
      .radio-hint {
        font-size: 11px;
        color: #94a3b8;
      }
      .or-divider {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 2px 0;
      }
      .or-divider::before,
      .or-divider::after {
        content: '';
        flex: 1;
        height: 0.5px;
        background: #f1f5f9;
      }
      .or-label {
        font-size: 11px;
        color: #cbd5e1;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .inline-input-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
        margin-top: 2px;
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
      }
      .btn-primary:hover {
        background: #4f46e5;
      }
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #eef2ff;
        color: #4f46e5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 500;
        flex-shrink: 0;
      }
      .divider {
        height: 0.5px;
        background: #f1f5f9;
      }
    `,
  ],
  template: `
    <div class="overlay" (click)="onBackdropClick($event)">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar">{{ initials }}</div>
            <div>
              <div style="font-size:15px;font-weight:500;color:#1e293b;">{{ data.user.name }}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:2px;">
                Einschränkungen definieren
              </div>
            </div>
          </div>
          <button class="btn-ghost" style="padding:0.2rem 0.5rem;" (click)="close()">✕</button>
        </div>

        <div class="body">
          <div>
            <div class="section-label">Schichten</div>
            <div class="radio-group">
              <label class="radio-row" [class.active]="mode === 'fulltime'">
                <input
                  type="radio"
                  name="dayMode"
                  value="fulltime"
                  [(ngModel)]="mode"
                  (ngModelChange)="onModeChange()"
                />
                <span class="radio-label">Vollzeit</span>
                <span class="radio-hint">{{ workedaysLabel }}</span>
              </label>

              <label class="radio-row" [class.active]="mode === 'exact'">
                <input
                  type="radio"
                  name="dayMode"
                  value="exact"
                  [(ngModel)]="mode"
                  (ngModelChange)="onModeChange()"
                />
                <span class="radio-label">Genau X Tage / Monat</span>
              </label>
              @if (mode === 'exact') {
                <div class="inline-input-row">
                  <span style="font-size:12px;color:#94a3b8;">Anzahl Tage</span>
                  <input
                    type="number"
                    [(ngModel)]="draft.exactDaysPerMonth"
                    min="0"
                    max="23"
                    placeholder="—"
                  />
                </div>
              }

              <div class="or-divider"><span class="or-label">oder</span></div>

              <label class="radio-row" [class.active]="mode === 'minmax'">
                <input
                  type="radio"
                  name="dayMode"
                  value="minmax"
                  [(ngModel)]="mode"
                  (ngModelChange)="onModeChange()"
                />
                <span class="radio-label">Min. / Max. Tage / Monat</span>
              </label>
              @if (mode === 'minmax') {
                <div class="inline-input-row">
                  <span style="font-size:12px;color:#94a3b8;">Max. Tage</span>
                  <input
                    type="number"
                    [(ngModel)]="draft.maxDaysPerMonth"
                    min="0"
                    max="23"
                    placeholder="—"
                  />
                </div>
                <div class="inline-input-row" style="margin-top:6px;">
                  <span style="font-size:12px;color:#94a3b8;">Min. Tage</span>
                  <input
                    type="number"
                    [(ngModel)]="draft.minDaysPerMonth"
                    min="0"
                    max="23"
                    placeholder="—"
                  />
                </div>
              }
            </div>
          </div>

          <div class="divider"></div>

          <div>
            <div class="section-label">Verfügbarkeit</div>
          </div>
        </div>

        <div class="footer">
          <button class="btn-ghost" (click)="close()">Abbrechen</button>
          <button class="btn-primary" (click)="save()">Speichern</button>
        </div>
      </div>
    </div>
  `,
})
export class UserConstraintsDialogComponent {
  dialogRef = inject(DialogRef);
  data: UserConstraintsDialogData = inject(DIALOG_DATA);

  draft: UserConstraint = { ...this.data.constraints };
  mode: DayMode = this.inferMode();

  get initials() {
    return this.data.user.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get workdays(): number {
    const date = this.data.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0 && day !== 6) count++;
    }
    return count;
  }

  get workedaysLabel(): string {
    return `${this.workdays} Tage`;
  }

  private inferMode(): DayMode {
    const c = this.data.constraints;
    if (c.exactDaysPerMonth != null) return 'exact';
    if (c.maxDaysPerMonth != null || c.minDaysPerMonth != null) return 'minmax';
    return 'fulltime';
  }

  onModeChange() {
    this.draft.exactDaysPerMonth = null as any;
    this.draft.maxDaysPerMonth = null as any;
    this.draft.minDaysPerMonth = null as any;

    if (this.mode === 'fulltime') {
      this.draft.exactDaysPerMonth = this.workdays;
    }
  }

  save() {
    if (this.mode === 'fulltime') {
      this.draft.exactDaysPerMonth = this.workdays;
    }
    this.dialogRef.close(this.draft);
    console.log(this.draft);
  }

  onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close();
  }

  close() {
    this.dialogRef.close(null);
  }
}
