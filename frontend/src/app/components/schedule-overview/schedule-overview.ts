import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleService } from '../../service/schedule-service';

interface Schedule {
  id: number;
  name: string;
  year: number;
  month: number;
  is_loaded: boolean;
}

@Component({
  selector: 'app-schedule-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-overview.html',
  styleUrl: './schedule-overview.css',
})
export class ScheduleOverviewComponent implements OnInit {
  selectedSchedule = signal<Schedule | null>(null);

  openDialog(schedule: Schedule): void {
    this.selectedSchedule.set(schedule);
  }

  closeDialog(): void {
    this.selectedSchedule.set(null);
  }

  confirmLoad(): void {
    // TODO
    this.closeDialog();
  }
  readonly monthNames = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];
  private scheduleService = inject(ScheduleService);

  readonly groupedByYear = computed(() => {
    const map = new Map<number, Schedule[]>();
    for (const s of this.scheduleService.schedules()) {
      if (!map.has(s.year)) map.set(s.year, []);
      map.get(s.year)!.push(s);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, months]) => ({
        year,
        months: months.sort((a, b) => a.month - b.month),
      }));
  });

  ngOnInit(): void {
    this.scheduleService.loadAll().subscribe();
  }
  getMonthName(month: number): string {
    return this.monthNames[month - 1];
  }
}
