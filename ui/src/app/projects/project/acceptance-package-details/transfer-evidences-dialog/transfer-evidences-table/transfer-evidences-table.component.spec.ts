import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferEvidencesTableComponent } from './transfer-evidences-table.component';

describe('TransferEvidencesTableComponent', () => {
  let component: TransferEvidencesTableComponent;
  let fixture: ComponentFixture<TransferEvidencesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferEvidencesTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferEvidencesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
