import { TestBed } from '@angular/core/testing';

import { NovelfullService } from './novelfull.service';

describe('NovelfullService', () => {
  let service: NovelfullService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NovelfullService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
