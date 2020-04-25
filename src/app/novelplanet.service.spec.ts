import { TestBed } from '@angular/core/testing';

import { NovelplanetService } from './novelplanet.service';

describe('NovelplanetService', () => {
  let service: NovelplanetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NovelplanetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
