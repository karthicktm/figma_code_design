import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewCertificateTemplateDialogComponent } from './preview-certificate-template-dialog.component';

describe('PreviewCertificateTemplateDialogComponent', () => {
  let component: PreviewCertificateTemplateDialogComponent;
  let fixture: ComponentFixture<PreviewCertificateTemplateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewCertificateTemplateDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreviewCertificateTemplateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
