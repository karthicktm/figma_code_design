import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSubmitDialogMessageComponent } from './create-submit-dialog-message.component';

describe('CreateSubmitDialogMessageComponent', () => {
  let component: CreateSubmitDialogMessageComponent;
  let fixture: ComponentFixture<CreateSubmitDialogMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateSubmitDialogMessageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSubmitDialogMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
