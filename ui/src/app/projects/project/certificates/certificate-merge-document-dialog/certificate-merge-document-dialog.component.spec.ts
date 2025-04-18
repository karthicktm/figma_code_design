import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateMergeDocumentDialogComponent } from './certificate-merge-document-dialog.component';

describe('CertificateMergeDocumentDialogComponent', () => {
  let component: CertificateMergeDocumentDialogComponent;
  let fixture: ComponentFixture<CertificateMergeDocumentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateMergeDocumentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateMergeDocumentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
