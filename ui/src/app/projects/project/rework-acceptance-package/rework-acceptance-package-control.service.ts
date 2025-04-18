import { Injectable, OnDestroy, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CommentsEntry, CustomerAcceptanceStatus, Evidence, LineItem, MilestoneEvidenceRow, RelatedEvidence } from '../../projects.interface';
import { LineItemInfoReworkDialogComponent } from './line-item-info-rework-dialog/line-item-info-rework-dialog.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { DetailsContextualService } from '../acceptance-package-details/details-contextual.service';
import { DataSourceTool } from '../acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnail/evidence-thumbnail.component';
import { MaximizeScreenComponent } from './maximize-screen/maximize-screen.component';
import { HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { ProjectsService } from '../../projects.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { LineItemTableData } from './rework-acceptance-package.component';
import { Observable, Subscription, catchError, map, shareReplay, tap, throwError } from 'rxjs';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { CommentContext, CommentLevel, EvidenceLevel } from '../acceptance-package-details/comment-history/comment-history.component';
import { CommentsDialogComponent } from './comments-dialog/comments-dialog.component';
import { ActivatedRoute } from '@angular/router';

export interface ReworkFormData {
  packageComponents: LineItemTableData[];
  packageEvidences: Evidence[];
  milestoneEvidences: MilestoneEvidenceRow[];
}

export interface ControlModel {
  linkWithRejectedComponentEvidence: FormControl<boolean>;
  packageComponents: FormControl<LineItemTableData[]>;
  packageEvidences: FormControl<Evidence[]>;
  milestoneEvidences: FormControl<MilestoneEvidenceRow[]>;
}

@Injectable()
export class ReworkPackageControlService implements OnDestroy {

  private commentsObservableMap = new Map();
  private subscription: Subscription = new Subscription();

  constructor(
    private dialogService: DialogService,
    private viewContainerRef: ViewContainerRef,
    private detailsService: DetailsContextualService,
    private projectService: ProjectsService,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
  ) { }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toFormGroup(data: ReworkFormData): FormGroup<ControlModel> {
    return new FormGroup({
      linkWithRejectedComponentEvidence: new FormControl(false, { nonNullable: true }),
      packageComponents: new FormControl<LineItemTableData[]>(data.packageComponents),
      packageEvidences: new FormControl<Evidence[]>(data.packageEvidences),
      milestoneEvidences: new FormControl<MilestoneEvidenceRow[]>(data.milestoneEvidences),
    }, [this.linkedRejectedEvidencesValidator]);
  }

  private linkedRejectedEvidencesValidator: ValidatorFn = (control: FormGroup<ControlModel>): ValidationErrors | null => {
    const parentIsEvidence = control.controls.linkWithRejectedComponentEvidence.value;
    const incompleteLineItemRework = control.controls.packageComponents.value.find(lineItem => !this.isLineItemCompleted(lineItem, parentIsEvidence));
    const incompletePackageEvidenceRework = control.controls.packageEvidences.value
      .filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected)
      .find(evidence => {
        return !this.isEvidenceReworkCompleted(evidence)
      });
    const incompleteMilestoneEvidenceRework = control.controls.milestoneEvidences.value
      .filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected)
      .find(evidence => {
        return !this.isEvidenceReworkCompleted(evidence)
      });
    return (incompleteLineItemRework || incompletePackageEvidenceRework || incompleteMilestoneEvidenceRework) ? { incompleteLineItemRework, incompletePackageEvidenceRework, incompleteMilestoneEvidenceRework } : null;
  };

  isEvidenceReworkCompleted(evidence: Evidence | MilestoneEvidenceRow): boolean {
    return !evidence?.relatedEvidences == undefined || evidence?.relatedEvidences?.length !== 0;
  }

  handleLineItemIdCell(
    td: HTMLTableCellElement,
    cellData: string,
    lineItemTableData: LineItemTableData[],
    options: {
      lineItems: LineItem[],
      packageId: string,
      enableStatusIndicator?: boolean,
      parentIsEvidenceControl?: FormControl<boolean>,
      lineItemsControl?: FormControl<LineItemTableData[]>,
    },
  ): void {
    const rowData: LineItemTableData = lineItemTableData?.find((row: LineItemTableData) => row.lineItemLinearId === cellData);
    td.replaceChildren(document.createTextNode(rowData.lineItemName));
    const button = document.createElement('button');
    button.classList.add('btn-icon', 'mr-sm');
    button.setAttribute('title', 'Line item info');
    const infoIcon = document.createElement('i');
    infoIcon.classList.add('icon', 'icon-info');
    button.appendChild(infoIcon);
    td.prepend(button);
    if (options?.enableStatusIndicator) {
      const isCompleted: boolean = this.isLineItemCompleted(rowData, options.parentIsEvidenceControl.value);
      const status = document.createElement('i');
      status.classList.add('status', 'icon', 'icon-alarm-level6', `color-${isCompleted ? 'green' : 'red'}`, 'mr-sm');

      const changeStatusCue = (lineItem, parentIsEvidence): void => {
        if (this.isLineItemCompleted(lineItem, parentIsEvidence)) {
          status.classList.add('color-green');
          status.classList.remove('color-red');
        } else {
          status.classList.add('color-red');
          status.classList.remove('color-green');
        }
      }

      if (options?.lineItemsControl) {
        options.lineItemsControl.valueChanges.subscribe({
          next: lineItems => {
            const lineItem = lineItems.find(lineItem => lineItem.lineItemLinearId === cellData);
            const parentIsEvidence = options.parentIsEvidenceControl?.value;
            changeStatusCue(lineItem, parentIsEvidence);
          },
        });
      }
      if (options.parentIsEvidenceControl) {
        options.parentIsEvidenceControl.valueChanges.subscribe({
          next: parentIsEvidence => {
            const lineItem = options.lineItemsControl.value.find(lineItem => lineItem.lineItemLinearId === cellData);
            changeStatusCue(lineItem, parentIsEvidence);
          }
        })
      }
      td.prepend(status);
    }
    button.addEventListener('click', () => {
      this.openLineItemInfo(rowData, options?.lineItems, options?.packageId);
    });
  }

  private isLineItemCompleted(details: LineItemTableData, parentIsEvidence: boolean): boolean {
    return parentIsEvidence
      ? !details.evidences
        .filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected)
        .find(evidence => evidence?.relatedEvidences == undefined || evidence?.relatedEvidences.length === 0)
      : !!details.evidences
        .find(evidence => evidence.status === CustomerAcceptanceStatus.Ready);
  }

  openLineItemInfo(details: LineItemTableData, lineItems: LineItem[], packageId: string): void {
    const lineItemDetails = lineItems.find(data => data.internalId === details.lineItemLinearId);
    const dialogRef = this.dialogService.createDialog(
      LineItemInfoReworkDialogComponent,
      { lineItemDetails, packageId, packageStatus: 'Customer Rejected', projectId: this.route.snapshot.parent.params.id }
    );
  }

  maximizeScreen(evidenceId: string, dataSourceTool: DataSourceTool): void {
    this.detailsService.wizardOpen(
      MaximizeScreenComponent,
      this.viewContainerRef,
      {
        evidenceId, dataSourceTool
      }
    );
  }

  /**
   * Downloads the details.
   * @param rowData complete row details
   */
  public download(evidence: Evidence | MilestoneEvidenceRow): void {
    this.projectService.downloadEvidence(evidence.internalId).subscribe({
      next: (response: HttpResponse<any>) => {
        const contentDisposition = response.headers.get('content-disposition');
        const filename: string = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
          .replace('"', '') // replacing one " character
          .replace('"', ''); // replacing second " character
        const blob = new Blob([response.body], { type: 'jpg/pdf' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.dispatchEvent(new MouseEvent('click'));
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: 'Error downloading the evidence!',
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else {
          this.notificationService.showNotification({
            title: 'Error downloading the evidence!',
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
      },
    });
  }

  fetchLastEvidenceComment(
    identifier: {
      evidenceId: string;
    }
  ): Observable<CommentsEntry> {
    const serializedIdentifier = JSON.stringify(identifier);
    const existingObservable = this.commentsObservableMap.get(serializedIdentifier);
    if (existingObservable) return existingObservable;
    const newObservable = this.projectService.getPackageEvidenceComments(identifier, { limit: 1, offset: 0 }).pipe(
      map(response => response.results.find(() => true)),
      shareReplay(1),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      }),
    )
    this.commentsObservableMap.set(serializedIdentifier, newObservable);
    return newObservable;
  }

  updateCommentCell(td: Element, rowData: (Evidence | RelatedEvidence | MilestoneEvidenceRow)): void {
    const packageId = this.route.snapshot.params.id;
    const commentContext: CommentContext = {
      commentLevel: CommentLevel.evidence,
      evidenceLevel: rowData.status === CustomerAcceptanceStatus.CustomerRejected && Object.keys(rowData).includes('lineItemId') ? EvidenceLevel.lineItem : EvidenceLevel.package,
      evidenceId: rowData.internalId,
      name: rowData.name,
      packageStatus: rowData.status,
      packageId,
    };
    td.replaceChildren(this.createCommentIconButton(commentContext), 'loading...');
    const fetchEvidenceComments = this.fetchLastEvidenceComment({ evidenceId: rowData.internalId }).pipe(
      tap(comment => {
        if (comment) td.replaceChildren(this.createCommentIconButton(commentContext), `${comment.comment}`);
        else td.replaceChildren(this.createCommentIconButton(commentContext), '--');
      }),
      catchError((error: HttpErrorResponse) => {
        td.replaceChildren(this.createCommentIconButton(commentContext), '--');
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      })
    );
    this.subscription.add(fetchEvidenceComments.subscribe());
  }

  createCommentIconButton(commentContext: CommentContext): HTMLButtonElement {
    const button = document.createElement('button');
    button.classList.add('ml-sm', 'mr-sm', 'btn-icon');
    const icon = document.createElement('i');
    icon.classList.add('icon', 'icon-message-single');
    button.appendChild(icon);
    button.title = commentContext?.packageStatus === CustomerAcceptanceStatus.CustomerRejected ? 'Show comments' : 'Show/add comments'
    button.addEventListener('click', () => {
      this.dialogService.createDialog(CommentsDialogComponent, { commentContext });
    });
    return button;
  }

  delete(evidence: Evidence, deleteButton: HTMLButtonElement): Observable<any> {
    deleteButton.disabled = true;
    return this.networkRollOutService.deleteEvidenceByUUID(evidence.internalId).pipe(
      map((resp) => {
        this.notificationService.showNotification({
          title: 'Evidence deleted successfully',
          description: ''
        }, true);

        deleteButton.disabled = false;
        return resp;
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: 'Error deleting the evidence!',
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else if (err.error?.responseMessage) {
          this.notificationService.showNotification({
            title: `Error deleting the evidence! ${err.error.responseMessage}`,
            description: `${err.error.responseMessageDescription}`
          });
        }
        else {
          this.notificationService.showNotification({
            title: 'Error deleting the evidence!',
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }

        deleteButton.disabled = false;
        return throwError(() => err);
      }),
    );
  }
}
