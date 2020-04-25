import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxnovelSourceComponent } from './boxnovel-source.component';

describe('BoxnovelSourceComponent', () => {
  let component: BoxnovelSourceComponent;
  let fixture: ComponentFixture<BoxnovelSourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoxnovelSourceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoxnovelSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
