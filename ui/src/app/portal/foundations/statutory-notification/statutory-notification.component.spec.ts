import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatutoryNotificationComponent } from './statutory-notification.component';

describe('StatutoryNotificationComponent', () => {
  let component: StatutoryNotificationComponent;
  let fixture: ComponentFixture<StatutoryNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatutoryNotificationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatutoryNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
