import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCertificateStep3Component } from './create-certificate-step3.component';

describe('CreateCertificateStep3Component', () => {
  let component: CreateCertificateStep3Component;
  let fixture: ComponentFixture<CreateCertificateStep3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCertificateStep3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateCertificateStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
