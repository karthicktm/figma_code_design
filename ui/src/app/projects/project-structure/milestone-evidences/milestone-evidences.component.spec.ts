import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilestoneEvidencesComponent } from './milestone-evidences.component';

describe('MilestoneEvidencesComponent', () => {
  let component: MilestoneEvidencesComponent;
  let fixture: ComponentFixture<MilestoneEvidencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MilestoneEvidencesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MilestoneEvidencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
