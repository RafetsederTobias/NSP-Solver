import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolverDialog } from './solver-dialog';

describe('SolverDialog', () => {
  let component: SolverDialog;
  let fixture: ComponentFixture<SolverDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolverDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolverDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
