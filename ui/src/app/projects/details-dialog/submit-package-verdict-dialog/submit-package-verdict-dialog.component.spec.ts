import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitPackageVerdictDialogComponent } from './submit-package-verdict-dialog.component';

describe('SubmitPackageVerdictDialogComponent', () => {
  let component: SubmitPackageVerdictDialogComponent;
  let fixture: ComponentFixture<SubmitPackageVerdictDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmitPackageVerdictDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitPackageVerdictDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
