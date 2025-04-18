import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectReportDownloadComponent } from './project-report-download.component';

describe('ProjectReportDownloadComponent', () => {
  let component: ProjectReportDownloadComponent;
  let fixture: ComponentFixture<ProjectReportDownloadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectReportDownloadComponent]
    });
    fixture = TestBed.createComponent(ProjectReportDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
