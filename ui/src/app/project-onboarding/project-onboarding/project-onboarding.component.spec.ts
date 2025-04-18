import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectOnboardingComponent } from './project-onboarding.component';

describe('ProjectOnboardingComponent', () => {
  let component: ProjectOnboardingComponent;
  let fixture: ComponentFixture<ProjectOnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectOnboardingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
