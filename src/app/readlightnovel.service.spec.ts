import { TestBed } from '@angular/core/testing';

import { ReadlightnovelService } from './readlightnovel.service';

describe('ReadlightnovelService', () => {
  let service: ReadlightnovelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReadlightnovelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
