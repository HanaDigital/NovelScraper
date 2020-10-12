import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelCardComponent } from './novel-card.component';

describe('NovelCardComponent', () => {
  let component: NovelCardComponent;
  let fixture: ComponentFixture<NovelCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NovelCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NovelCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
