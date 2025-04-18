import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteUserConfirmDialogComponent } from './delete-user-confirm-dialog.component';

describe('DeleteUserConfirmDialogComponent', () => {
  let component: DeleteUserConfirmDialogComponent;
  let fixture: ComponentFixture<DeleteUserConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteUserConfirmDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteUserConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
