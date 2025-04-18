import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificatePreviewDialogComponent } from './certificate-preview-dialog.component';

describe('CertificatePreviewDialogComponent', () => {
  let component: CertificatePreviewDialogComponent;
  let fixture: ComponentFixture<CertificatePreviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificatePreviewDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertificatePreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
