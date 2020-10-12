import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SourcesPageComponent } from './sources-page.component';

describe('SourcesPageComponent', () => {
  let component: SourcesPageComponent;
  let fixture: ComponentFixture<SourcesPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SourcesPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SourcesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
