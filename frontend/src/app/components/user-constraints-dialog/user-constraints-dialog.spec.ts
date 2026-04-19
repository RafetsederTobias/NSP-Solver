import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserConstraintsDialogComponent } from './user-constraints-dialog';

describe('UserConstraintsDialog', () => {
  let component: UserConstraintsDialogComponent;
  let fixture: ComponentFixture<UserConstraintsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserConstraintsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserConstraintsDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
