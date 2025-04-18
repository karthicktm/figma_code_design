import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceSrsReportComponent } from './source-srs-report.component';

describe('SourceSrsReportComponent', () => {
  let component: SourceSrsReportComponent;
  let fixture: ComponentFixture<SourceSrsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SourceSrsReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SourceSrsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
