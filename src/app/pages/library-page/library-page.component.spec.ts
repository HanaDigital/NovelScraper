import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryPageComponent } from './library-page.component';

describe('LibraryPageComponent', () => {
  let component: LibraryPageComponent;
  let fixture: ComponentFixture<LibraryPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LibraryPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LibraryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
