import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateSigningDialogComponent } from './certificate-signing-dialog.component';

describe('CertificateSigningDialogComponent', () => {
  let component: CertificateSigningDialogComponent;
  let fixture: ComponentFixture<CertificateSigningDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateSigningDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertificateSigningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
