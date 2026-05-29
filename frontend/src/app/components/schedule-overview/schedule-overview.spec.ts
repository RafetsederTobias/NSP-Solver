import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleOverview } from './schedule-overview';

describe('ScheduleOverview', () => {
  let component: ScheduleOverview;
  let fixture: ComponentFixture<ScheduleOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
