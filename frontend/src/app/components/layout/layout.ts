import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
const ROUTE_LABELS: Record<string, string> = {
  '/calendar': 'Kalender',
  '/users': 'Mitarbeiter',
  '/stations': 'Stationen',
  '/skills': 'Kompetenzen',
};
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  styles: [
    `
      :host {
        display: flex;
        height: 100vh;
        overflow: hidden;
      }

      .sidenav {
        width: 220px;
        flex-shrink: 0;
        height: 100vh;
        background: white;
        border-right: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        padding: 1.25rem 0.75rem;
        gap: 4px;
      }

      .sidenav-logo {
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        padding: 0.25rem 0.75rem 1.25rem;
        letter-spacing: -0.01em;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0.5rem 0.75rem;
        border-radius: 10px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
        text-decoration: none;
        transition:
          background 0.15s,
          color 0.15s;
      }
      .nav-item:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
      .nav-item.active {
        background: #eef2ff;
        color: #6366f1;
      }
      .nav-item .icon {
        font-family: 'Material Icons Round';
        font-size: 18px;
        line-height: 1;
        width: 18px;
      }

      .main-wrap {
        flex: 1;
        overflow: hidden;
      }

      .content {
        flex: 1;
        overflow-y: auto;
        height: 100%;
      }
    `,
  ],
  template: `
    <aside class="sidenav">
      <div class="sidenav-logo">NSP-Solver</div>

      <a class="nav-item" routerLink="/calendar" routerLinkActive="active">
        <span class="material-icons-round icon">calendar_month</span>
        Kalender
      </a>
      <a class="nav-item" routerLink="/users" routerLinkActive="active">
        <span class="material-icons-round icon">group</span>
        Mitarbeiter
      </a>
      <a class="nav-item" routerLink="/stations" routerLinkActive="active">
        <span class="material-icons-round icon">business</span>
        Stationen
      </a>
      <a class="nav-item" routerLink="/skills" routerLinkActive="active">
        <span class="material-icons-round icon">workspace_premium</span>
        Kompetenzen
      </a>
      <a class="nav-item" routerLink="/schedules" routerLinkActive="active">
        <span class="material-icons-round icon">event_note</span>
        Pläne
      </a>
    </aside>

    <div class="main-wrap">
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class Layout {
  private router = inject(Router);

  get pageTitle(): string {
    const path = '/' + this.router.url.split('/')[1];
    return ROUTE_LABELS[path] ?? 'Menü';
  }
}
