import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, of, ReplaySubject, Subscription, throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { SessionStorageService, CacheKey } from 'src/app/portal/services/session-storage.service';
import { CustomerAcceptanceStatus, Evidence, EvidenceRemark, RelatedEvidence, StatusLineItemsUpdate, UserSession } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { FilePreview, FilePreviewService } from 'src/app/shared/file-preview-wrapper/file-preview.service';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';
import { AcceptancePackageService } from '../../../acceptance-package.service';
import { DetailsContextualService } from '../../details-contextual.service';

@Component({
  selector: 'app-lineitem-evidence-details',
  templateUrl: './lineitem-evidence-details.component.html',
  styleUrls: ['./lineitem-evidence-details.component.less']
})
export class LineitemEvidenceDetailsComponent implements OnInit, AfterViewInit {

  @Input() packageId: string;
  @Input() evidence: Evidence;
  @Input() lineItemId: string;
  @Input() isPackageCompleted: boolean;
  @Input() packageStatus: string;
  @Input() totalRecords: number;
  @Input() pageNumber: number;
  @Output() next: EventEmitter<unknown> = new EventEmitter();
  @Output() previous: EventEmitter<unknown> = new EventEmitter();
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
  evidenceId: string;
  fullScreenMode: boolean = true;
  @ViewChild('fullscreen') private readonly fullscreenElementRef: ElementRef<HTMLElement>;
  private subscription: Subscription = new Subscription();
  relatedEvidenceList: Observable<RelatedEvidence[]>;

  constructor(
    private projectsService: ProjectsService,
    private packageService: AcceptancePackageService,
    private dialogService: DialogService,
    private sessionStorage: SessionStorageService,
    private detailsService: DetailsContextualService,
    private filePreviewService: FilePreviewService
  ) { }

  ngOnInit(): void {
    this.evidenceDetails = this.evidence;
    const evidenceId = this.evidenceDetails.internalId
    this.evidenceId = evidenceId;
    this.settingEvidenceStatus();
    this.relatedEvidenceList = this.projectsService.getRelatedEvidenceList(evidenceId);
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
  }

  ngAfterViewInit(): void {
    if (this.fullScreenMode === true) this.maximizeScreen();
  }

  /**
   * Gets URL of the image
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
   * calls the evidence details service method
   */
  public filePreview(): void {
    this.filePreviewService.loading.next(true);
    const filePreview: FilePreview = { name: '', dataURI: '', mimeType: '' };
    const observable = this.imgUrl;
    observable.subscribe({
      next: value => {
        filePreview.name = this.evidenceDetails.name;
        filePreview.mimeType = this.evidenceDetails.fileMIMEType;
        filePreview.dataURI = value as string;
        this.filePreviewService.filePreview.next(filePreview);
        this.filePreviewService.loading.next(false);
      },
      error: (error) => {
        console.log(error);
        this.filePreviewService.filePreview.next(filePreview);
        this.filePreviewService.loading.next(false);
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

  submitDecision(decision: string): void {
    this.selectedDecision = decision;
    this.disabledSubmission = true;
    let statusValue: CustomerAcceptanceStatus;
    let remarkValue = '';

    if (decision == 'Reject') {
      statusValue = CustomerAcceptanceStatus.CustomerRejected;
      remarkValue = this.Remarks.MINOR;
    } else {
      statusValue = CustomerAcceptanceStatus.CustomerApproved;
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
    this.updateLineItemEvidencesStatus(requestBody, decision);
  }
  /**
  * updateLineItemEvidencesStatus for updating status after clicking accept and reject button
  */
  updateLineItemEvidencesStatus(requestBody: StatusLineItemsUpdate, buttonType: string): void {
    const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    this.projectsService.updateEvidencesStatus(this.packageId, requestBody).subscribe({
      next: () => {
        dialogMessage.instance.show = APICallStatus.Success;
        dialogMessage.instance.additionalMessage = 'Your verdict has been received. The evidence decision has been updated.';
        this.packageService.emitPackageStatusUpdate(true);
        if (buttonType == 'Approve') {
          dialogMessage.instance.dialogueTitle = 'Evidence approved';
          dialogMessage.instance.iconStatus = 'icon-check';
          this.evidenceDetails.status = CustomerAcceptanceStatus.CustomerApproved;
        }
        else if (buttonType == 'Reject') {
          dialogMessage.instance.dialogueTitle = 'Evidence rejected';
          dialogMessage.instance.iconStatus = 'icon-cross';
          this.evidenceDetails.status = CustomerAcceptanceStatus.CustomerRejected;
        }
        this.getLineItemEvidenceDetails();
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
        dialogMessage.instance.statusMessage = 'Error when updating the line item evidence!' + additionalMessage;
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

  isRemarkDisabled(): boolean {
    const roleType = this.sessionStorage.get<UserSession>(CacheKey.userSession).roleType;
    if (roleType.find(r => r === 'Customer Approver')
      && !this.isPackageCompleted
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

  getLineItemEvidenceDetails(reloadFile: boolean = false): void {
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
  }

  switchEvidence(evidenceId: string): void {
    this.evidenceId = evidenceId;
    this.getLineItemEvidenceDetails(true);
    this.relatedEvidenceList = this.projectsService.getRelatedEvidenceList(this.evidenceId);
  }
}
