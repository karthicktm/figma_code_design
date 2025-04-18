import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkDecisionDialogComponent } from './bulk-decision-dialog.component';

describe('BulkDecisionDialogComponent', () => {
  let component: BulkDecisionDialogComponent;
  let fixture: ComponentFixture<BulkDecisionDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BulkDecisionDialogComponent]
    });
    fixture = TestBed.createComponent(BulkDecisionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
