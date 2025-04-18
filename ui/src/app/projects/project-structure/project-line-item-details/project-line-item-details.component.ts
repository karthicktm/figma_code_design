import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { EMPTY, forkJoin, Observable, of, ReplaySubject, Subscription, throwError } from 'rxjs';
import { catchError, expand, filter, map, reduce, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { CustomerAcceptanceStatus, Evidence, EvidenceDetails, EvidenceFilter, LineItemInfo, RelatedEvidence, RelatedEvidences, ToolContext } from 'src/app/projects/projects.interface';
import { ProjectsService, uploadByteLimit } from 'src/app/projects/projects.service';
import { APICallStatus } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { ZoomEvents } from 'src/app/shared/file-preview-wrapper/file-preview-wrapper.component';
import { FilePreview, FilePreviewService } from 'src/app/shared/file-preview-wrapper/file-preview.service';
import { Data, SourceReportDialogComponent } from '../../project/acceptance-package-details/attached-documents/source-report-dialog/source-report-dialog.component';
import { DetailsContextualService } from '../../project/acceptance-package-details/details-contextual.service';
import AcceptancePackageUtils from '../../project/acceptance-package-utilities';
import { AcceptancePackageService } from '../../project/acceptance-package.service';
import { UploadReferencedEvidenceDialogComponent } from '../../upload-referenced-evidence-dialog/upload-referenced-evidence-dialog.component';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DataSourceTool } from '../../project/acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnail/evidence-thumbnail.component';
import { NotificationService } from 'src/app/portal/services/notification.service';

@Component({
  selector: 'app-project-line-item-details',
  templateUrl: './project-line-item-details.component.html',
  styleUrls: ['./project-line-item-details.component.less'],
})
export class ProjectLineItemDetailsComponent implements OnInit {
  @Input() lineItemId: string;
  @Input() projectId: string;
  @Input() allowAttachmentsDelete: boolean = true;
  @Input() isRework: boolean;
  @Input() siteId: string;
  lineItemDetails: LineItemInfo;
  dataSourceTool = DataSourceTool.nro;

  compactMode = true;
  loadingEvidences: boolean = false;
  public evidenceDetails: Evidence[] = [];
  public filterEvidenceDetails: Evidence[] = [];
  public selectedPage = 1;
  selectedFilter: EvidenceFilter[];
  evidenceUrl: ReplaySubject<string | ArrayBuffer[]> = new ReplaySubject<string | ArrayBuffer[]>(1);
  fullScreenMode: boolean = false;
  @ViewChild('fullscreen') private readonly fullscreenElementRef: ElementRef<HTMLElement>;
  evidenceMappingFns = {
    mimeType: (evidence: Evidence): string => evidence.fileMIMEType,
    name: (evidence: Evidence): string => evidence.name,
    status: (evidence: Evidence): string => evidence.status,
  };
  readonly withCheckbox = (evidence: EvidenceDetails): boolean => {
    return this.isDeletionAllowed(evidence);
  };
  readonly toolbarIcons: readonly string[] = ['zoom', 'download', 'maximize', 'thumbnail', 'list'];
  zoomLevel: 1 | 2 | 3 = 3;
  selectedThumbnails: string[] = [];
  viewOnly: boolean;
  maxUploadFileSize = uploadByteLimit;

  private isClosed: boolean;
  private subscription: Subscription = new Subscription();
  relatedEvidenceList: Observable<RelatedEvidence[]>;

  constructor(
    private detailsService: DetailsContextualService,
    private projectsService: ProjectsService,
    private packageService: AcceptancePackageService,
    private filePreviewService: FilePreviewService,
    private dialogService: DialogService,
    private networkRolloutService: NetworkRollOutService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.fetchLineItemDetails();
    this.fetchEvidencesDetails(true);
  }

  /**
   * Gets the evidence file, converts to encoded URL and emits to `evidenceUrl`
   */
  public getLineItemEvidence(evidenceId: string): void {
    this.filePreviewService.loading.next(true);
    const next = [];
    const selectedPageIndex = this.selectedPage - 1;
    next[selectedPageIndex] = '';
    this.evidenceUrl.next(next);
    if (evidenceId) {
      const mimeType = this.filterEvidenceDetails?.map(this.evidenceMappingFns.mimeType)[selectedPageIndex];

      if (mimeType === 'video/mp4') {
        this.networkRolloutService
          .getEvidenceFileSasUrl(evidenceId)
          .pipe(
            tap(evd => {
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
            catchError((error: HttpErrorResponse): Observable<any> => {
              this.evidenceUrl.next(next);
              this.filePreviewService.filePreview.next(next[selectedPageIndex]);
              this.filePreviewService.loading.next(false);
              return of(null); // or any other stream like of('') etc.
            })
          )
          .subscribe();
      } else {
        this.networkRolloutService
          .getEvidenceFile(evidenceId)
          .pipe(
            tap(file => {
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
            catchError((error: HttpErrorResponse): Observable<any> => {
              this.evidenceUrl.next(next);
              this.filePreviewService.filePreview.next(next[selectedPageIndex]);
              this.filePreviewService.loading.next(false);
              return of(null); // or any other stream like of('') etc.
            })
          )
          .subscribe();
      }
    } else {
      this.evidenceUrl.next(next);
      this.filePreviewService.filePreview.next(next[selectedPageIndex]);
      this.filePreviewService.loading.next(false);
    }
  }

  private fetchLineItemDetails(): void {
    this.networkRolloutService.getLineItemInfo(this.projectId, this.lineItemId).subscribe({
      next: data => {
        if (this.isClosed) {
          this.detailsService.close(data);
        }
        this.lineItemDetails = data;
      },
      error: error => {
        this.notificationService.showNotification({
          title: 'Error when fetching evidences!',
          description: 'Click to open the FAQ doc for further steps.'

        }, true);
      },
    });
  }

  private fetchEvidencesDetails(initial: boolean = false): void {
    this.loadingEvidences = true;
    const evidenceDetails = of({
      morePages: true,
      limit: 100,
      nextOffset: 0,
      results: [],
    }).pipe(
      expand(data => {        
        if (data.morePages)
          return this.networkRolloutService.getLineItemEvidences(this.projectId, this.lineItemId, data.limit, data.nextOffset).pipe(
            map(newData => {
              this.loadingEvidences = false;
              return { ...newData, limit: data.limit };
            })
          );

        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => data.results),
      reduce((acc, results) => ([...acc, ...results])),
      catchError((err) => {
        console.error(err);
        this.loadingEvidences = false;
        return [];
      }),
    );
    evidenceDetails.subscribe({
      next: data => {
        if (this.isClosed) {
          this.detailsService.close(data);
        }
        this.evidenceDetails = data;
        if (this.evidenceDetails.length > 0) {
          const totalRecords = this.evidenceDetails.length;
          if (totalRecords < this.selectedPage) {
            this.selectedPage = 1;
          }
          if (initial && this.isRework) {
            this.selectedEvidenceFilterBy([EvidenceFilter.REJECTED]);
          } else {
            if (!this.selectedFilter) {
              this.selectedEvidenceFilterBy([EvidenceFilter.ALL]);
            } else {
              this.selectedEvidenceFilterBy(this.selectedFilter);
            }
          }
        }
        else {
          this.evidenceDetails = [];
          this.filterEvidenceDetails = [];
          const next = [];
          const selectedPageIndex = this.selectedPage - 1;
          this.evidenceUrl.next(next);
          this.filePreviewService.filePreview.next(next[selectedPageIndex]);
          this.filePreviewService.loading.next(false);
        }
      },
      error: error => {

        this.notificationService.showNotification({
          title: 'Error when fetching lineitems!',
          description: 'Click to open the FAQ doc for further steps.'

        }, true);
      },
    });
  }

  /**
   * Triggers the download of the current file stored in `evidenceUrl`.
   */
  downLoadFile(): void {
    this.evidenceUrl
      .pipe(
        take(1),
        tap(evidenceUrls => {
          const selectedPageIndex = this.selectedPage - 1;
          if (!evidenceUrls[selectedPageIndex]?.toString().startsWith('data:')) {
            this.projectsService
              .getEvidenceFile(this.filterEvidenceDetails[selectedPageIndex]?.internalId)
              .pipe(
                tap(file => {
                  const link = document.createElement('a');
                  const dataUrl = window.URL.createObjectURL(file);
                  link.href = dataUrl;
                  link.download = this.filterEvidenceDetails[selectedPageIndex].name;
                  link.dispatchEvent(new MouseEvent('click'));
                }),
                catchError((error: HttpErrorResponse): Observable<never> => {
                  return throwError(error);
                })
              )
              .subscribe();
          } else {
            const link = document.createElement('a');
            const evidenceUrl = evidenceUrls[selectedPageIndex];
            link.href = evidenceUrl as string;
            link.download = this.filterEvidenceDetails[selectedPageIndex].name;
            link.dispatchEvent(new MouseEvent('click'));
          }
        })
      )
      .subscribe();
  }

  onSelectedThumbnail(selectedThumbnails: string[]): void {
    this.selectedThumbnails = selectedThumbnails;
  }

  deleteFile(): void {
    let evidenceUUIDs = [];
    if (this.compactMode) {
      evidenceUUIDs.push(this.filterEvidenceDetails[this.selectedPage - 1].internalId);
    } else {
      evidenceUUIDs = this.selectedThumbnails;
    }
    const dialogPayload = {
      title: 'Delete evidences?',
      message: `Are you sure you want to delete ${evidenceUUIDs.length} items(s)?`,
    };
    const dialogMessage = this.dialogService.createDialog(DeleteConfirmationDialogComponent, dialogPayload);
    dialogMessage.instance.dialogResult
      .pipe(
        take(1),
        filter(choice => choice === true)
      )
      .subscribe(choice => {
        const deleteObservables = evidenceUUIDs.map(evidenceUUID =>
          this.networkRolloutService.deleteEvidenceByUUID(evidenceUUID).pipe(
            switchMap(() => of({ status: true, evidenceUUID })),
            catchError(() => of({ status: false, evidenceUUID }))
          )
        );

        // perform the delete operation
        forkJoin(deleteObservables).subscribe(responses => {
          // if any error show error message
          if (responses.some(response => !response.status)) {
            const failedIds = responses.filter(response => !response.status).map(response => response.evidenceUUID);
            this.dialogService.createDialog(DialogMessageComponent, {
              dialogueTitle: 'Error',
              show: APICallStatus.Error,
              statusMessage: `Something went wrong. Please try again.\nFollowing files are not deleted:\n${failedIds.join(
                '\n'
              )}`,
            });
          }

          // if any success, refresh the data
          if (responses.some(response => response.status)) {
            this.fetchEvidencesDetails();
            this.selectedThumbnails = [];
            this.selectedPage = 1;
          }
        });
      });
  }

  /**
   * pagination for image viewer click event
   */
  onPageChange(currentPage: number): void {
    this.selectedPage = currentPage;
    const selectedEvidenceId = this.filterEvidenceDetails[currentPage - 1]?.internalId
    this.getLineItemEvidence(selectedEvidenceId);
    this.relatedEvidenceList = this.getRelatedEvidenceList(selectedEvidenceId);
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
    this.compactMode = true;
    this.fullscreenElementRef.nativeElement.parentElement.parentElement.style.width = '79%';
  }

  maximizeScreen(event): void {
    this.fullScreenMode = true;
    this.fullscreenElementRef.nativeElement.parentElement.parentElement.style.width = '100%';
  }

  zoomEvents(event: ZoomEvents): void {
    // if not in full screen mode, then do allow zooming
    if (!this.fullScreenMode) {
      // zoom in
      if (event === ZoomEvents.In && this.zoomLevel <= 2) {
        this.zoomLevel += 1;
      }
      // zoom out
      if (event === ZoomEvents.Out && this.zoomLevel >= 2) {
        this.zoomLevel -= 1;
      }
    }
  }

  switchThumbnail(event): void {
    // when switching to compact mode, set the selected page to 1
    this.onPageChange(1);
    this.fullScreenMode = false;
    this.compactMode = false;
  }

  public getStatusColor(evidence: Evidence): string {
    return AcceptancePackageUtils.getStatusColor(this.getStatusCode(evidence));
  }

  public getStatus(evidence: Evidence): string {
    return AcceptancePackageUtils.getStatus(this.getStatusCode(evidence));
  }

  private getStatusCode(evidence: Evidence): string {
    if (!evidence) return 'unknown';
    return evidence.status;
  }

  selectedEvidenceFilterBy(filterEvent: EvidenceFilter[]): void {
    this.selectedFilter = filterEvent;
    this.filterEvidenceDetails = this.evidenceDetails.filter(eDetails => {
      return !!filterEvent.find(value => {
        switch (value) {
          case EvidenceFilter.NEW:
            return eDetails.status === CustomerAcceptanceStatus.CustomerNew || eDetails.status === CustomerAcceptanceStatus.CustomerRevision;
          case EvidenceFilter.PENDING:
            return eDetails.status === CustomerAcceptanceStatus.CustomerNewPendingApproval;
          case EvidenceFilter.APPROVED:
            return eDetails.status === CustomerAcceptanceStatus.CustomerApproved;
          case EvidenceFilter.REJECTED:
            return eDetails.status === CustomerAcceptanceStatus.CustomerRejected || eDetails.status === CustomerAcceptanceStatus.CustomerRejectedNoAction;
          case EvidenceFilter.REWORKED:
            return eDetails.status === CustomerAcceptanceStatus.CustomerReworked;
          case EvidenceFilter.REWORKEDPENDING:
            return eDetails.status === CustomerAcceptanceStatus.CustomerReworkedPendingApproval;
          case EvidenceFilter.VIEW_ONLY:
            return eDetails.status === CustomerAcceptanceStatus.CustomerAcceptanceNotRequired;
          case EvidenceFilter.READY:
            return eDetails.status === CustomerAcceptanceStatus.Ready;
          case EvidenceFilter.ALL:
            return true;
          default:
            return false;
        }
      });
    });
    const totalRecords = this.filterEvidenceDetails.length;
    if (totalRecords < this.selectedPage) {
      this.selectedPage = 1;
    }
    const selectedEvidenceId = this.filterEvidenceDetails[this.selectedPage - 1]?.internalId
    this.getLineItemEvidence(selectedEvidenceId);
    this.relatedEvidenceList = this.getRelatedEvidenceList(selectedEvidenceId);
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

  public getToolbarIcons(): string[] {
    let activeIcons = [...this.toolbarIcons];
    if (this.fullScreenMode && !this.compactMode) {
      activeIcons = activeIcons.filter(icon => icon !== 'maximize' && icon !== 'thumbnail');
    }
    if (this.compactMode) {
      activeIcons = activeIcons.filter(icon => icon !== 'list');
      const evidence = this.filterEvidenceDetails[this.selectedPage - 1];
      if (this.isDeletionAllowed(evidence)) {
        activeIcons.push('delete');
      }
    }
    if (!this.fullScreenMode && !this.compactMode) {
      activeIcons = activeIcons.filter(icon => icon !== 'thumbnail');
      if (this.selectedThumbnails?.length > 0) activeIcons.push('delete');
    }
    return activeIcons;
  }

  private isWithDeletableStatus(evidence: Evidence): boolean {
    const allowedStatus = [
      CustomerAcceptanceStatus.Draft,
      CustomerAcceptanceStatus.CustomerNew,
      CustomerAcceptanceStatus.Ready,
      CustomerAcceptanceStatus.CustomerReworked,
    ]
    return allowedStatus.includes(evidence?.status);
  }

  private isDeletionAllowed(evidence: Evidence): boolean {
    return this.allowAttachmentsDelete === true && evidence && this.isWithDeletableStatus(evidence) && !!evidence.isDeletionAllowed;
  }

  /**
   * open dialog to upload multiple evidences
   */
  public onUploadNewLineItemEvidence(): void {
    const dialogRef = this.dialogService.createDialog(UploadReferencedEvidenceDialogComponent, {
      projectId: this.projectId,
      lineItemId: this.lineItemId,
      name: this.lineItemDetails.lineItemId,
      parentEvidenceId: this.filterEvidenceDetails[this.selectedPage - 1].internalId,
    });
    this.subscription.add(
      dialogRef.instance.dialogResult.subscribe((result: boolean) => {
        if (!!result) {
          this.fetchEvidencesDetails();
        }
      })
    );
  }

  /**
   * open dialog to source report from NRO tool as evidence
   */
  public sourceReportAsEvidence(): void {
    const data: Data = {
      context: ToolContext.nro,
      projectId: this.projectId,
      parentId: this.lineItemId,
      parentType: 'LineItem',
      parentIds: [this.siteId],
      parentEvidenceId: this.filterEvidenceDetails[this.selectedPage - 1].internalId,
    };
    const dialogRef = this.dialogService.createDialog(SourceReportDialogComponent, data);
    this.subscription.add(
      dialogRef.instance.dialogResult.subscribe((result: boolean) => {
        if (!!result) {
          this.fetchEvidencesDetails();
        }
      })
    );
  }

  getRelatedEvidenceList(evidenceId: string): Observable<RelatedEvidence[]> {
    if (evidenceId === undefined) return of([]);
    return this.networkRolloutService.getRelatedEvidences(evidenceId).pipe(
      map((relatedEvidences: RelatedEvidences) => {
        return relatedEvidences.evidences;
      })
    )
  }
}
