import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineItemDecisionConfirmationDialogComponent } from './line-item-decision-confirmation-dialog.component';

describe('LineItemDecisionConfirmationDialogComponent', () => {
  let component: LineItemDecisionConfirmationDialogComponent;
  let fixture: ComponentFixture<LineItemDecisionConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LineItemDecisionConfirmationDialogComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LineItemDecisionConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
