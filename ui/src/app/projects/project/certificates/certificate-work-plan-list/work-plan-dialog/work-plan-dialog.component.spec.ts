import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkPlanDialogComponent } from './work-plan-dialog.component';

describe('WorkPlanDialogComponent', () => {
  let component: WorkPlanDialogComponent;
  let fixture: ComponentFixture<WorkPlanDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkPlanDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkPlanDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
