import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageDashboardFilterComponent } from './usage-dashboard-filter.component';

describe('UsageDashboardFilterComponent', () => {
  let component: UsageDashboardFilterComponent;
  let fixture: ComponentFixture<UsageDashboardFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsageDashboardFilterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsageDashboardFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
