import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBottomSheet } from './user-bottom-sheet';

describe('UserBottomSheet', () => {
  let component: UserBottomSheet;
  let fixture: ComponentFixture<UserBottomSheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserBottomSheet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserBottomSheet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
