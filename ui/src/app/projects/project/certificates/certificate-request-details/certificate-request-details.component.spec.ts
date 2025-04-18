import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateRequestDetailsComponent } from './certificate-request-details.component';

describe('CertificateRequestDetailsComponent', () => {
  let component: CertificateRequestDetailsComponent;
  let fixture: ComponentFixture<CertificateRequestDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateRequestDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertificateRequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
