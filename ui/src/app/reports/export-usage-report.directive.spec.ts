import { TestBed } from '@angular/core/testing';
import { ExportUsageReportDirective } from './export-usage-report.directive';
import { DialogService } from '../portal/services/dialog.service';
import { CustomerService } from '../customer-onboarding/customer.service';
import { NotificationService } from '../portal/services/notification.service';
import { ReportsService } from './reports.service';

describe('ExportUsageReportDirective', () => {
  let directive: ExportUsageReportDirective;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ElementRef', ['focus']);
    TestBed.configureTestingModule({
      providers: [
        ExportUsageReportDirective,
        { provide: DialogService, useValue: {} },
        { provide: CustomerService, useValue: {} },
        { provide: ReportsService, useValue: {} },
        { provide: NotificationService, useValue: {} },
      ],
    });
    // Inject both the service-to-test and its (spy) dependency
    directive = TestBed.inject(ExportUsageReportDirective);
    TestBed.inject(DialogService);
    TestBed.inject(CustomerService);
    TestBed.inject(ReportsService);
    TestBed.inject(NotificationService);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
