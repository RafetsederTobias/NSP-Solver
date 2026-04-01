import { Injectable, signal } from '@angular/core';

export interface Station {
  id: number;
  name: string;
  skills_needed: string[];
}

@Injectable({
  providedIn: 'root',
})
export class StationService {
  private _stations = signal<Station[]>([
    { id: 1,  name: 'Leitung / V.',  skills_needed: ['Blutabnahme', 'EKG', 'Röntgen'] },
    { id: 2,  name: 'Koord. TK',     skills_needed: ['EKG', 'Röntgen'] },
    { id: 3,  name: 'Koord. Amb.',   skills_needed: ['Blutabnahme'] },
    { id: 4,  name: 'OP 1',          skills_needed: ['Blutabnahme', 'EKG'] },
    { id: 5,  name: 'OP 2',          skills_needed: ['Blutabnahme', 'EKG'] },
    { id: 6,  name: 'OP Vorb.',      skills_needed: ['Röntgen'] },
    { id: 7,  name: 'KAT 1',         skills_needed: ['Blutabnahme'] },
    { id: 8,  name: 'KAT 2',         skills_needed: ['Blutabnahme'] },
    { id: 9,  name: 'KAT Vorb.',     skills_needed: ['EKG', 'Röntgen'] },
    { id: 10, name: 'Laser',         skills_needed: ['Röntgen'] },
    { id: 11, name: 'IVOM',          skills_needed: ['Blutabnahme', 'Röntgen'] },
    { id: 12, name: 'Stützpunkt',    skills_needed: ['EKG'] },
    { id: 13, name: 'EGR 3',         skills_needed: ['Blutabnahme', 'EKG'] },
    { id: 14, name: 'Vers. Ass.',    skills_needed: ['Röntgen'] },
    { id: 15, name: 'Akut',          skills_needed: ['Blutabnahme', 'EKG', 'Röntgen'] },
    { id: 16, name: 'Lid',           skills_needed: ['EKG'] },
    { id: 17, name: 'Rondeau',       skills_needed: ['Blutabnahme'] },
    { id: 18, name: 'Allgemein',     skills_needed: ['Röntgen'] },
    { id: 19, name: 'Makula',        skills_needed: ['Blutabnahme', 'EKG'] },
    { id: 20, name: 'Refr. VU',      skills_needed: ['EKG', 'Röntgen'] },
    { id: 21, name: 'Kat VU',        skills_needed: ['Blutabnahme'] },
    { id: 22, name: 'Springer',      skills_needed: ['Blutabnahme', 'EKG', 'Röntgen'] },
  ]);

  readonly stations = this._stations.asReadonly();

  getById(id: number): Station | undefined {
    return this._stations().find(s => s.id === id);
  }

  add(data: Omit<Station, 'id'>): void {
    const id = Date.now();
    this._stations.update(list => [...list, { id, ...data }]);
  }

  update(id: number, data: Omit<Station, 'id'>): void {
    this._stations.update(list =>
      list.map(s => s.id === id ? { id, ...data } : s)
    );
  }

  delete(id: number): void {
    this._stations.update(list => list.filter(s => s.id !== id));
  }
}