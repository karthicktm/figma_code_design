import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCertificateStep2Component } from './create-certificate-step2.component';

describe('CreateCertificateStep2Component', () => {
  let component: CreateCertificateStep2Component;
  let fixture: ComponentFixture<CreateCertificateStep2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateCertificateStep2Component]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateCertificateStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
