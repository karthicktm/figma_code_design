import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferEvidencesDialogComponent } from './transfer-evidences-dialog.component';

describe('TransferEvidencesDialogComponent', () => {
  let component: TransferEvidencesDialogComponent;
  let fixture: ComponentFixture<TransferEvidencesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferEvidencesDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferEvidencesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
