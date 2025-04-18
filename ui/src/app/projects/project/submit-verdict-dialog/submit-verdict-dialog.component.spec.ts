import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitVerdictDialogComponent } from './submit-verdict-dialog.component';

describe('SubmitVerdictDialogComponent', () => {
  let component: SubmitVerdictDialogComponent;
  let fixture: ComponentFixture<SubmitVerdictDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmitVerdictDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitVerdictDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
