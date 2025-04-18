import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSectionFormComponent } from './user-section-form.component';

describe('UserSectionFormComponent', () => {
  let component: UserSectionFormComponent;
  let fixture: ComponentFixture<UserSectionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserSectionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSectionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
