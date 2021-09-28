import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthYearComponent } from './month-year.component';

describe('MonthYearComponent', () => {
  let component: MonthYearComponent;
  let fixture: ComponentFixture<MonthYearComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthYearComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthYearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
