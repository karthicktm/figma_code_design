import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteMilestoneEvidencesComponent } from './site-milestone-evidences.component';

describe('SiteMilestoneEvidencesComponent', () => {
  let component: SiteMilestoneEvidencesComponent;
  let fixture: ComponentFixture<SiteMilestoneEvidencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteMilestoneEvidencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteMilestoneEvidencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
