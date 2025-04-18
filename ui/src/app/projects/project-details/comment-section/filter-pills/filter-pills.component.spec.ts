import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterPillsComponent } from './filter-pills.component';

describe('FilterPillsComponent', () => {
  let component: FilterPillsComponent;
  let fixture: ComponentFixture<FilterPillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterPillsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterPillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
