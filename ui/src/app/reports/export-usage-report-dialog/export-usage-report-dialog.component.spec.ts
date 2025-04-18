import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportUsageReportDialogComponent } from './export-usage-report-dialog.component';

describe('ExportUsageReportDialogComponent', () => {
  let component: ExportUsageReportDialogComponent;
  let fixture: ComponentFixture<ExportUsageReportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportUsageReportDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportUsageReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
