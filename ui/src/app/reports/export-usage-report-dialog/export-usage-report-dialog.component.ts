import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CustomerDetails } from 'src/app/customer-onboarding/customer-onboarding.interface';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { OptionWithValue } from 'src/app/shared/select/select.interface';

export interface DownloadOptions {
  selectedCustomer: string;
  selectedType: UsageReportType;
}

enum UsageReportType {
  PackageUsageReport = 'PackageUsageReport',
  LineItemUsageReport = 'LineItemUsageReport',
  EvidenceUsageReport = 'EvidenceUsageReport',
}

@Component({
  selector: 'app-export-usage-report-dialog',
  templateUrl: './export-usage-report-dialog.component.html',
  styleUrls: ['./export-usage-report-dialog.component.less']
})
export class ExportUsageReportDialogComponent extends EDSDialogComponent implements OnInit {
  public result: EventEmitter<DownloadOptions> = new EventEmitter();
  isCustomerFreeTextInputDisabled: boolean = true;
  customers: Observable<OptionWithValue[]>;
  typeOptions: { name: string, value: UsageReportType }[] = [
    { name: 'Total ECA usage', value: UsageReportType.PackageUsageReport },
    { name: 'Component details & status', value: UsageReportType.LineItemUsageReport },
  ]
  // Workaround to use type definition in template
  usageReportType = UsageReportType;
  selectedCustomer: DownloadOptions['selectedCustomer'];
  selectedType: DownloadOptions['selectedType'] = UsageReportType.PackageUsageReport;

  constructor(
    @Inject(DIALOG_DATA) public inputData: { customers: Observable<CustomerDetails[]> },
  ) {
    super();
  }

  ngOnInit(): void {
    this.customers = this.inputData.customers.pipe(
      map((customers) => {
        return customers.map((customer) => ({ option: customer.customerName, optionValue: customer.customerId }))
      }),
      catchError((err) => {
        this.isCustomerFreeTextInputDisabled = false;
        return throwError(() => err);
      })
    );
  }

  onActionDownloadReport(): void {
    const { selectedCustomer, selectedType } = this;
    this.result.emit({
      selectedCustomer,
      selectedType,
    });
  }

  onKeyUpCustomerInput(value: string): void {
    this.selectedCustomer = value?.length === 0 ? undefined : value;
  }

  onSelectCustomer(value: string): void {
    this.selectedCustomer = value;
  }

  onSelectCustomerInput(value: string): void {
    this.selectedCustomer = value?.length === 0 && undefined;
  }
}
