import { Component, inject, signal, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SkillsService, Skill } from '../../service/skills-service';
import { StationService } from '../../service/station-service';

@Component({
  selector: 'app-create-station',
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
        <div class="flex items-center gap-3 mb-6">
          <button
            (click)="router.navigate(['/stations'])"
            class="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all duration-150"
          >
            <span class="material-icons-round text-[20px]">arrow_back</span>
          </button>
          <h1 class="text-2xl font-semibold text-slate-800 tracking-tight">
            {{ isEditMode ? 'Edit Station' : 'Create Station' }}
          </h1>
        </div>

        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-visible">
          <div
            class="flex items-center gap-4 px-8 py-6 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl"
          >
            <div
              class="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 text-xl font-semibold flex items-center justify-center select-none"
            >
              {{ form.name ? form.name.charAt(0).toUpperCase() : '?' }}
            </div>
            <div>
              <p class="text-sm font-medium text-slate-700">{{ form.name || 'New Station' }}</p>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ selectedSkills().length > 0 ? selectedSkills().map(s => s.name).join(' · ') : 'Noch keine Kompetenzen' }}
              </p>
            </div>
          </div>

          <div class="px-8 py-7 grid grid-cols-1 gap-5">
            <div class="field-wrap">
              <input
                id="f-name"
                type="text"
                placeholder=" "
                [(ngModel)]="form.name"
                class="w-full h-14 px-3.5 text-sm text-slate-800 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
              <label for="f-name">Stationsbezeichnung</label>
            </div>

            <div>
              <p class="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mb-2">
                Kompetenzen
              </p>

              <div
                (click)="toggleDropdown()"
                [class.ring-2]="dropdownOpen()"
                [class.ring-indigo-100]="dropdownOpen()"
                [class.border-indigo-500]="dropdownOpen()"
                [class.rounded-b-none]="dropdownOpen()"
                class="relative flex items-center justify-between min-h-[56px] px-3.5 border border-slate-300 rounded-xl cursor-pointer transition bg-white"
              >
                <div class="flex flex-wrap gap-1.5 py-2">
                  <ng-container *ngIf="selectedSkills().length > 0; else placeholder">
                    <span
                      *ngFor="let skill of selectedSkills()"
                      class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium pl-3 pr-1.5 py-1 rounded-full"
                    >
                      {{ skill.name }}
                      <button
                        (click)="$event.stopPropagation(); toggleSkill(skill)"
                        class="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors"
                      >
                        <span class="material-icons-round text-[11px]">close</span>
                      </button>
                    </span>
                  </ng-container>
                  <ng-template #placeholder>
                    <span class="text-sm text-slate-400">Kompetenz auswählen...</span>
                  </ng-template>
                </div>
                <span
                  class="material-icons-round text-slate-400 text-[20px] flex-shrink-0 transition-transform duration-150 ml-2"
                  [class.rotate-180]="dropdownOpen()"
                  >expand_more</span
                >
              </div>

              <div
                *ngIf="dropdownOpen()"
                class="border border-t-0 border-slate-300 rounded-b-xl bg-white overflow-hidden z-10 relative"
              >
                <div class="px-3 py-2 border-b border-slate-100">
                  <input
                    #searchInput
                    [ngModel]="skillSearch()"
                    (ngModelChange)="skillSearch.set($event)"
                    (click)="$event.stopPropagation()"
                    placeholder="Kompetenzen durchsuchen..."
                    class="w-full h-8 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition"
                  />
                </div>

                <div class="max-h-52 overflow-y-auto">
                  <ng-container *ngIf="filteredSkills().length > 0; else noResults">
                    <div
                      *ngFor="let skill of filteredSkills()"
                      (click)="toggleSkill(skill)"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div
                        [class.bg-indigo-600]="isSelected(skill)"
                        [class.border-indigo-600]="isSelected(skill)"
                        class="w-4 h-4 rounded flex items-center justify-center border border-slate-300 flex-shrink-0 transition-colors"
                      >
                        <span
                          *ngIf="isSelected(skill)"
                          class="material-icons-round text-white text-[11px]"
                          >check</span
                        >
                      </div>
                      {{ skill.name }}
                    </div>
                  </ng-container>
                  <ng-template #noResults>
                    <p class="text-sm text-slate-400 text-center py-4">
                      Keine Kompetenz "{{ skillSearch() }}"
                    </p>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-end gap-2 px-8 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl"
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
              <span class="material-icons-round text-[17px]">{{
                isEditMode ? 'save' : 'person_add'
              }}</span>
              {{ isEditMode ? 'Save changes' : 'Create Station' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CreateStationComponent {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private stationService = inject(StationService);
  private skillsService = inject(SkillsService);
  private elRef = inject(ElementRef);

  isEditMode = false;
  private editId: number | null = null;

  form = { name: '' };
  dropdownOpen = signal(false);
  skillSearch = signal('');
  selectedSkillIds = signal<Set<number>>(new Set());

  allSkills = this.skillsService.skills;

  selectedSkills = computed(() =>
    this.allSkills().filter((s) => this.selectedSkillIds().has(s.id)),
  );

  filteredSkills = computed(() => {
    const q = this.skillSearch().toLowerCase();
    return q ? this.allSkills().filter((s) => s.name.toLowerCase().includes(q)) : this.allSkills();
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editId = +id;
      this.stationService.getById(+id).subscribe((station) => {
        if (station) {
          this.form.name = station.name;
          const ids = new Set(
            this.allSkills()
              .filter((s) => station.skills_needed.includes(s.name))
              .map((s) => s.id),
          );
          this.selectedSkillIds.set(ids);
        }
      });
    }
  }
  toggleDropdown() {
    this.dropdownOpen.update((v) => !v);
    this.skillSearch.set('');
  }

  toggleSkill(skill: Skill) {
    this.selectedSkillIds.update((ids) => {
      const next = new Set(ids);
      next.has(skill.id) ? next.delete(skill.id) : next.add(skill.id);
      return next;
    });
  }

  isSelected(skill: Skill): boolean {
    return this.selectedSkillIds().has(skill.id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.dropdownOpen.set(false);
    }
  }

  submit() {
    if (!this.form.name.trim()) return;
    const data = {
      name: this.form.name.trim(),
      skills_needed: this.selectedSkills().map((s) => s.name),
    };
    if (this.isEditMode && this.editId) {
      this.stationService
        .update(this.editId, data)
        .subscribe(() => this.router.navigate(['/stations']));
    } else {
      this.stationService.add(data).subscribe(() => this.router.navigate(['/stations']));
    }
  }

  cancel() {
    this.router.navigate(['/stations']);
  }
}
