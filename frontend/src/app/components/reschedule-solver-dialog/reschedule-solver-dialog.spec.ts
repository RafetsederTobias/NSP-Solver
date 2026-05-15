import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescheduleSolverDialog } from './reschedule-solver-dialog';

describe('RescheduleSolverDialog', () => {
  let component: RescheduleSolverDialog;
  let fixture: ComponentFixture<RescheduleSolverDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescheduleSolverDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RescheduleSolverDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
