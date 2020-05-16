import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelfullSourceComponent } from './novelfull-source.component';

describe('NovelfullSourceComponent', () => {
  let component: NovelfullSourceComponent;
  let fixture: ComponentFixture<NovelfullSourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NovelfullSourceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NovelfullSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
