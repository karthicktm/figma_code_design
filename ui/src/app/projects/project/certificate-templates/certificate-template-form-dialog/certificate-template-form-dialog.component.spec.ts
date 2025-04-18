import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateTemplateFormDialogComponent } from './certificate-template-form-dialog.component';

describe('CertificateTemplateFormDialogComponent', () => {
  let component: CertificateTemplateFormDialogComponent;
  let fixture: ComponentFixture<CertificateTemplateFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateTemplateFormDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertificateTemplateFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
