import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadlightnovelSourceComponent } from './readlightnovel-source.component';

describe('ReadlightnovelSourceComponent', () => {
  let component: ReadlightnovelSourceComponent;
  let fixture: ComponentFixture<ReadlightnovelSourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadlightnovelSourceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadlightnovelSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
