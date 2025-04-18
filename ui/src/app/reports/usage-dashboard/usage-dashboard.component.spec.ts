import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageDashboardComponent } from './usage-dashboard.component';

describe('UsageDashboardComponent', () => {
  let component: UsageDashboardComponent;
  let fixture: ComponentFixture<UsageDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsageDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsageDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
