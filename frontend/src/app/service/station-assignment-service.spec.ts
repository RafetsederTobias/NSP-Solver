import { TestBed } from '@angular/core/testing';

import { StationAssignmentService } from './station-assignment-service';

describe('StationAssignmentService', () => {
  let service: StationAssignmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StationAssignmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
