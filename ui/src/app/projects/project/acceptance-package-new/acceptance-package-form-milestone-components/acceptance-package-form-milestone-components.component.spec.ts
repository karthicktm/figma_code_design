import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormMilestoneComponentsComponent } from './acceptance-package-form-milestone-components.component';

describe('AcceptancePackageFormMilestoneComponentsComponent', () => {
  let component: AcceptancePackageFormMilestoneComponentsComponent;
  let fixture: ComponentFixture<AcceptancePackageFormMilestoneComponentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptancePackageFormMilestoneComponentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormMilestoneComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
