import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkPlanCertificateRequestsComponent } from './work-plan-certificate-requests.component';

describe('WorkPlanCertificateRequestsComponent', () => {
  let component: WorkPlanCertificateRequestsComponent;
  let fixture: ComponentFixture<WorkPlanCertificateRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkPlanCertificateRequestsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkPlanCertificateRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
