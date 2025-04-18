import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadReferencedEvidenceDialogComponent } from 'src/app/projects/upload-referenced-evidence-dialog/upload-referenced-evidence-dialog.component';

describe('UploadReferencedEvidenceDialogComponent', () => {
  let component: UploadReferencedEvidenceDialogComponent;
  let fixture: ComponentFixture<UploadReferencedEvidenceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadReferencedEvidenceDialogComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadReferencedEvidenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
