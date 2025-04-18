import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { GetReportStatusResponse } from './../../../projects.interface';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PartialObserver, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { SnagReportDialogComponent } from 'src/app/projects/details-dialog/snag-report-dialog/snag-report-dialog.component';
import { ProjectReportStatus, ProjectReportType } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';

@Component({
  selector: 'app-project-report-download',
  templateUrl: './project-report-download.component.html',
  styleUrls: ['./project-report-download.component.less']
})
export class ProjectReportDownloadComponent implements OnInit, OnDestroy {
  @Input() type: ProjectReportType;
  @Input() projectLinearId: string;

  private subscription: Subscription = new Subscription();

  status: string;
  ProjectReportStatus = ProjectReportStatus;
  ProjectReportType = ProjectReportType;

  constructor(
    private projectService: ProjectsService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.checkReportStatus();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private checkReportStatus(): void {
    let checkStatusFunction;
    if (this.type === ProjectReportType.AP) checkStatusFunction = this.projectService.checkReportStatus(this.projectLinearId);
    if (this.type === ProjectReportType.SNAG) checkStatusFunction = this.projectService.checkSnagReportStatus(this.projectLinearId);
    if (this.type === ProjectReportType.CERTIFICATE) checkStatusFunction = this.projectService.checkCertificateReportStatus(this.projectLinearId);

    this.subscription.add(checkStatusFunction.subscribe({
      next: (statusResp: GetReportStatusResponse) => {
        this.status = statusResp.availabilityStatus;
      },
      error: () => {
        this.notificationService.showNotification({
          title: `Error while checking status of ${this.type === ProjectReportType.AP ? 'acceptance package' : 'snag'} report!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      }
    }));
  }

  generateReport(): void {
    if (this.type === ProjectReportType.AP) this.generateApReport();
    if (this.type === ProjectReportType.SNAG) this.generateSnagReport();
    if (this.type === ProjectReportType.CERTIFICATE) this.generateCertificateReport();
  }

  private generateApReport(): void {
    this.subscription.add(this.projectService.generateReport(this.projectLinearId).subscribe({
      next: () => {
        this.status = ProjectReportStatus.IN_PROGRESS;
        this.notificationService.showNotification({
          title: `Thank you for your request and we are preparing report now. We shall notify you when report is ready for downloading.`,
        });
      },
      error: () => {
        this.notificationService.showNotification({
          title: `Error while sending request to generate acceptance package report!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      }
    }));
  }

  private generateSnagReport(): void {
    const dialog = this.dialogService.createDialog(SnagReportDialogComponent);
    this.subscription.add(dialog.instance.dialogResult
      .pipe(
        take(1),
      )
      .subscribe((dialogResult) => {
        const selectedFieldNames: string[] = dialogResult.selectedFields.map(value => value.columnName);
        this.projectService.generateSnagReport(this.projectLinearId, selectedFieldNames).subscribe({
          next: () => {
            this.status = ProjectReportStatus.IN_PROGRESS;
            this.notificationService.showNotification({
              title: `Thank you for your request and we are preparing report now. We shall notify you when report is ready for downloading.`,
            });
          },
          error: () => {
            this.notificationService.showNotification({
              title: `Error while sending request to generate snag report!`,
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            }, true);
          }
        });
      }));
  }

  private generateCertificateReport(): void {
    this.subscription.add(this.projectService.generateCertificateReport(this.projectLinearId).subscribe({
      next: () => {
        this.status = ProjectReportStatus.IN_PROGRESS;
        this.notificationService.showNotification({
          title: `Thank you for your request and we are preparing report now. We shall notify you when report is ready for downloading.`,
        });
      },
      error: () => {
        this.notificationService.showNotification({
          title: `Error while sending request to generate certificate report!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      }
    }));
  }

  downloadReport(event): void {
    const targetElement: HTMLButtonElement = event.target;
    const targetElementOriginalText: string = targetElement.innerText;
    const targetElementTextNode = Array.from(targetElement.childNodes).find(node => node.nodeType === Node.TEXT_NODE);

    let reportType: string;
    if (this.type === ProjectReportType.AP) reportType = 'acceptance package';
    else if (this.type === ProjectReportType.SNAG) reportType = 'snag';
    else if (this.type === ProjectReportType.CERTIFICATE) reportType = 'certificate';
    else {
      console.error('Unknown report type.');
      return;
    }

    const downloadObserver: PartialObserver<HttpEvent<Blob>> = {
      next: (result => {
        if (result.type === HttpEventType.Sent) {
          targetElement.disabled = true;
          targetElementTextNode.nodeValue = `${targetElementOriginalText.slice(0, targetElementOriginalText.length - 12)}...preparing`;
        }
        if (result.type === HttpEventType.DownloadProgress) {
          const downloadProgress = `${result.total ? `${parseFloat((result.loaded / result.total * 100).toFixed(0))}%` : `${this.projectService.formatBytes(result.loaded, 0)}`}`;
          targetElementTextNode.nodeValue = `${targetElementOriginalText.slice(0, targetElementOriginalText.length - downloadProgress.length - 3)}...${downloadProgress}`;
        }
        if (result.type === HttpEventType.Response) {
          targetElementTextNode.nodeValue = targetElementOriginalText;
          targetElement.disabled = false;
          const contentDisposition = result.headers.get('content-disposition');
          // retrieve the file name and remove potential quotes from it
          const filename = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replace('"', '') // replacing one " character
            .replace('"', ''); // replacing second " character
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          const defaultFileName = `${reportType}-report.zip`;
          link.download = filename || defaultFileName;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.status = ProjectReportStatus.COMPLETE;
          this.notificationService.showNotification({
            title: 'Report successfully downloaded!',
            description: `Downloading of ${reportType} report of ${this.projectLinearId} completed successfully.`
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElementTextNode.nodeValue = targetElementOriginalText;
        targetElement.disabled = false;
        this.notificationService.showNotification({
          title: `Error when downloading ${reportType} report!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      },
    };

    if (this.type === ProjectReportType.AP) this.projectService.downloadReport(this.projectLinearId).subscribe(downloadObserver);
    if (this.type === ProjectReportType.SNAG) this.projectService.downloadSnagReport(this.projectLinearId).subscribe(downloadObserver);
    if (this.type === ProjectReportType.CERTIFICATE) this.projectService.downloadCertificateReport(this.projectLinearId).subscribe(downloadObserver);
  }
}
