import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormMilestoneEvidencesComponent } from './acceptance-package-form-milestone-evidences.component';

describe('AcceptancePackageFormMilestoneEvidencesComponent', () => {
  let component: AcceptancePackageFormMilestoneEvidencesComponent;
  let fixture: ComponentFixture<AcceptancePackageFormMilestoneEvidencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptancePackageFormMilestoneEvidencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormMilestoneEvidencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
