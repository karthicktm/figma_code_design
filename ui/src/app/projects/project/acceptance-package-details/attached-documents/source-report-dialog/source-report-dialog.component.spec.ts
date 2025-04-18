import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceReportDialogComponent } from './source-report-dialog.component';

describe('SourceReportDialogComponent', () => {
  let component: SourceReportDialogComponent;
  let fixture: ComponentFixture<SourceReportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SourceReportDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SourceReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
