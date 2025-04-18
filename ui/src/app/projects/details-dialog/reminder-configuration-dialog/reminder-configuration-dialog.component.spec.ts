import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderConfigurationDialogComponent } from './reminder-configuration-dialog.component';

describe('ReminderConfigurationDialogComponent', () => {
  let component: ReminderConfigurationDialogComponent;
  let fixture: ComponentFixture<ReminderConfigurationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReminderConfigurationDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReminderConfigurationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
