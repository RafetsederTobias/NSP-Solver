// user-page.component.ts (STANDALONE)
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatButtonModule
  ],
  template: `
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Users</h1>
      <button mat-raised-button color="primary" (click)="addUser()">
        Add User
      </button>
    </div>

    <table mat-table [dataSource]="users" class="w-full bg-white rounded-xl shadow">

      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>ID</th>
        <td mat-cell *matCellDef="let user">{{ user.id }}</td>
      </ng-container>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let user">{{ user.name }}</td>
      </ng-container>

      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let user">{{ user.email }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let user" class="space-x-2">
          <button mat-button color="accent" (click)="editUser(user)">
            Edit
          </button>
          <button mat-button color="warn" (click)="deleteUser(user)">
            Delete
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>
  </div>
  `
})
export class Users {
  users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  displayedColumns = ['id', 'name', 'email', 'actions'];

  addUser() {
    const name = prompt('Enter name');
    const email = prompt('Enter email');

    if (name && email) {
      this.users.push({
        id: Date.now(),
        name,
        email
      });
    }
  }

  editUser(user: User) {
    const name = prompt('Edit name', user.name);
    const email = prompt('Edit email', user.email);

    if (name && email) {
      user.name = name;
      user.email = email;
    }
  }

  deleteUser(user: User) {
    this.users = this.users.filter(u => u.id !== user.id);
  }
}

