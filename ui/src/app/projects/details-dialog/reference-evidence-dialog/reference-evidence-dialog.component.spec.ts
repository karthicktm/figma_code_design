import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenceEvidenceDialogComponent } from './reference-evidence-dialog.component';

describe('ReferenceEvidenceDialogComponent', () => {
  let component: ReferenceEvidenceDialogComponent;
  let fixture: ComponentFixture<ReferenceEvidenceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReferenceEvidenceDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferenceEvidenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
