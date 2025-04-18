import { HttpErrorResponse, HttpEvent, HttpEventType, HttpStatusCode } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, input } from '@angular/core';
import { forkJoin, Observable, of, PartialObserver, ReplaySubject, Subject, Subscription, throwError } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { CustomerAcceptanceStatus, CustomerMultiLevelActionStatus, EvidenceDetails, EvidenceFilter, EvidenceRemark, LineItemInfo, RelatedEvidence, StatusLineItemsUpdate, UserSession } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { FilePreview, FilePreviewService } from 'src/app/shared/file-preview-wrapper/file-preview.service';
import { AcceptancePackageService } from '../../../acceptance-package.service';
import { DetailsContextualService } from '../../details-contextual.service';
import { HostListener } from '@angular/core';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';
import { BulkDecisionDialogComponent, DialogData as BulkDecisionDialogData, ScopeOptions } from './bulk-decision-dialog/bulk-decision-dialog.component';
import { DecisionType } from './decision-type';

@Component({
  selector: 'app-line-item-details',
  templateUrl: './line-item-details.component.html',
  styleUrls: ['./line-item-details.component.less']
})
export class LineItemDetailsComponent implements OnInit, OnDestroy {
  @Input() lineItemId: string;
  @Input() packageId: string;
  @Input() projectId: string;
  @Input() lineItemDetails: LineItemInfo;
  @Input() isPackageCompleted: boolean;
  @Input() packageStatus: string;
  @Input() reloadLineItemsTable: Subject<boolean>;
  readonly isMultiLevelAcceptance = input<boolean>();   
  @Output() lineItemUpdate: EventEmitter<LineItemInfo> = new EventEmitter();
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.fullScreenMode) {
      if (event.code === 'ArrowLeft') {
        this.goPrevious();
      } else if (event.code === 'ArrowRight') {
        this.goNext();
      }
    }
  }

  AcceptanceStatus = CustomerAcceptanceStatus;
  AcceptancePackageUtils = AcceptancePackageUtils;
  Remarks = EvidenceRemark;
  compactMode = true;
  public evidenceDetails: EvidenceDetails[] = [];
  public filterEvidenceDetails: EvidenceDetails[] = [];
  get containsDecisionRequiredEvidence(): boolean {
    return !!this.evidenceDetails?.find(evidence => evidence.status !== CustomerAcceptanceStatus.CustomerAcceptanceNotRequired);
  };
  public selectedPage = 1;
  evidenceUrl: ReplaySubject<string | ArrayBuffer[]> = new ReplaySubject<string | ArrayBuffer[]>(1);
  selectedDecision: string;
  selectedAllDecision: string;
  selectedRemark: string;
  selectedFilter: EvidenceFilter[] = [EvidenceFilter.ALL];
  fullScreenMode: boolean = false;
  @ViewChild('fullscreen') private readonly fullscreenElementRef: ElementRef<HTMLElement>;
  disabledSubmission: boolean = true;
  reloadHistoryStatus: ReplaySubject<boolean> = new ReplaySubject(1);
  evidenceMappingFns = {
    mimeType: (evidence: EvidenceDetails): string => evidence.fileMIMEType,
    name: (evidence: EvidenceDetails): string => evidence.name,
    status: (evidence: EvidenceDetails): string => evidence.status,
  };
  loadingLineItem: boolean;

  // Has this components onClose() executed.
  private isClosed: boolean;
  private subscription: Subscription = new Subscription();
  relatedEvidenceList: Observable<RelatedEvidence[]>;

  decisionType = DecisionType;

  constructor(
    private detailsService: DetailsContextualService,
    private projectsService: ProjectsService,
    private packageService: AcceptancePackageService,
    private dialogService: DialogService,
    private filePreviewService: FilePreviewService,
    private sessionStorage: SessionStorageService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.fetchLineItemDetails();
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Gets the evidence file, converts to base64 encoded URL and emits to `evidenceUrl`
   */
  public getLineItemEvidence(evidenceId: string): void {
    this.filePreviewService.loading.next(true);
    const next = [];
    const selectedPageIndex = this.selectedPage - 1;
    next[selectedPageIndex] = '';
    this.evidenceUrl.next(next);
    if (evidenceId) {
      const mimeType = this.filterEvidenceDetails?.map(this.evidenceMappingFns.mimeType)[selectedPageIndex];
      const name = this.filterEvidenceDetails?.map(this.evidenceMappingFns.name)[selectedPageIndex];
      const status = this.filterEvidenceDetails?.map(this.evidenceMappingFns.status)[selectedPageIndex];
      if (status == 'Customer Approved') {
        this.selectedDecision = 'Approve'
      }
      else if (status == 'Customer Rejected') {
        this.selectedDecision = 'Reject'
      }
      else {
        this.selectedDecision = undefined;
      }

      if (mimeType === 'video/mp4') {
        this.projectsService.getEvidenceFileSasUrl(evidenceId).pipe(
          tap((evd) => {
            next[selectedPageIndex] = evd.sasUrl;
            this.evidenceUrl.next(next);
            const filePreview: FilePreview = {
              name: this.filterEvidenceDetails?.map(this.evidenceMappingFns.name)[selectedPageIndex],
              dataURI: next[selectedPageIndex],
              mimeType,
            };
            this.filePreviewService.filePreview.next(filePreview);
            this.filePreviewService.loading.next(false);
          }),
          catchError(
            (error: HttpErrorResponse): Observable<any> => {
              this.evidenceUrl.next(next);
              this.filePreviewService.filePreview.next(next[selectedPageIndex]);
              this.filePreviewService.loading.next(false);
              return of(null); // or any other stream like of('') etc.
            }
          ),
        ).subscribe();
      }
      else {
        this.projectsService.getEvidenceFile(evidenceId).pipe(
          tap((file) => {
            next[selectedPageIndex] = window.URL.createObjectURL(file);
            this.evidenceUrl.next(next);
            const filePreview: FilePreview = {
              name: this.filterEvidenceDetails?.map(this.evidenceMappingFns.name)[selectedPageIndex],
              dataURI: next[selectedPageIndex],
              mimeType,
            };
            this.filePreviewService.filePreview.next(filePreview);
            this.filePreviewService.loading.next(false);

          }),
          catchError(
            (error: HttpErrorResponse): Observable<any> => {
              this.evidenceUrl.next(next);
              this.filePreviewService.filePreview.next(next[selectedPageIndex]);
              this.filePreviewService.loading.next(false);
              return of(null); // or any other stream like of('') etc.
            }
          ),
        ).subscribe();
      }
    } else {
      this.evidenceUrl.next(next);
      this.filePreviewService.filePreview.next(next[selectedPageIndex]);
      this.filePreviewService.loading.next(false);
    }
  }

  fetchLineItemDetails(): void {
    this.loadingLineItem = true;
    const getLineItemDetails = this.projectsService.getLineItemInfo(this.projectId, this.lineItemId);
    const getLineItemEvidencesDetails = this.projectsService.getAllLineItemEvidences(this.packageId, this.lineItemId);

    const fetchSubscription = forkJoin([getLineItemDetails, getLineItemEvidencesDetails]).pipe(
      map(responses => {
        const [lineItemDetails, evidences] = responses;
        this.evidenceDetails = evidences;
        if (this.evidenceDetails.length > 0) {
          if (this.lineItemDetails.status === 'Customer Approved') {
            this.selectedAllDecision = 'Approve'
          } else if (this.lineItemDetails.status === 'Customer Rejected') {
            this.selectedAllDecision = 'Reject'
          }
          this.selectedEvidenceFilterBy();
        }

        this.lineItemUpdate.emit(lineItemDetails);
        if (this.isClosed) {
          this.detailsService.close(lineItemDetails);
        }
        this.lineItemDetails = lineItemDetails;
        this.loadingLineItem = false;
      }),
      catchError(() => {
        this.loadingLineItem = false;
        return undefined;
      })
    ).subscribe();

    this.subscription.add(fetchSubscription);
  }

  /**
   * Triggers the download of the current file stored in `evidenceUrl`.
   */
  downLoadFile(event): void {
    this.evidenceUrl.pipe(
      take(1),
      tap((evidenceUrls) => {
        const selectedPageIndex = this.selectedPage - 1;
        if (!evidenceUrls[selectedPageIndex]?.toString().startsWith('data:')) {
          this.projectsService.getEvidenceFile(this.filterEvidenceDetails[selectedPageIndex]?.internalId).pipe(
            tap((file) => {
              const link = document.createElement('a');
              const dataUrl = window.URL.createObjectURL(file);
              link.href = dataUrl;
              link.download = this.filterEvidenceDetails[selectedPageIndex].name;
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
          const evidenceUrl = evidenceUrls[selectedPageIndex];
          link.href = evidenceUrl as string;
          link.download = this.filterEvidenceDetails[selectedPageIndex].name;
          link.dispatchEvent(new MouseEvent('click'));
        }
      }),
    ).subscribe();
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
          link.download = filename || `line-item-${this.lineItemDetails?.lineItemName || this.lineItemId}-evidences.zip`;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showLogNotification({
            title: 'Report successfully downloaded!',
            description: `Downloading of evidences for line item ${this.lineItemDetails?.lineItemName || this.lineItemId} completed successfully.`
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

    this.projectsService.downloadLineItemEvidences({ projectId: this.projectId, lineItemId: this.lineItemId }).subscribe(downloadObserver);
  }

  /**
   * pagination for image viewer click event
   */
  onPageChange(currentPage: number): void {
    this.selectedPage = currentPage;
    const selectedEvidenceId = this.filterEvidenceDetails[currentPage - 1]?.internalId
    this.getLineItemEvidence(selectedEvidenceId);
    this.relatedEvidenceList = this.projectsService.getRelatedEvidenceList(selectedEvidenceId);
  }

  goPrevious(): void {
    const currentPage = this.selectedPage;
    if (this.selectedPage === 1) {
      this.selectedPage = this.filterEvidenceDetails.length;
    } else {
      this.selectedPage = this.selectedPage - 1;
    }
    if (currentPage !== this.selectedPage) {
      this.getLineItemEvidence(this.filterEvidenceDetails[this.selectedPage - 1].internalId);
    }
  }

  goNext(): void {
    const currentPage = this.selectedPage;
    if (this.selectedPage === this.filterEvidenceDetails.length) {
      this.selectedPage = 1;
    } else {
      this.selectedPage = this.selectedPage + 1;
    }
    if (currentPage !== this.selectedPage) {
      this.getLineItemEvidence(this.filterEvidenceDetails[this.selectedPage - 1].internalId);
    }
  }

  /**
   * @param permission to check
   */
  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  onClose(): void {
    this.detailsService.close(this.lineItemDetails);
    this.isClosed = true;
  }

  onCloseMinimize(): void {
    this.fullScreenMode = false;
    this.fullscreenElementRef.nativeElement.parentElement.parentElement.style.width = '79%'
  }

  /**
   * updateLineItemEvidencesStatus for updating status after clicking accept and reject button
   */
  updateLineItemEvidencesStatus(requestBody: StatusLineItemsUpdate, buttonType): void {
    const dialogData: DialogData = { dialogueTitle: 'Updating line item evidences', show: APICallStatus.Loading };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    this.projectsService.updateEvidencesStatus(this.packageId, requestBody).pipe(
      tap(() => {
        dialogMessage.instance.show = APICallStatus.Success;
        dialogMessage.instance.additionalMessage = 'Your verdict has been received. The evidence decision has been updated.';
        this.packageService.emitPackageStatusUpdate(true);
        if (buttonType == 'Approve') {
          dialogMessage.instance.dialogueTitle = 'Line item evidence approved';
          dialogMessage.instance.iconStatus = 'icon-check';
        }
        else if (buttonType == 'Reject') {
          dialogMessage.instance.dialogueTitle = 'Line item evidence rejected';
          dialogMessage.instance.iconStatus = 'icon-cross';
        }

        this.fetchLineItemDetails();
        this.reloadHistoryStatus.next(true);
        this.reloadLineItemsTable.next(true);
        this.disabledSubmission = false;
      }),
      catchError((err) => {
        this.disabledSubmission = false;
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

        // reset selected remark and selected decision
        if (this.lineItemDetails.status === 'Customer Approved') {
          this.selectedAllDecision = 'Approve'
        } else if (this.lineItemDetails.status === 'Customer Rejected') {
          this.selectedAllDecision = 'Reject'
        } else {
          this.selectedAllDecision = undefined;
        }
        if (this.evidenceDetails.length > 0) {
          if (this.evidenceDetails[this.selectedPage - 1].status === 'Customer Approved') {
            this.selectedDecision = 'Approve'
          } else if (this.evidenceDetails[this.selectedPage - 1].status === 'Customer Rejected') {
            this.selectedDecision = 'Reject'
          } else {
            this.selectedDecision = undefined;
          }
        }
        return throwError(err);
      }),
    ).subscribe();
  }

  private generateBulkDecisionRequestBody(decision: DecisionType, scope: string): StatusLineItemsUpdate {
    const remark = decision === DecisionType.approve
      ? EvidenceRemark.OK
      : EvidenceRemark.MINOR;

    const evidences = this.evidenceDetails
      .filter(evidence => evidence.status !== CustomerAcceptanceStatus.CustomerAcceptanceNotRequired)
      .filter(evidence => {
        if (scope === ScopeOptions.pendingOnly) {
          if (this.isMultiLevelAcceptance()) {
            return evidence.myLevelStatus === CustomerMultiLevelActionStatus.CustomerNewPendingApproval
            || evidence.myLevelStatus === CustomerMultiLevelActionStatus.CustomerReworkedPendingApproval; 
          } else {
            return evidence.status === CustomerAcceptanceStatus.CustomerNewPendingApproval
            || evidence.status === CustomerAcceptanceStatus.CustomerReworkedPendingApproval;
          }          
        }
        if (scope === ScopeOptions.rejectedOnly) {
          return evidence.status === CustomerAcceptanceStatus.CustomerRejected;
        }
        if (scope === ScopeOptions.approvedOnly) {
          return evidence.status === CustomerAcceptanceStatus.CustomerApproved;
        }
        return true;
      })
      .map(evidence => {
        return {
          id: evidence.internalId,
          remarks: remark,
        }
      });

    if (!evidences || evidences.length === 0) {
      this.notificationService.showNotification({
        title: 'Please select evidences',
        description: 'No evidence available in the selected status'
      });
      return undefined;
    }

    const payload = {
      status: decision === DecisionType.approve ? CustomerAcceptanceStatus.CustomerApproved : CustomerAcceptanceStatus.CustomerRejected,
      evidences
    };

    return payload;
  }

  /**
   * Opens the bulk decision dialog and passes the callback to handle the submission.
   * @param decision to handle
   */
  openBulkDecisionDialog(decision: DecisionType): void {
    const submit = (decision: DecisionType, scope: string): void => {
      this.disabledSubmission = true;
      const payload = this.generateBulkDecisionRequestBody(decision, scope);
      if (!!payload) this.updateLineItemEvidencesStatus(payload, decision);
      else this.disabledSubmission = false;
    };
    const dialogData: BulkDecisionDialogData = { decision, submit };
    this.dialogService.createDialog(BulkDecisionDialogComponent, dialogData);
  }

  public getStatusColor(status: string): string {
    return AcceptancePackageUtils.getStatusColor(status);
  }

  public getStatus(status: string): string {
    return AcceptancePackageUtils.getStatus(status);
  }

  submitDecision(decision: string): void {
    this.disabledSubmission = true;
    this.selectedDecision = decision;
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
        id: this.filterEvidenceDetails[this.selectedPage - 1].internalId,
        remarks: remarkValue
      }]
    };

    this.updateLineItemEvidencesStatus(requestBody, decision);
  }

  selectedEvidenceFilterBy(filterEvent?: EvidenceFilter[]): void {
    if (filterEvent) this.selectedFilter = filterEvent;
    const filter = this.selectedFilter;
    this.filterEvidenceDetails = this.evidenceDetails.filter((eDetails) => {
      return !!filter.find((value) => {
        if (value === EvidenceFilter.NEW) {
          return eDetails.status === CustomerAcceptanceStatus.CustomerNew || eDetails.status === CustomerAcceptanceStatus.CustomerRevision;
        }
        if (value === EvidenceFilter.PENDING) {
          if (this.isMultiLevelAcceptance()) {
            return eDetails.myLevelStatus === CustomerMultiLevelActionStatus.CustomerNewPendingApproval;
          } else {
            return eDetails.status === CustomerAcceptanceStatus.CustomerNewPendingApproval;  
          }
        }
        if (value === EvidenceFilter.APPROVED) {
          return eDetails.status === CustomerAcceptanceStatus.CustomerApproved;
        }
        if (value === EvidenceFilter.REJECTED) {
          return eDetails.status === CustomerAcceptanceStatus.CustomerRejected || eDetails.status === CustomerAcceptanceStatus.CustomerRejectedNoAction;
        }
        if (value === EvidenceFilter.REWORKED) {
          return eDetails.status === CustomerAcceptanceStatus.CustomerReworked;
        }
        if (value === EvidenceFilter.REWORKEDPENDING) {
          if (this.isMultiLevelAcceptance()) {
            return eDetails.myLevelStatus === CustomerMultiLevelActionStatus.CustomerReworkedPendingApproval;
          } else {
            return eDetails.status === CustomerAcceptanceStatus.CustomerReworkedPendingApproval;
          }          
        }
        if (value === EvidenceFilter.VIEW_ONLY) {
          return eDetails.status === CustomerAcceptanceStatus.CustomerAcceptanceNotRequired;
        }
        if (value === EvidenceFilter.ALL) {
          return true;
        }
        return false;
      })
    });
    const totalRecords = this.filterEvidenceDetails.length;
    if (totalRecords < this.selectedPage) {
      this.selectedPage = 1;
    }
    const selectedEvidenceId = this.filterEvidenceDetails[this.selectedPage - 1]?.internalId
    this.getLineItemEvidence(selectedEvidenceId);
    this.relatedEvidenceList = this.projectsService.getRelatedEvidenceList(selectedEvidenceId);
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

  maximizeScreen(event): void {
    this.fullScreenMode = true;
    this.fullscreenElementRef.nativeElement.parentElement.parentElement.style.width = '100%';
  }

  switchThumbnail(event): void {
    this.compactMode = false;
  }

  switchToEvidence(selectedEvidenceId: string): void {
    this.compactMode = true;
    const index = this.filterEvidenceDetails.findIndex(evidence => evidence.internalId === selectedEvidenceId);
    if (index !== -1) {
      this.onPageChange(index + 1);
    } else {
      this.onPageChange(1);
    }
  }

  switchRelatedEvidence(selectedEvidenceId: string): void {
    const index = this.filterEvidenceDetails.findIndex(evidence => evidence.internalId === selectedEvidenceId);
    if (index !== -1) {
      this.onPageChange(index + 1);
    } else {
      const indexInFullList = this.evidenceDetails.findIndex(evidence => evidence.internalId === selectedEvidenceId);
      if (indexInFullList !== -1) {
        this.selectedEvidenceFilterBy([EvidenceFilter.ALL]);
        this.onPageChange(indexInFullList + 1);
      } else {
        console.error('Related evidence %s not found in evidences list', selectedEvidenceId);
        this.notificationService.showNotification({
          title: 'The selected evidence is not available',
          description: 'Please try again later.'
        });
      }
    }
  }
}
