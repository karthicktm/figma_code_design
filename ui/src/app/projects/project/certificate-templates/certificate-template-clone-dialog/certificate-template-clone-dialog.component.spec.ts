import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { CertificateTemplateCloneDialogComponent } from './certificate-template-clone-dialog.component';

describe('CertificateTemplateCloneDialogComponent', () => {
  let component: CertificateTemplateCloneDialogComponent;
  let fixture: ComponentFixture<CertificateTemplateCloneDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificateTemplateCloneDialogComponent],
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateTemplateCloneDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
