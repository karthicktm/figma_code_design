import { CommonModule } from '@angular/common';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, Inject, OnDestroy, signal } from '@angular/core';
import { DragulaModule } from 'ng2-dragula';
import { PartialObserver, Subscription } from 'rxjs';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CertificateReferenceMergeDocumentType, CertificateRequestDocument } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';

interface Document {
  name: string;
  type: CertificateReferenceMergeDocumentType;
  documentId?: string;
  selected: boolean;
}

@Component({
  selector: 'app-certificate-merge-document-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DragulaModule,
  ],
  templateUrl: './certificate-merge-document-dialog.component.html',
  styleUrl: './certificate-merge-document-dialog.component.less'
})
export class CertificateMergeDocumentDialogComponent extends EDSDialogComponent implements OnDestroy {
  private subscription: Subscription = new Subscription();

  CertificateReferenceMergeDocumentType = CertificateReferenceMergeDocumentType;
  loadingData = signal<boolean>(false);
  mergingDocument = signal<boolean>(false);
  originalDocumentList: Document[] = [];
  documentList: Document[] = [];

  constructor(
    @Inject(DIALOG_DATA) public inputData: { projectId: string, certificateRequestId: string },
    private projectService: ProjectsService,
    private notificationService: NotificationService,
  ) {
    super();
    this.fetchDocumentList();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  fetchDocumentList(): void {
    if (this.inputData.projectId && this.inputData.certificateRequestId) {
      this.loadingData.set(true);
      const filter = [{ key: 'fileType', value: 'PDF' }];
      this.subscription.add(
        this.projectService.getCertificateRequestDocumentsByCertReqId(this.inputData.projectId, this.inputData.certificateRequestId, filter).subscribe({
          next: (documents: CertificateRequestDocument[]) => {
            this.loadingData.set(false);
            this.originalDocumentList = documents.map(document => ({
              name: document.fileName,
              type: CertificateReferenceMergeDocumentType.DOCUMENT,
              documentId: document.certificateRequestDocumentId,
              selected: false
            }));
            if (this.originalDocumentList && this.originalDocumentList.length > 0) {
              // Add certificate as first element of the list
              this.originalDocumentList.unshift({
                name: 'Certificate',
                type: CertificateReferenceMergeDocumentType.CERTIFICATE,
                documentId: 'Certificate',
                selected: true
              });
              this.initDocumentList();
            }
          },
          error: () => {
            this.loadingData.set(false);
            this.notificationService.showNotification(
              {
                title: 'Error when retrieving reference documents!',
                description:
                  'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
              },
              true
            );
          }
        })
      );
    } else {
      console.error('Missing project ID or certificate request ID');
    }
  }

  onDocumentSelectChange(event: Event, document: Document): void {
    document.selected = (event.target as HTMLInputElement).checked;
  }

  onReset(): void {
    this.initDocumentList();
  }

  initDocumentList(): void {
    this.documentList = (JSON.parse(JSON.stringify(this.originalDocumentList)));
  }

  onMerge(): void {
    this.mergingDocument.set(true);
    const requestBody = this.documentList.filter(document => document.selected).map((document: Document, index: number) => ({
      sequenceNumber: index + 1,
      type: document.type,
      documentId: document.type === CertificateReferenceMergeDocumentType.DOCUMENT ? document.documentId : undefined,
    }));

    const downloadObserver: PartialObserver<HttpEvent<Blob>> = {
      next: (result => {
        if (result.type === HttpEventType.Response) {
          this.mergingDocument.set(false);
          const contentDisposition = result.headers.get('content-disposition');
          // retrieve the file name and remove potential quotes from it
          const filename = contentDisposition?.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replaceAll('"', '');
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showNotification({
            title: `Reference documents successfully merged and downloaded!`,
          });
        }
      }),
      error: () => {
        this.mergingDocument.set(false);
        const statusMessage = 'Error when merging/downloading the reference documents!';
        this.notificationService.showNotification(
          {
            title: statusMessage,
            description:
              'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
          },
          true
        );
      },
    };
    this.projectService.downloadCertificateMergeDocument(this.inputData.projectId, this.inputData.certificateRequestId, requestBody).subscribe(downloadObserver);
  }
}
