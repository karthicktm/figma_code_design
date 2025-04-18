import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkItemInfoDialogComponent } from './work-item-info-dialog.component';

describe('WorkplanInfoComponent', () => {
  let component: WorkItemInfoDialogComponent;
  let fixture: ComponentFixture<WorkItemInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkItemInfoDialogComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkItemInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
