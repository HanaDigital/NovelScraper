import { TestBed } from '@angular/core/testing';

import { BoxnovelService } from './boxnovel.service';

describe('BoxnovelService', () => {
  let service: BoxnovelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoxnovelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
