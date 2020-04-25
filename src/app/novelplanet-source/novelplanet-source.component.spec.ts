import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelplanetSourceComponent } from './novelplanet-source.component';

describe('NovelplanetSourceComponent', () => {
  let component: NovelplanetSourceComponent;
  let fixture: ComponentFixture<NovelplanetSourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NovelplanetSourceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NovelplanetSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
