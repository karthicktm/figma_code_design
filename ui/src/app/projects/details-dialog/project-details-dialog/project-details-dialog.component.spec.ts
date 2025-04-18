import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailsDialogComponent } from './project-details-dialog.component';

describe('ProjectDetailsDialogComponent', () => {
  let component: ProjectDetailsDialogComponent;
  let fixture: ComponentFixture<ProjectDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectDetailsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
