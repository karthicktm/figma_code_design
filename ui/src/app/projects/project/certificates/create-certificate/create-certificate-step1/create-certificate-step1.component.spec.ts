import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateCertificateStep1Component } from './create-certificate-step1.component';

describe('SelectWorkplanComponent', () => {
  let component: CreateCertificateStep1Component;
  let fixture: ComponentFixture<CreateCertificateStep1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateCertificateStep1Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCertificateStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
