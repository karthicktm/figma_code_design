import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkPlanPackagesComponent } from './work-plan-packages.component';

describe('WorkPlanPackagesComponent', () => {
  let component: WorkPlanPackagesComponent;
  let fixture: ComponentFixture<WorkPlanPackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkPlanPackagesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkPlanPackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
