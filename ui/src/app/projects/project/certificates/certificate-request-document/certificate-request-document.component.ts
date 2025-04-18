import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, output, input } from '@angular/core';
import { CertificateRequestDocument } from 'src/app/projects/projects.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { Table } from '@eds/vanilla';
import { PartialObserver, Subscription } from 'rxjs';
import { HttpErrorResponse, HttpEvent, HttpEventType, HttpStatusCode } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { CertificateDocumentUploadDialogComponent } from '../certificate-document-upload-dialog/certificate-document-upload-dialog.component';
import { DeleteDocumentConfirmDialogComponent } from '../delete-document-confirm-dialog/delete-document-confirm-dialog.component';
import CertificateUtils from '../certificate-utilities';

@Component({
  selector: 'app-certificate-request-document',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './certificate-request-document.component.html',
  styleUrl: './certificate-request-document.component.less'
})
export class CertificateRequestDocumentComponent implements AfterViewInit, OnDestroy {
  projectId = input.required<string>();

  //to hold corresponding certificate request id
  certificateRequestId = input<string>();

  // to hold parent component detail
  parentComponentName = input<string>();
 
  // to give the updated value to parent to consume like sending the document ids in submit
  certificateRequestDocumentArray = output<string[]>();

  // to hold document ids, needed during certificate request creation flow
  certificateRequestDocumentIds: string[] = [];

  // table reference
  @ViewChild('table') readonly tableElementRef: ElementRef<HTMLElement>
  // table data
  private data: CertificateRequestDocument[] = [];
  
  // class to hold table reference
  table = undefined;

  // for resource
  private scripts: Scripts[] = [];
  private eventAbortController = new AbortController();  
  private subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private projectService: ProjectsService,
    private dialogService: DialogService
  ) {
  }

  private observer: PartialObserver<CertificateRequestDocument[]> = {
    next: (certReqDocuments) => {
      this.data = certReqDocuments
      this.table.update(this.data)
    }
  }

  private fetchCertificateRequestDocuments(): void {
    if (this.certificateRequestId()) {
      this.projectService.getCertificateRequestDocumentsByCertReqId(this.projectId(), this.certificateRequestId()).subscribe(this.observer)
    } else {
      if (this.certificateRequestDocumentIds && this.certificateRequestDocumentIds.length > 0) {
        this.projectService.getCertificateRequestDocuments(this.projectId(), this.certificateRequestDocumentIds).subscribe(this.observer)
      }
    }
  }
  
  ngAfterViewInit(): void {
    const columnsProperties = [
      {
        key: 'fileName',
        title: 'Name',
      },
      {
        key: 'tag',
        title: 'Tag',
      },
      // place holder to hold request document id
      {
        key: 'certificateRequestDocumentId',
        title: 'Certificate Request Document Id',
        hidden: true
      }
    ];

    const certificateRequestDocumentTableDOM = this.tableElementRef.nativeElement as HTMLElement;
    if (certificateRequestDocumentTableDOM) {
      const table = new Table(certificateRequestDocumentTableDOM, {
        data: this.data,
        columns: columnsProperties,
        scroll: true,
        actions: true,
        onCreatedActionsCell: (td: HTMLTableCellElement, rowData: any): void => {
          if (rowData) {
            this.generateCertificateDocumentDownloadButton(rowData, td);
          }
          if (rowData && this.isRequestDocumentDeletable()) {
            this.generateCertificateDocumentDeleteButton(rowData, td);
          }         
        }
      });
      table.init();
      this.table = table;
      this.scripts.push(table);
      this.fetchCertificateRequestDocuments()
    }
  }

  private isRequestDocumentDeletable() : boolean {
    // when the component is createCertificateWizardStep2, delete button can be enabled for reference document
    return this.parentComponentName() === CertificateUtils.createCertificateWizardStep2;
  }

  private generateCertificateDocumentDeleteButton(rowData: any, td: HTMLTableCellElement): void {
    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('title', 'Delete certificate document');
    deleteButton.classList.add('btn-icon', 'delete-document');
    const iconDownload = document.createElement('i');
    iconDownload.classList.add('icon', 'icon-trashcan');
    deleteButton.appendChild(iconDownload);
    deleteButton.addEventListener('click', () => {
      this.deleteCertificateRequestDocuments(rowData.fileName, rowData.certificateRequestDocumentId);
    }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
    td.appendChild(deleteButton);
  }

  private generateCertificateDocumentDownloadButton(rowData: any, td: HTMLTableCellElement): void {
    const downloadButton = document.createElement('button');
    downloadButton.setAttribute('title', 'Download certificate document');
    downloadButton.classList.add('btn-icon', 'download-document');
    const iconDownload = document.createElement('i');
    iconDownload.classList.add('icon', 'icon-download-save');
    downloadButton.appendChild(iconDownload);
    downloadButton.addEventListener('click', () => {
      this.downloadCertificateRequestDocuments(this.projectId(), rowData.certificateRequestDocumentId, downloadButton);
    }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
    td.appendChild(downloadButton);
  }

  /**
  * Download Certificate request documents
  * @param projectId of the project
  * @param document's id
  * @param targetElement
  */
  private downloadCertificateRequestDocuments(projectId: string, documentId: string, targetElement: HTMLButtonElement): void {
    const downloadObserver: PartialObserver<HttpEvent<Blob>> = {
      next: (result => {
        if (result.type === HttpEventType.Sent) {
          targetElement.disabled = true;
        }
        if (result.type === HttpEventType.Response) {
          targetElement.disabled = false;
          const contentDisposition = result.headers.get('content-disposition');
          // retrieve the file name and remove potential quotes from it
          const filename = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replace('"', '') // replacing one " character
            .replace('"', ''); // replacing second " character
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showLogNotification({
            title: 'Certificate Document downloaded!',
            description: `Downloading of the certificate document completed successfully.`
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElement.disabled = false;
        const statusMessage = 'Error when downloading the certificate document!';
        // push notification for the error message
        this.notificationService.showLogNotification({
          title: statusMessage,
          description: 'Please try again.'
        });
      },
    };
    this.projectService.downloadCertificateDocument({ projectId, documentId }).subscribe(downloadObserver);
  }

  public onAddDocumentClick(): void {
    const dialogRef = this.dialogService.createDialog(CertificateDocumentUploadDialogComponent, {
      projectId: this.projectId()
    });
    this.subscription.add(
      dialogRef.instance.dialogResult.subscribe((result: any) => {
        if (result) {
          this.certificateRequestDocumentIds.push(...result)
          this.fetchCertificateRequestDocuments()
          this.certificateRequestDocumentArray.emit(this.certificateRequestDocumentIds)
        }
      })
    );
  }

  public deleteCertificateRequestDocuments(documentNameInput: string, documentId: string): void {
    const dialogRef = this.dialogService.createDialog(
      DeleteDocumentConfirmDialogComponent,
      {
        documentName: documentNameInput
      }
    );

    this.subscription.add(dialogRef.instance.dialogResult.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.subscription.add(
          this.projectService
            .deleteCertificateRequestDocument(this.projectId(), documentId)
            .subscribe({
              next: () => {
                this.notificationService.showNotification({
                  title: 'Deleted certificate document successfully!',
                });
                this.fetchCertificateRequestDocuments()
              },
              error: (err) => {
                if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
                  this.notificationService.showNotification({
                    title: `Error while deleting certificate document!`,
                    description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
                  }, true);
                } else {
                  this.notificationService.showNotification({
                    title: `Error while deleting certificate document!`,
                    description: 'Click to open the FAQ doc for further steps.'
                  }, true);
                }
              },
            })
        );
      }
    }));
  }

  downloadAllCertificateReqDocuments(event: CustomEvent): void {
    const targetElement: HTMLButtonElement = event.target as HTMLButtonElement;
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
            .replaceAll('"', '') // replacing '"' character
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename || `certificate-request-${this.certificateRequestId()}-documents.zip`;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showLogNotification({
            title: 'Certificate request documents successfully downloaded!',
            description: `Downloading of documents for certificate request ${this.certificateRequestId()} completed successfully.`
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElement.textContent = targetElementOriginalText;
        targetElement.disabled = false;
        const statusMessage = 'Error when downloading certificate request documents!';
        // push notification for the error message
        this.notificationService.showLogNotification({
          title: statusMessage,
          description: 'Please try again.'
        });
      },
    };

    this.projectService.downloadCertificateRequestDocuments({ projectId: this.projectId(), certificateRequestId: this.certificateRequestId() }).subscribe(downloadObserver);
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }
}
