import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationResDialogComponent } from './validation-res-dialog.component';

describe('ValidationResDialogComponent', () => {
  let component: ValidationResDialogComponent;
  let fixture: ComponentFixture<ValidationResDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidationResDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidationResDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
