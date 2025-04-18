import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaEvidenceDialogComponent } from './ra-evidence-dialog.component';

describe('RaEvidenceDialogComponent', () => {
  let component: RaEvidenceDialogComponent;
  let fixture: ComponentFixture<RaEvidenceDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RaEvidenceDialogComponent]
    });
    fixture = TestBed.createComponent(RaEvidenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
