import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCertificatesComponent } from './dashboard-certificates.component';

describe('DashboardCertificatesComponent', () => {
  let component: DashboardCertificatesComponent;
  let fixture: ComponentFixture<DashboardCertificatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCertificatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCertificatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
