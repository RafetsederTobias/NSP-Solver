import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkillsService } from '../../service/skills-service';

@Component({
  selector: 'app-skill-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 px-6 py-10">
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-semibold text-slate-800 tracking-tight">Kompetenzen</h1>
        </div>

        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
          <div class="flex gap-2 mb-5">
            <input
              [(ngModel)]="newSkill"
              (keydown.enter)="addSkill()"
              placeholder="Neue Kompetenz einfügen…"
              [class.ring-red-300]="duplicate()"
              [class.ring-2]="duplicate()"
              class="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-300 transition"
            />

            <button
              (click)="addSkill()"
              class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-all duration-150"
            >
              <span class="material-icons-round text-[18px]">add</span>
              Kompetenz hinzufügen
            </button>
          </div>

          <div *ngIf="skills().length > 0; else empty" class="flex flex-wrap gap-2">
            <span
              *ngFor="let skill of skills()"
              class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm font-medium pl-3.5 pr-2 py-1.5 rounded-full"
            >
              {{ skill.name }}
              <button
                (click)="deleteSkill(skill.id)"
                class="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors duration-150"
              >
                <span class="material-icons-round text-[13px]">close</span>
              </button>
            </span>
          </div>

          <ng-template #empty>
            <div class="flex flex-col items-center py-12 gap-2 text-center">
              <div
                class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-1"
              >
                <span class="material-icons-round text-[22px] text-slate-400">label_outline</span>
              </div>
              <p class="text-sm font-medium text-slate-600">Noch keine Kompetenzen hinterlegt</p>
              <p class="text-xs text-slate-400">Füge sie mit dem Button hinzu.</p>
            </div>
          </ng-template>
        </div>

        <p *ngIf="skills().length > 0" class="text-xs text-slate-400 text-right mt-2 mr-1">
          {{ skills().length }} skill{{ skills().length === 1 ? '' : 's' }}
        </p>
      </div>
    </div>
  `,
})
export class Skills {
  private skillsService = inject(SkillsService);
  skills = this.skillsService.skills;
  newSkill = '';
  duplicate = signal(false);

  addSkill() {
    const val = this.newSkill.trim();
    if (!val) return;
    if (this.skills().some((s) => s.name.toLowerCase() === val.toLowerCase())) {
      this.duplicate.set(true);
      setTimeout(() => this.duplicate.set(false), 1200);
      return;
    }
    this.skillsService.add({ name: val });
    this.newSkill = '';
  }

  deleteSkill(id: number) {
    this.skillsService.delete(id);
  }
}
