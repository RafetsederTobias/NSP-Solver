import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescheduleConstraintDialog } from './reschedule-constraint-dialog';

describe('RescheduleConstraintDialog', () => {
  let component: RescheduleConstraintDialog;
  let fixture: ComponentFixture<RescheduleConstraintDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescheduleConstraintDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RescheduleConstraintDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
