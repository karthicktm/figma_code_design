import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceSdeReportWizardComponent } from './source-sde-report-wizard.component';

describe('SourceSdeReportWizardComponent', () => {
  let component: SourceSdeReportWizardComponent;
  let fixture: ComponentFixture<SourceSdeReportWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SourceSdeReportWizardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SourceSdeReportWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
