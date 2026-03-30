import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStation } from './create-station';

describe('CreateStation', () => {
  let component: CreateStation;
  let fixture: ComponentFixture<CreateStation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateStation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
