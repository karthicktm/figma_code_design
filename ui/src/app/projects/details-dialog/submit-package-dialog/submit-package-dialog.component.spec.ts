import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitPackageDialogComponent } from './submit-package-dialog.component';

describe('SubmitPackageDialogComponent', () => {
  let component: SubmitPackageDialogComponent;
  let fixture: ComponentFixture<SubmitPackageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmitPackageDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitPackageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
