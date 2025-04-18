import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, Subscription, catchError, of, tap, throwError } from 'rxjs';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CertificateActionBody, CertificateRequestDetails, CertificateRequestStatus } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { CertificateWorkPlanListComponent } from '../certificate-work-plan-list/certificate-work-plan-list.component';
import { SignatoriesCommentComponent } from './signatories-comment/signatories-comment.component';
import { CertificateService } from '../certificate.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { RejectCertReqDialogComponent } from './certificate-reject-dialog/reject-dialog.component';
import { CertificateRequestDocumentComponent } from '../certificate-request-document/certificate-request-document.component';
import { CertificateMergeDocumentDialogComponent } from '../certificate-merge-document-dialog/certificate-merge-document-dialog.component';

@Component({
  selector: 'app-certificate-request-details',
  standalone: true,
  imports: [
    CommonModule,
    CertificateWorkPlanListComponent,
    SignatoriesCommentComponent,
    CertificateRequestDocumentComponent,
  ],
  templateUrl: './certificate-request-details.component.html',
  styleUrl: './certificate-request-details.component.less'
})
export class CertificateRequestDetailsComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();

  CertificateRequestStatus = CertificateRequestStatus;
  loadingData = signal<boolean>(false);
  submittingData = signal<boolean>(false);
  requestDetails: Observable<CertificateRequestDetails>;
  projectId: string;
  certificateRequestId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectsService,
    private certificateService: CertificateService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.subscription.add(this.route.paramMap.subscribe((params: ParamMap) => {
      const projectId = params.get('id');
      this.projectId = projectId;
      this.certificateRequestId = params.get('certificateRequestId');

      this.loadingData.set(true);
      this.requestDetails = this.projectService.getCertificateRequest(projectId, this.certificateRequestId).pipe(
        tap(() => this.loadingData.set(false)),
        catchError((error: HttpErrorResponse) => {
          this.loadingData.set(false)
          let errorMessage = '';
          if (error.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // server-side error
            errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
          }
          this.notificationService.showNotification({
            title: `Error when retrieving details of certificate request ${this.certificateRequestId}!`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
          return of(null);
        })
      );
    }));
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onPreview(certificate: Pick<CertificateRequestDetails, 'certificateRequestId'>): void {
    this.certificateService.openPreview(this.projectId, certificate);
  }

  onSign(certificate: Pick<CertificateRequestDetails, 'certificateRequestId'>): void {
    const signingProperties = {
      projectId: this.projectId,
      certificate,
      onSigningCompleted: (): void => {
        this.router.navigate([`./projects/${this.projectId}/certificates`], { relativeTo: undefined });
        this.certificateService.openPreview(this.projectId, certificate);
      },
    };
    this.certificateService.openSigningFlow(signingProperties);
  }

  onReject(certificate: Pick<CertificateRequestDetails, 'certificateRequestId'>): void {
    const dialog = this.dialogService.createDialog(RejectCertReqDialogComponent, { loadingData: this.submittingData });

    this.subscription.add(dialog.instance.dialogResult.subscribe((resultData) => {
      const actionBody: CertificateActionBody = {
        certificateRequestId: certificate.certificateRequestId,
        actionType: CertificateRequestStatus.rejected,
        comment: resultData['certRejectedComment'] || ''
      }

      this.submittingData.set(true);
      this.subscription.add(this.projectService.doCertificateAction(this.projectId, actionBody).pipe(
        tap(rsp => {
          this.submittingData.set(false);

          if (rsp.actionResult !== CertificateRequestStatus.rejected) {
            this.notificationService.showNotification({
              title: `Error when rejecting certificate!`,
              description: `Failed to reject the certificate request ${certificate.certificateRequestId}`
            }, false);
          } else {
            dialog.instance.dialog.hide();
            this.router.navigate([`./projects/${this.projectId}/certificates`], { relativeTo: undefined });
            this.certificateService.openPreview(this.projectId, certificate);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.submittingData.set(false);
          let errorMessage = '';
          if (error.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // server-side error
            errorMessage = `Error status: ${error.status}\nMessage: ${error.message}`;
          }
          this.notificationService.showNotification({
            title: `Error while rejecting!`,
            description: `${errorMessage
              || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'}`,
          }, true);
          return throwError(() => {
            return errorMessage;
          });
        })).subscribe());
    }));
  }

  onMergeDocuments(): void {
    this.dialogService.createDialog(CertificateMergeDocumentDialogComponent, { projectId: this.projectId, certificateRequestId: this.certificateRequestId });
  }
}
