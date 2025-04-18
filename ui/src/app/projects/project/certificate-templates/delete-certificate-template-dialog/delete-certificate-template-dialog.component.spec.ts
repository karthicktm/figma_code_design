import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteCertificateTemplateDialogComponent } from './delete-certificate-template-dialog.component';

describe('DeleteCertificateTemplateDialogComponent', () => {
  let component: DeleteCertificateTemplateDialogComponent;
  let fixture: ComponentFixture<DeleteCertificateTemplateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteCertificateTemplateDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeleteCertificateTemplateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
