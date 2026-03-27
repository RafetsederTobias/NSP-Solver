import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../service/user-service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    `
      .field-wrap {
        position: relative;
      }
      .field-wrap label {
        position: absolute;
        left: 0.875rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.9375rem;
        color: #6b7280;
        pointer-events: none;
        transition: all 0.15s ease;
      }
      .field-wrap input:focus ~ label,
      .field-wrap input:not(:placeholder-shown) ~ label {
        top: -0.5rem;
        font-size: 0.75rem;
        color: #6366f1;
        background: white;
        padding: 0 4px;
      }
    `,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 px-6 py-10">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-6">
          <button
            (click)="router.navigate(['/users'])"
            class="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all duration-150"
          >
            <span class="material-icons-round text-[20px]">arrow_back</span>
          </button>
          <h1 class="text-2xl font-semibold text-slate-800 tracking-tight">
            {{ isEditMode ? 'Edit User' : 'Create User' }}
          </h1>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <!-- Avatar preview -->
          <div class="flex items-center gap-4 px-8 py-6 border-b border-slate-100 bg-slate-50/60">
            <div
              class="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 text-xl font-semibold flex items-center justify-center select-none"
            >
              {{ form.name ? form.name.charAt(0).toUpperCase() : '?' }}
            </div>
            <div>
              <p class="text-sm font-medium text-slate-700">{{ form.name || 'New user' }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ form.kompetenzen || 'No skills yet' }}</p>
            </div>
          </div>

          <!-- Fields -->
          <div class="px-8 py-7 grid grid-cols-1 gap-5">
            <div class="field-wrap">
              <input
                id="f-name"
                type="text"
                placeholder=" "
                [(ngModel)]="form.name"
                class="w-full h-14 px-3.5 text-sm text-slate-800 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
              <label for="f-name">Full name</label>
            </div>

            <div class="field-wrap">
              <input
                id="f-kompetenzen"
                type="text"
                placeholder=" "
                [(ngModel)]="form.kompetenzen"
                class="w-full h-14 px-3.5 text-sm text-slate-800 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
              <label for="f-kompetenzen">Kompetenzen (comma-separated)</label>
            </div>
          </div>

          <!-- Footer actions -->
          <div
            class="flex items-center justify-end gap-2 px-8 py-5 border-t border-slate-100 bg-slate-50/60"
          >
            <button
              (click)="cancel()"
              class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              (click)="submit()"
              [disabled]="!form.name.trim()"
              class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-sm transition"
            >
              <span class="material-icons-round text-[17px]">person_add</span>
              {{ isEditMode ? 'Save changes' : 'Create user' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CreateUserComponent {
  router = inject(Router);

  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  isEditMode = false;
  private editId: number | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editId = +id;
      const user = this.userService.getById(+id);
      if (user) {
        this.form = { name: user.name, kompetenzen: user.kompetenzen.join(', ') };
      }
    }
  }

  form = { name: '', kompetenzen: '' };

  submit() {
    if (!this.form.name.trim()) return;
    const data = {
      name: this.form.name.trim(),
      kompetenzen: this.form.kompetenzen
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    };
    if (this.isEditMode && this.editId) {
      this.userService.update(this.editId, data);
    } else {
      this.userService.add(data);
    }
    this.router.navigate(['/users']);
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
