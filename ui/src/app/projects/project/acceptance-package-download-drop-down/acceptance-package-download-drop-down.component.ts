import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpParams, HttpStatusCode } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, input, Input, ViewChild } from '@angular/core';
import { Dropdown } from '@eds/vanilla';
import { Observable, PartialObserver, Subscription } from 'rxjs';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectsService } from '../../projects.service';
import { AcceptancePackageService, ComponentActionPermission } from '../acceptance-package.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { DownloadOptions, DownloadPackageDialogComponent } from '../../details-dialog/download-package-dialog/download-package-dialog.component';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { CustomerAcceptanceStatus } from '../../projects.interface';

export enum PackageReportType {
  ObservationReport = 'OBSERVATION_REPORT',
  PhotoReport = 'PHOTO_REPORT',
  PhotoReportPDF = 'PHOTO_REPORT_PDF',
  ObservationRejectedReport = 'OBSERVATION_REPORT_REJECTED_EVIDENCE',
  PhotoRejectedReport = 'PHOTO_REPORT_REJECTED',
  PhotoRejectedReportPDF = 'PHOTO_REPORT_REJECTED_PDF',
  OnSiteChecklistReport = 'ONSITE_CHECKLIST_REPORT',
  PhotoApprovedReport = 'PHOTO_REPORT_APPROVED',
  PhotoApprovedReportPDF = 'PHOTO_REPORT_APPROVED_PDF',
  SummaryReportPDF = 'SUMMARY_REPORT_PDF',
  TransferEvidencesZip = 'TRANSFER_EVIDENCES_ZIP',
}

interface ReportName {
  fullName: string,
  shortName: string,
}

@Component({
  selector: 'app-acceptance-package-download-drop-down',
  templateUrl: './acceptance-package-download-drop-down.component.html',
  styleUrls: ['./acceptance-package-download-drop-down.component.less']
})
export class AcceptancePackageDownloadDropDownComponent implements AfterViewInit {
  @Input() readonly packageLinearId: string;
  @ViewChild('downloadReport') private readonly downloadReportRef: ElementRef<HTMLElement>;

  packageStatus = input<CustomerAcceptanceStatus>();
  AcceptanceStatus = CustomerAcceptanceStatus;

  packageReportType = PackageReportType;
  componentActionPermission = ComponentActionPermission
  private subscription: Subscription = new Subscription();

  constructor(
    private httpClient: HttpClient,
    private notificationService: NotificationService,
    private projectService: ProjectsService,
    private packageService: AcceptancePackageService,
    private dialogService: DialogService,
  ) { }

  ngAfterViewInit(): void {
    const downloadReportElement = this.downloadReportRef.nativeElement;
    if (downloadReportElement) {
      const dropdown = new Dropdown(downloadReportElement);
      dropdown.init();
    }
  }

  onDownloadReport(event, type: PackageReportType): void {
    const targetElement: HTMLButtonElement = event.target;
    const targetElementOriginalText: string = targetElement.textContent;
    const downloadObserver: PartialObserver<HttpEvent<Blob>> = {
      next: (result => {
        if (result.type === HttpEventType.Sent) {
          targetElement.disabled = true;
          targetElement.textContent = `${targetElementOriginalText.slice(0, targetElementOriginalText.length - 12)}...preparing`;
        }
        if (result.type === HttpEventType.DownloadProgress) {
          const downloadProgress = `${result.total ? `${parseFloat((result.loaded / result.total * 100).toFixed(0))}%` : `${this.projectService.formatBytes(result.loaded, 0)}`}`;
          targetElement.textContent = `${targetElementOriginalText.slice(0, targetElementOriginalText.length - downloadProgress.length - 3)}...${downloadProgress}`;
        }
        if (result.type === HttpEventType.Response) {
          targetElement.textContent = targetElementOriginalText;
          targetElement.disabled = false;
          const contentDisposition = result.headers.get('content-disposition');
          // retrieve the file name and remove potential quotes from it
          const filename = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replace('"', '') // replacing one " character
            .replace('"', ''); // replacing second " character
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename || `${this.getReportNameByType(type).shortName}-${this.packageLinearId}.${type === PackageReportType.ObservationReport ? 'pdf' : 'zip'}`;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showLogNotification({
            title: 'Report successfully downloaded!',
            description: `Downloading of ${this.getReportNameByType(type).fullName} for package ${this.packageLinearId} completed successfully.`
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElement.textContent = targetElementOriginalText;
        targetElement.disabled = false;
        const statusMessage = 'Error when downloading the report!';
        // push notification for the error message
        this.notificationService.showLogNotification({
          title: statusMessage,
          description: 'Please try again.'
        });
      },
    };

    this.downloadReport(this.packageLinearId, type).subscribe(downloadObserver);
  }

  getReportNameByType(type: PackageReportType): ReportName {
    switch (type) {
      case PackageReportType.PhotoReport: return { fullName: 'Full evidence report - HTML', shortName: 'FullEvidenceReport' };
      case PackageReportType.PhotoReportPDF: return { fullName: 'Full evidence report - PDF', shortName: 'FullEvidenceReportPDF' };
      case PackageReportType.ObservationReport: return { fullName: 'Full observation report - HTML', shortName: 'FullObservationReport' };
      case PackageReportType.PhotoRejectedReport: return { fullName: 'Rejected evidence report - HTML', shortName: 'RejectedEvidenceReport' };
      case PackageReportType.PhotoRejectedReportPDF: return { fullName: 'Rejected evidence report - PDF', shortName: 'RejectedEvidenceReportPDF' };
      case PackageReportType.ObservationRejectedReport: return { fullName: 'Observation report for rejected items', shortName: 'ObservationReportForRejectedItems' };
      case PackageReportType.OnSiteChecklistReport: return { fullName: 'On-site checklist report - PDF', shortName: 'OnSiteChecklistReport' };
      case PackageReportType.PhotoApprovedReport: return { fullName: 'Approved evidence report - HTML', shortName: 'ApprovedEvidenceReport' };
      case PackageReportType.PhotoApprovedReportPDF: return { fullName: 'Approved evidence report - PDF', shortName: 'ApprovedEvidenceReportPDF' };
      case PackageReportType.SummaryReportPDF: return { fullName: 'Summary report - PDF', shortName: 'SummaryReportPDF' };
      case PackageReportType.TransferEvidencesZip: return { fullName: 'Transfer evidences - ZIP', shortName: 'TransferEvidencesZIP' };
    }
  }

  private downloadReport(packageId: string, type: PackageReportType): Observable<HttpEvent<Blob>> {
    if (packageId === undefined) {
      console.error('Download of package report requires the id to be set.');
      return;
    }

    if (type === PackageReportType.TransferEvidencesZip) return this.downloadTransferEvidences(packageId);
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('reportType', type).set('timeZone', timeZone);
    return this.httpClient.get(`/acceptancepackages/${packageId}/report`, {
      params,
      observe: 'events',
      reportProgress: true,
      responseType: 'blob',
    })
  }

  private downloadTransferEvidences(packageId: string, format = 'zip'): Observable<HttpEvent<Blob>> {
    const params: HttpParams = new HttpParams().set('type', format);
    return this.httpClient.get(`/acceptancepackagesb2b/acceptancepackages/${packageId}/summary`, {
      params,
      observe: 'events',
      reportProgress: true,
      responseType: 'blob',
    })
  }

  /**
 * @param permission permission to check
 * @returns boolean whether that permission is granted
 */
  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  public onDownloadPackage(): void {
    const downloadDialogRef = this.dialogService.createDialog(
      DownloadPackageDialogComponent, { packageId: this.packageLinearId }
    );
    const dialogSubscription = downloadDialogRef.instance.result.subscribe((options: DownloadOptions) => {
      const dialogMessageData: DialogData = {
        dialogueTitle: 'Downloading package',
        show: APICallStatus.Loading
      };
      const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogMessageData);
      dialogMessage.instance.additionalMessage = 'If you close this dialog, downloading will proceed in background.';

      const downloadSubscription =
        this.projectService.downloadPackageEvidences(
          this.packageLinearId,
          options.selectedStatuses.join(),
          options.selectedTypes.join()
        ).subscribe({
          next: (result => {
            if (result.type === HttpEventType.DownloadProgress) {
              dialogMessage.instance.dialogueTitle = `Downloading package - ${result.total ? `${parseFloat((result.loaded / result.total * 100).toFixed(2))}%` : `${this.projectService.formatBytes(result.loaded)}`}`;
            }
            if (result.type === HttpEventType.Response) {
              dialogMessage.instance.show = APICallStatus.Success;
              dialogMessage.instance.statusMessage = 'Acceptance package successfully downloaded!';
              dialogMessage.instance.dialogueTitle = 'Successfully downloaded';
              dialogMessage.instance.additionalMessage = '';

              const contentDisposition = result.headers.get('content-disposition');
              // retrieve the file name and remove potential quotes from it
              const filename = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
                .replace('"', '') // replacing one " character
                .replace('"', ''); // replacing second " character
              const downloadUrl = window.URL.createObjectURL(result.body);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = filename || 'evidences.zip';
              link.dispatchEvent(new MouseEvent('click'));
              window.URL.revokeObjectURL(downloadUrl);
              this.notificationService.showNotification({
                title: 'Acceptance package successfully downloaded!',
                description: `Downloading of the package ${this.packageLinearId} completed successfully.`
              });
              downloadSubscription.unsubscribe();
            }
          }),
          error: (err: HttpErrorResponse) => {
            dialogMessage.instance.show = APICallStatus.Error;
            let additionalMessage = '';
            if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
              // push notification for the error message
              this.notificationService.showNotification({
                title: 'Error when downloading the acceptance package!',
                description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
              }, true);

              additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
            } else {
              // push notification for the error message
              this.notificationService.showNotification({
                title: 'Error when downloading the acceptance package!',
                description: 'Click to open the FAQ doc for further steps.'
              }, true);

              additionalMessage = '\n Please follow the FAQ doc for further steps.';
            }
            dialogMessage.instance.statusMessage = 'Error when downloading the acceptance package!' + additionalMessage;
            dialogMessage.instance.dialogueTitle = 'Failed to download package';
            dialogMessage.instance.additionalMessage = '';
            dialogMessage.instance.actionOn.next('FAQ');

            downloadSubscription.unsubscribe();
          },
        });
    });

    this.subscription.add(dialogSubscription);
  }
}
