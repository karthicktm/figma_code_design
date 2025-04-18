import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, of, PartialObserver, ReplaySubject, Subscription, throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { CustomerAcceptanceStatus, Evidence, EvidenceRemark, ExtendedAttribute, GetEvidenceResponse, RelatedEvidence, EvidenceStatusUpdate, UserSession } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { UploadReferencedEvidenceDialogComponent } from 'src/app/projects/upload-referenced-evidence-dialog/upload-referenced-evidence-dialog.component';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { FilePreview, FilePreviewService } from 'src/app/shared/file-preview-wrapper/file-preview.service';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';
import { AcceptancePackageService, ComponentActionPermission } from '../../../acceptance-package.service';
import { DetailsContextualService } from '../../details-contextual.service';
import { SourceReportDialogComponent } from '../source-report-dialog/source-report-dialog.component';
import { HttpErrorResponse, HttpEvent, HttpEventType, HttpStatusCode } from '@angular/common/http';
import { RectMarker } from 'src/app/shared/file-preview-wrapper/image-file-preview/markable.directive';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from 'src/app/portal/services/notification.service';

@Component({
  selector: 'app-package-evidence-details',
  templateUrl: './package-evidence-details.component.html',
  styleUrls: ['./package-evidence-details.component.less']
})
export class PackageEvidenceDetailsComponent implements OnInit, AfterViewInit {
  @Input() packageId: string;
  @Input() evidence: Evidence;
  @Input() isPackageCompleted: boolean;
  @Input() packageStatus: string;
  @Input() totalRecords: number;
  @Input() pageNumber: number;
  @Output() next: EventEmitter<unknown> = new EventEmitter();
  @Output() previous: EventEmitter<unknown> = new EventEmitter();
  @Input() projectId: string;
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.fullScreenMode) {
      if (event.code === 'ArrowLeft') {
        this.previous.emit();
      } else if (event.code === 'ArrowRight') {
        this.next.emit();
      }
    }
  }

  Remarks = EvidenceRemark;
  AcceptanceStatus = CustomerAcceptanceStatus;
  AcceptancePackageUtils = AcceptancePackageUtils;
  evidenceDetails: Evidence;
  imgUrl: ReplaySubject<string | ArrayBuffer> = new ReplaySubject<string | ArrayBuffer>(1);
  selectedRemark: string;
  selectedDecision: string;
  disabledSubmission: boolean = true;
  reloadHistoryStatus: ReplaySubject<boolean> = new ReplaySubject(1);
  viewOnly: boolean;
  evidenceId: string;
  fullScreenMode: boolean = true;
  @ViewChild('fullscreen') private readonly fullscreenElementRef: ElementRef<HTMLElement>;

  private subscription: Subscription = new Subscription();
  relatedEvidenceList: Observable<RelatedEvidence[]>;
  fileToolbarIcons: string[] = ['zoom', 'download', 'maximize'];

  constructor(
    private projectsService: ProjectsService,
    private packageService: AcceptancePackageService,
    private dialogService: DialogService,
    private sessionStorage: SessionStorageService,
    private detailsService: DetailsContextualService,
    private filePreviewService: FilePreviewService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.evidenceDetails = this.evidence;
    const evidenceId = this.evidenceDetails.internalId;
    this.evidenceId = evidenceId;
    this.relatedEvidenceList = this.projectsService.getRelatedEvidenceList(evidenceId);
    this.settingEvidenceStatus();
    this.retrieveFileUrl();
    this.filePreview();
    if (this.packageStatus === 'Customer New-Pending approval' || this.packageStatus === 'Customer Reworked-Pending approval') {
      const userActionInProgressSubscription = this.packageService.currentPackageUserActionInProgress.subscribe({
        next: (isInProgress) => this.disabledSubmission = !isInProgress,
      });
      this.subscription.add(userActionInProgressSubscription);
    }
    else {
      this.disabledSubmission = true;
    }

    // If projectId was not provided as component input try to gather from URL.
    if (this.projectId === undefined) this.projectId = this.route.snapshot.parent.parent.paramMap.get('id');
  }

  ngAfterViewInit(): void {
    if (this.fullScreenMode === true) this.maximizeScreen();
  }

  /**
   * Gets URL of the file
   */
  public retrieveFileUrl(evidence: Evidence = this.evidenceDetails): void {
    if (evidence.fileMIMEType === 'video/mp4'
    ) {
      this.projectsService.getEvidenceFileSasUrl(evidence.internalId).pipe(
        tap((evd) => {
          this.imgUrl.next(evd.sasUrl);
        }),
        catchError(
          (error: HttpErrorResponse): Observable<any> => {
            this.imgUrl.next('');
            return of(null); // or any other stream like of('') etc.
          }
        ),
      )
        .subscribe();
    }
    else {
      this.projectsService.getEvidenceFile(evidence.internalId).pipe(
        tap((file) => {
          this.imgUrl.next(window.URL.createObjectURL(file));
        }),
        catchError(
          (error: HttpErrorResponse): Observable<any> => {
            this.imgUrl.next('');
            return of(null); // or any other stream like of('') etc.
          }
        ),
      )
        .subscribe();
    }
  }

  /**
   * calls the file preview
   */
  public filePreview(): void {
    this.fileToolbarIcons = ['zoom', 'download', 'maximize'];
    this.filePreviewService.loading.next(true);
    const filePreview: FilePreview = { name: '', dataURI: '', mimeType: '' };
    const observable = this.imgUrl;
    observable.subscribe({
      next: value => {
        filePreview.name = this.evidenceDetails.name;
        filePreview.mimeType = this.evidenceDetails.fileMIMEType;
        filePreview.dataURI = value as string;
        const markingsAttribute = this.evidenceDetails.extendedAttributes?.find((attribute: ExtendedAttribute) => attribute.attributeName === 'markings');
        const allIcons = [
          'zoom',
          'download',
          // To enable marker edit add 'edit' back to the array.
          // 'edit',
          'maximize'
        ];
        if (markingsAttribute) {
          this.fileToolbarIcons = markingsAttribute.isReadOnly ? allIcons.filter(icon => icon !== 'edit') : allIcons;
        }
        else {
          this.isUserAuthorized(ComponentActionPermission.EditEvidenceMarkings).pipe(
            take(1),
          ).subscribe({
            next: (isAuthorized) => { this.fileToolbarIcons = isAuthorized ? allIcons : allIcons.filter(icon => icon !== 'edit'); },
          });
        }
        const markings = markingsAttribute?.attributeValue;
        if (markings) {
          // TODO: catch JSON parse errors to avoid execution breakage in runtime
          filePreview.markings = JSON.parse(markings);
        }
        this.filePreviewService.filePreview.next(filePreview);
        this.filePreviewService.loading.next(false);
      },
      error: (error) => {
        this.filePreviewService.filePreview.next(filePreview);
        this.filePreviewService.loading.next(false);
        console.log(error);
      }
    });
  }


  public getStatusColor(status: string): string {
    return AcceptancePackageUtils.getStatusColor(status);
  }

  public getStatus(status: string): string {
    return AcceptancePackageUtils.getStatus(status);
  }
  onClose(): void {
    this.detailsService.close();
  }

  onRotate(event): void {
    // Do nothing
  }

  downLoadFile(event): void {
    this.imgUrl.pipe(
      take(1),
      tap((imgUrl) => {
        if (!imgUrl.toString().startsWith('data:')) {
          this.projectsService.getEvidenceFile(this.evidenceDetails.internalId).pipe(
            tap((file) => {
              const link = document.createElement('a');
              const dataUrl = window.URL.createObjectURL(file);
              link.href = dataUrl;
              link.download = this.evidenceDetails.name;
              link.dispatchEvent(new MouseEvent('click'));

            }),
            catchError(
              (error: HttpErrorResponse): Observable<never> => {
                return throwError(error);
              }
            ),
          ).subscribe();
        }
        else {
          const link = document.createElement('a');
          link.href = imgUrl as string;
          link.download = this.evidenceDetails.name;
          link.dispatchEvent(new MouseEvent('click'));
        }
      }),
    ).subscribe();
  }

  onMarkingsChange(event: RectMarker[]): void {
    console.log('Markings changed', event);
    const markings: string = JSON.stringify(event);
    const markingsAttr: ExtendedAttribute = {
      attributeName: 'markings',
      attributeType: 'string',
      attributeValue: markings,
    };

    this.projectsService.saveEvidenceExtendedAttribute(this.evidenceId, markingsAttr).subscribe();
  }

  submitDecision(decision: string): void {
    this.selectedDecision = decision;
    this.disabledSubmission = true;
    let statusValue = '';
    let remarkValue = '';
    if (decision == 'Reject') {
      statusValue = 'Customer Rejected';
      remarkValue = this.Remarks.MINOR;
    } else {
      statusValue = 'Customer Approved';
      remarkValue = this.Remarks.OK;
    }

    if (!!this.selectedRemark) {
      remarkValue = this.selectedRemark;
    }

    const requestBody = {
      status: statusValue,
      evidences: [{
        id: this.evidenceDetails.internalId,
        remarks: remarkValue
      }]
    };

    this.updatePackageEvidencesStatus(requestBody, decision);
  }

  updatePackageEvidencesStatus(requestBody: EvidenceStatusUpdate, buttonType: string): void {
    const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    this.projectsService.updatePackageEvidencesStatus(this.packageId, requestBody).subscribe({
      next: (data: GetEvidenceResponse) => {
        this.disabledSubmission = false;
        dialogMessage.instance.show = APICallStatus.Success;
        dialogMessage.instance.additionalMessage = 'Your verdict has been received. The evidence decision has been updated.';
        this.packageService.emitPackageStatusUpdate(true);
        if (buttonType == 'Approve') {
          dialogMessage.instance.dialogueTitle = 'Evidence approved';
          dialogMessage.instance.iconStatus = 'icon-check';
        }
        else if (buttonType == 'Reject') {
          dialogMessage.instance.dialogueTitle = 'Evidence rejected';
          dialogMessage.instance.iconStatus = 'icon-cross';
        }
        this.getPackageEvidenceDetails();
        this.reloadHistoryStatus.next(true);
      },
      error: (err) => {
        dialogMessage.instance.show = APICallStatus.Error;
        let additionalMessage = '';
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
        } else {
          additionalMessage = '\n Please follow the FAQ doc for further steps.';
        }
        dialogMessage.instance.statusMessage = 'Error when updating the package evidence!' + additionalMessage;
        dialogMessage.instance.dialogueTitle = 'Failed to submit';
        dialogMessage.instance.additionalMessage = '';
        dialogMessage.instance.actionOn.next('FAQ');
        console.error(err);

        // reset selected remark and selected decision
        this.selectedRemark = this.evidenceDetails.remarks;
        if (this.evidenceDetails.status === 'Customer Approved') {
          this.selectedDecision = 'Approve'
        } else if (this.evidenceDetails.status === 'Customer Rejected') {
          this.selectedDecision = 'Reject'
        } else {
          this.selectedDecision = undefined;
        }
      },
    });
  }

  private dialogResultHandler = (result: boolean): void => {
    if (result === true) {
      this.relatedEvidenceList = this.projectsService.getRelatedEvidenceList(this.evidence.internalId);
    }
  }

  /**
   * Open dialog to upload evidences.
   */
  onUploadNewEvidence(): void {
    const dialogRef = this.dialogService.createDialog(UploadReferencedEvidenceDialogComponent, {
      projectId: this.projectId,
      parentId: this.packageId,
      parentEvidenceId: this.evidence.internalId,
      name: this.packageId,
      packageId: this.packageId,
      tag: this.evidence.tag,
    });
    this.subscription.add(
      dialogRef.instance.dialogResult.subscribe({
        next: this.dialogResultHandler,
      }),
    );

    this.subscription.add(
      dialogRef.instance.dialogResult.subscribe({
        next: this.dialogResultHandler,
      }),
    )
  }

  /**
   * Open dialog to source report from NRO tool as evidence.
   */
  sourceReportAsEvidence(): void {
    const dialogRef = this.dialogService.createDialog(
      SourceReportDialogComponent,
      {
        projectId: this.projectId,
        parentId: this.packageId,
        parentType: 'AcceptancePackage',
        tag: this.evidence.tag,
        parentEvidenceId: this.evidence.internalId,
      }
    );
    this.subscription.add(
      dialogRef.instance.dialogResult.subscribe({
        next: this.dialogResultHandler,
      }),
    );
  }

  isRemarkDisabled(): boolean {
    const roleType = this.sessionStorage.get<UserSession>(CacheKey.userSession).roleType;
    if (roleType.find(r => r === 'Customer Approver')
      && !this.isPackageCompleted
      && !this.viewOnly
      && (this.packageStatus === 'Customer New-Pending approval' || this.packageStatus === 'Customer Reworked-Pending approval')
    ) {
      return this.disabledSubmission;
    } else {
      return true;
    }
  }

  /**
   * @param permission permission to check
   * @returns boolean whether permission is granted
   */
  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  onCloseMinimize(): void {
    this.fullScreenMode = false;
    this.fullscreenElementRef.nativeElement.parentElement.parentElement.parentElement.style.width = '79%'
  }

  maximizeScreen(): void {
    this.fullScreenMode = true;
    this.fullscreenElementRef.nativeElement.parentElement.parentElement.parentElement.style.width = '100%';
  }

  getPackageEvidenceDetails(reloadFile: boolean = false): void {
    this.projectsService.getEvidence(this.evidenceId).subscribe({
      next: (data) => {
        this.evidenceDetails = data;
        this.settingEvidenceStatus();
        if (reloadFile) {
          this.retrieveFileUrl();
        }
      }
    });
  }

  settingEvidenceStatus(): void {
    this.selectedRemark = this.evidenceDetails.remarks;
    if (this.evidenceDetails.status === 'Customer Approved') {
      this.selectedDecision = 'Approve'
    } else if (this.evidenceDetails.status === 'Customer Rejected') {
      this.selectedDecision = 'Reject'
    }
    else {
      this.selectedDecision = undefined
    }
    if (this.evidenceDetails.status === 'Customer Acceptance Not Required') {
      this.viewOnly = true;
    } else {
      this.viewOnly = false;
    }
  }

  switchEvidence(evidenceId: string): void {
    this.evidenceId = evidenceId;
    this.getPackageEvidenceDetails(true);
    this.relatedEvidenceList = this.projectsService.getRelatedEvidenceList(evidenceId);
  }

  downloadAllEvidences(event: CustomEvent): void {
    const targetElement: HTMLButtonElement = event.target as HTMLButtonElement;
    const targetElementOriginalText: string = targetElement.textContent;
    const downloadObserver: PartialObserver<HttpEvent<Blob>> = {
      next: (result => {
        if (result.type === HttpEventType.Sent) {
          targetElement.disabled = true;
          targetElement.textContent = `${targetElementOriginalText.slice(0, targetElementOriginalText.length - 12)}...preparing`;
        }
        if (result.type === HttpEventType.DownloadProgress) {
          const downloadProgress = `${result.total ? `${parseFloat((result.loaded / result.total * 100).toFixed(0))}%` : `${this.projectsService.formatBytes(result.loaded, 0)}`}`;
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
          link.download = filename || `package-evidences-of-${this.packageId}.zip`;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showLogNotification({
            title: 'Evidences successfully downloaded!',
            description: `Downloading of package evidences for package ${this.packageId} completed successfully.`
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElement.textContent = targetElementOriginalText;
        targetElement.disabled = false;
        const statusMessage = 'Error when downloading the evidences!';
        // push notification for the error message
        this.notificationService.showLogNotification({
          title: statusMessage,
          description: 'Please try again.'
        });
      },
    };

    this.projectsService.downloadPackageLevelEvidences(this.packageId).subscribe(downloadObserver);
  }
}
