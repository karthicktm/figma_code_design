import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCertificateRequiredInformationComponent } from './create-certificate-required-information.component';

describe('CreateCertificateRequiredInformationComponent', () => {
  let component: CreateCertificateRequiredInformationComponent;
  let fixture: ComponentFixture<CreateCertificateRequiredInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateCertificateRequiredInformationComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateCertificateRequiredInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
