import { TestBed } from '@angular/core/testing';

import { SourceServiceManagerService } from './source-service-manager.service';

describe('SourceServiceManagerService', () => {
  let service: SourceServiceManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SourceServiceManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
