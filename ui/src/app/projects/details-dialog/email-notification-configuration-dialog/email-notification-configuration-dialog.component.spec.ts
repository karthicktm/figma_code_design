import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailNotificationConfigurationDialogComponent } from './email-notification-configuration-dialog.component';

describe('EmailNotificationConfigurationDialogComponent', () => {
  let component: EmailNotificationConfigurationDialogComponent;
  let fixture: ComponentFixture<EmailNotificationConfigurationDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmailNotificationConfigurationDialogComponent]
    });
    fixture = TestBed.createComponent(EmailNotificationConfigurationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
