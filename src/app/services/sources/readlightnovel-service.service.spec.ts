import { TestBed } from '@angular/core/testing';

import { ReadlightnovelServiceService } from './readlightnovel-service.service';

describe('ReadlightnovelServiceService', () => {
  let service: ReadlightnovelServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReadlightnovelServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
