import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnagReportDialogComponent } from './snag-report-dialog.component';

describe('SnagReportDialogComponent', () => {
  let component: SnagReportDialogComponent;
  let fixture: ComponentFixture<SnagReportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnagReportDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnagReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
