import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateWorkPlanListComponent } from './certificate-work-plan-list.component';

describe('CertificateWorkPlanListComponent', () => {
  let component: CertificateWorkPlanListComponent;
  let fixture: ComponentFixture<CertificateWorkPlanListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateWorkPlanListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertificateWorkPlanListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
