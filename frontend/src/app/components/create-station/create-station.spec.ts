import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStationComponent } from './create-station';

describe('CreateStation', () => {
  let component: CreateStationComponent;
  let fixture: ComponentFixture<CreateStationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateStationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
