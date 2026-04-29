import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WorkdayService {
  countWorkdays(date: Date): number {
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
}