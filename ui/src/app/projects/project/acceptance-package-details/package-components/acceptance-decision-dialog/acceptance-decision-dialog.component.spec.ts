import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptanceDecisionDialogComponent } from './acceptance-decision-dialog.component';

describe('AcceptanceDecisionDialogComponent', () => {
  let component: AcceptanceDecisionDialogComponent;
  let fixture: ComponentFixture<AcceptanceDecisionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptanceDecisionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptanceDecisionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
