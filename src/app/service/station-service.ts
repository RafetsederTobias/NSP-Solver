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
    { id: 1, name: 'Station 3', skills_needed: ['SEHR gute Augen'] },
    { id: 2, name: 'Station 6', skills_needed: ['Jonglieren', 'Freundlichkeit :)'] },
  ]);

  readonly stations = this._stations.asReadonly();

  getById(id: number): Station | undefined {
    return this._stations().find(u => u.id === id);
  }

  add(data: Omit<Station, 'id'>): void {
    const id = Date.now();
    this._stations.update(list => [...list, { id, ...data }]);
  }

  update(id: number, data: Omit<Station, 'id'>): void {
    this._stations.update(list =>
      list.map(u => u.id === id ? { id, ...data } : u)
    );
  }

  delete(id: number): void {
    this._stations.update(list => list.filter(u => u.id !== id));
  }
}
