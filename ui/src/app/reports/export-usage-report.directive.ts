import { HttpEventType } from '@angular/common/http';
import { ComponentRef, Directive, HostListener } from '@angular/core';
import { iif, of, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { CustomerService } from '../customer-onboarding/customer.service';
import { NotificationService } from '../portal/services/notification.service';
import { DownloadProgressDialogComponent, Status } from './download-progress-dialog/download-progress-dialog.component';
import { DownloadOptions, ExportUsageReportDialogComponent } from './export-usage-report-dialog/export-usage-report-dialog.component';
import { ReportsService } from './reports.service';

@Directive({
  selector: '[appExportUsageReport]'
})
export class ExportUsageReportDirective {

  constructor(
    private dialogService: DialogService,
    private customerService: CustomerService,
    private reportsService: ReportsService,
    private notificationService: NotificationService,
  ) { }

  @HostListener('click', ['$event']) onClick(event): void {
    const element: HTMLElement = event.target;
    const limit = 10;
    const dialog = this.dialogService.createDialog(ExportUsageReportDialogComponent, {
      customers: this.customerService.getCustomers(limit, 0).pipe(
        switchMap((response) => {
          return iif(
            () => response.totalRecords > limit, this.customerService.getCustomers(response.totalRecords, 0), of(response)
          );
        }),
        map((customerResponse) => customerResponse.results)
      )
    });
    const subscription = dialog.instance.result.subscribe({
      next: (dialogResult: DownloadOptions) => {
        const { selectedType: reportType, selectedCustomer: customerId } = dialogResult;
        const status = new ReplaySubject<Status>(1);
        const autoCloseDelay = 500;
        let downloadProgressDialog: ComponentRef<DownloadProgressDialogComponent>;
        this.reportsService.getUsageReport(reportType, customerId).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.Sent) {
              downloadProgressDialog = this.dialogService.createDialog(DownloadProgressDialogComponent, { status });
              status.next(Status.inProgress);
            }

            if (event.type === HttpEventType.Response) {
              status.next(Status.completed);
              setTimeout(() => {
                downloadProgressDialog.instance.dialog.hide();
              }, autoCloseDelay)
              const contentDisposition = event.headers.get('content-disposition');
              // retrieve the file name and remove potential quotes from it
              const filename = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
                .replace('"','') // replacing one " character
                .replace('"',''); // replacing second " character
              const objectUrl = URL.createObjectURL(event.body)
              const link = document.createElement('a');
              link.href = objectUrl;
              link.download = filename || `${customerId}-${reportType}.zip`;
              link.dispatchEvent(new MouseEvent('click'));
              window.URL.revokeObjectURL(objectUrl);
              this.notificationService.showLogNotification({
                  title: 'Report successfully downloaded!',
                  description: `Downloading of the ${reportType} for ${customerId ? 'customer with id ' + customerId : 'all customers'} completed successfully.`
              });
            }
          },
          error: () => {
            status.next(Status.failed);
            setTimeout(() => {
              downloadProgressDialog.instance.dialog.hide();
            }, autoCloseDelay)
            this.notificationService.showLogNotification({
              title: 'Failed to download the report!',
              description: `Downloading of the ${reportType} for ${customerId ? 'customer with id ' + customerId : 'all customers'} failed. Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.`
            });
          }
        });
      }
    });
    dialog.onDestroy(() => { subscription.unsubscribe(); });
  }
}
