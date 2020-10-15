import { TestBed } from '@angular/core/testing';

import { NovelFactoryService } from './novel-factory.service';

describe('NovelFactoryService', () => {
  let service: NovelFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NovelFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
