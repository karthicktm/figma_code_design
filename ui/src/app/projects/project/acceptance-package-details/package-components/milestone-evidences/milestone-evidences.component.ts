import { Component, ComponentRef, computed, effect, input, OnDestroy, signal, viewChild, ViewContainerRef } from '@angular/core';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import TableUtils from '../../table-utilities';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';
import { CustomerAcceptanceStatus, EvidenceRemark, EvidenceStatusUpdate, GetMilestoneEvidencesResponse, MilestoneEvidenceRow, PackageDetails, UserSession } from 'src/app/projects/projects.interface';
import { firstValueFrom, Observable, PartialObserver, Subscription, tap } from 'rxjs';
import { EvidencesCarouselComponent } from 'src/app/projects/project-structure/evidences-carousel/evidences-carousel.component';
import { Pagination } from '@eds/vanilla';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { DetailsContextualService } from '../../details-contextual.service';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { HttpErrorResponse, HttpEvent, HttpEventType, HttpStatusCode } from '@angular/common/http';
import { OverlayConfig } from '@angular/cdk/overlay';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProjectsService } from 'src/app/projects/projects.service';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { AcceptancePackageService, RoleInPackage } from '../../../acceptance-package.service';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { evidenceStatusViewModelToDataModel, myLevelStatusViewModelToDataModel } from '../../../status-mapping';

const nameClassName = 'evidence-name';

@Component({
  selector: 'app-package-milestone-evidences',
  standalone: true,
  imports: [
    SharedModule,
    EvidencesCarouselComponent,
  ],
  templateUrl: './milestone-evidences.component.html',
  styleUrl: './milestone-evidences.component.less'
})
export class MilestoneEvidencesComponent implements OnDestroy {
  private eventAbortController = new AbortController();

  private readonly table = viewChild.required(TableServerSidePaginationComponent);

  readonly packageId = input.required<string>();
  readonly packageDetails = signal<PackageDetails>(undefined);
  // TODO read replay instead of new observable
  packageDetailsObservable: Observable<PackageDetails>;
  readonly isTileMaximized = input.required<boolean>();

  readonly tableSettingsStorageKey = 'milestone-evidences-table-settings';
  readonly tableLimitStorageKey = 'package-milestone-evidences-table-limit';
  readonly tableName = 'milestone-evidences-table';
  statusMap = evidenceStatusViewModelToDataModel;
  statusFilterOptions = [...this.statusMap.keys()];
  myLevelStatusMap = myLevelStatusViewModelToDataModel;
  myLevelStatusFilterOptions = [...this.myLevelStatusMap.keys()];
  filterSortColumns: FilterSortConfiguration = {
    name: { columnName: 'Evidence name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    description: { columnName: 'Description', searchText: '', sortingIndex: 0, sortingOrder: '' },
    type: { columnName: 'Type', searchText: '', sortingIndex: 0, sortingOrder: '' },
    remarks: { columnName: 'Remarks', searchText: '', sortingIndex: 0, sortingOrder: '' },
    myLevelStatus: { columnName: 'Status at my level', searchText: '', sortingIndex: 0, sortingOrder: '', options: this.myLevelStatusFilterOptions },
    status: { columnName: 'Overall status', searchText: '', sortingIndex: 0, sortingOrder: '', options: this.statusFilterOptions },
    lastModifiedDate: { columnName: 'Last updated date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanCategory: { columnName: 'Workplan category', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 50;
  columnsProperties = [
    {
      key: 'name',
      title: this.filterSortColumns.name.columnName,
      cellClass: nameClassName,
    },
    {
      key: 'description',
      title: this.filterSortColumns.description.columnName,
      cellClass: 'detail-overflow',
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataDoubleDash,
    },
    {
      key: 'type',
      title: this.filterSortColumns.type.columnName,
    },
    {
      key: 'remarks',
      title: this.filterSortColumns.remarks.columnName,
    },
    {
      key: 'myLevelStatus',
      title: this.filterSortColumns.myLevelStatus.columnName,
      cellClass: 'column-status',
      onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
        td.replaceChildren(AcceptancePackageUtils.getMultiActionStatusTag(cellData, { big: true }));
      }
    },
    {
      key: 'status',
      title: this.filterSortColumns.status.columnName,
      cellClass: 'column-status',
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData, { big: true }));
      },
    },
    {
      key: 'lastModifiedDate',
      title: this.filterSortColumns.lastModifiedDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    },
    // US 241441 BE implementation is on-hold
    // Uncomment once new fields are available in BE
    // {
    //   key: 'siteName',
    //   title: this.filterSortColumns.siteName.columnName,
    // },
    // {
    //   key: 'siteIdByCustomer',
    //   title: this.filterSortColumns.siteIdByCustomer.columnName,
    // },
    // {
    //   key: 'workplanName',
    //   title: this.filterSortColumns.workplanName.columnName,
    // },
    // {
    //   key: 'customerScopeId',
    //   title: this.filterSortColumns.customerScopeId.columnName,
    // },
    // {
    //   key: 'workplanCategory',
    //   title: this.filterSortColumns.workplanCategory.columnName,
    // },
  ];
  tableHeightStyleProp = 'calc(100vh - 407px - 56px)';
  readonly isPackageCompleted = input.required();
  get selectable(): '' | 'multi' {
    const roleName = this.sessionStorage.get<UserSession>(CacheKey.userSession).roleType;
    return !this.isPackageCompleted() && roleName.find(r => r === RoleInPackage.CustomerApprover) ? 'multi' : '';
  }
  tableOptions: TableOptions = {
    actions: true,
    onCreatedRow: (tr: HTMLTableRowElement, rowData: MilestoneEvidenceRow): void => {
      if (rowData.status === CustomerAcceptanceStatus.CustomerAcceptanceNotRequired || rowData.status === CustomerAcceptanceStatus.CustomerRejectedNoAction) {
        const td = tr.querySelector('.cell-select');
        if (td) {
          const checkboxInput = td.querySelector('input[type="checkbox"]') as HTMLInputElement;
          const checkboxLabel = td.querySelector('label');
          // Disable the checkbox to avoid selection when 'Select all' is clicked
          checkboxInput.disabled = true;
          // Hide the checkbox itself
          checkboxLabel.style.display = 'none';
        }
      }
      this.replaceNameCellContentWithDetailsLink(nameClassName, rowData, tr);
    },
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: MilestoneEvidenceRow): void => {
      this.generateMilestoneEvidenceDownloadButton(rowData, td);
    },

    selectable: '',
    onSelectRow: (event: CustomEvent) => {
    },
    onUnSelectRow: (event: CustomEvent) => {
    },
  }
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetMilestoneEvidencesResponse>;
  componentRef: ComponentRef<EvidencesCarouselComponent>;

  readonly isApprover = signal<boolean>(undefined);
  readonly isColumnsPropertiesReady = signal<boolean>(false);
  readonly isPendingVerdict = computed<boolean>(() => {
    const status = this.packageDetails()?.status;
    return status === CustomerAcceptanceStatus.CustomerNewPendingApproval
      || status === CustomerAcceptanceStatus.CustomerReworkedPendingApproval;
  });
  readonly isVerdictSubmissionAllowed = computed<boolean>(() => {
    return this.isApprover() && this.isPendingVerdict();
  });
  readonly isVerdictSubmissionDisabled = signal<boolean>(true);

  private readonly subscription = new Subscription();

  private get pagination(): Pagination {
    return this.table()?.['pagination'];
  };

  TableUtils = TableUtils;

  constructor(
    private datePipe: NullStringDatePipe,
    private viewContainerRef: ViewContainerRef,
    private detailsService: DetailsContextualService,
    private networkRollOutService: NetworkRollOutService,
    private projectService: ProjectsService,
    private notificationService: NotificationService,
    private sessionStorage: SessionStorageService,
    private packageService: AcceptancePackageService,
    private dialogService: DialogService,
  ) {
    effect(() => {
      this.packageDetailsObservable = this.projectService.getAcceptancePackage(this.packageId()).pipe(tap(packageDetails => this.packageDetails.set(packageDetails)));
      if (this.isPackageCompleted() !== undefined) {
        this.tableOptions.selectable = this.selectable;
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<GetMilestoneEvidencesResponse> => {
          const filterCopy = JSON.parse(JSON.stringify(filterSort));
          const searchedStatus = filterCopy.status;
          if (searchedStatus.searchText !== '') {
            const filteredStatus = this.statusFilterOptions.filter(statusOption =>
              statusOption.toUpperCase().includes(searchedStatus.searchText.toUpperCase())
            );
            if (filteredStatus.length > 0) searchedStatus.searchText = filteredStatus.map(status => this.statusMap.get(status)).join();
          }
          const searchedMyLevelStatus = filterCopy.myLevelStatus;
          if (searchedMyLevelStatus.searchText !== '') {
            const filteredStatus = this.myLevelStatusFilterOptions.filter(statusOption =>
              statusOption.toUpperCase().includes(searchedMyLevelStatus.searchText.toUpperCase())
            );
            if (filteredStatus.length > 0) searchedMyLevelStatus.searchText = filteredStatus.map(status => this.myLevelStatusMap.get(status)).join();
          }
          return this.projectService.getPackageMilestoneEvidences(this.packageId(), limit, offset, filterCopy);
        }
      }
    });

    effect(() => {
      this.updateTableSetting(this.isTileMaximized());
    });

    this.subscription.add(this.packageService.currentPackageUser.subscribe(pkgUsr => {
      if (pkgUsr.userRole) {
        this.isApprover.set(pkgUsr.userRole === RoleInPackage.CustomerApprover);
      }
    }));

    effect(() => {
      const packageDetails = this.packageDetails();
      const isApprover = this.isApprover();
      if (isApprover !== undefined && packageDetails !== undefined) {
        if (!isApprover || !packageDetails.isMultiLevelAcceptance) {
          const idx = this.columnsProperties.findIndex(col => col.key === 'myLevelStatus');

          if (idx !== -1) {
            this.columnsProperties.splice(idx, 1); // Hide myLevelStatus if not approver
          }
        }
        this.isColumnsPropertiesReady.set(true);
      }
    },
      {
        allowSignalWrites: true
      }
    );

    effect(() => {
      const packageDetails = this.packageDetails();
      const isApprover = this.isApprover();
      const table = this.table();
      if (isApprover !== undefined && packageDetails !== undefined && table !== undefined) {
        const packageStatus = packageDetails.status;
        if (isApprover) {
          if (packageStatus === CustomerAcceptanceStatus.CustomerReworked) {
            this.table()?.setFilterForColumn('status', 'Reworked');
          }
          if (packageStatus === CustomerAcceptanceStatus.CustomerReworkedPendingApproval) {
            if (packageDetails.isMultiLevelAcceptance) {
              this.table()?.setFilterForColumn('status', 'Pending');
            } else {
              this.table()?.setFilterForColumn('status', 'Reworked-Pending approval');
            }
          }
        }
      }
    },
      {
        allowSignalWrites: true
      }
    );

    effect(() => {
      if (this.isVerdictSubmissionAllowed()) {
        firstValueFrom(this.packageService.currentPackageUserActionInProgress).then((isInProgress) => {
          this.isVerdictSubmissionDisabled.set(!isInProgress);
        });
      }
    });

    this.subscription.add(this.detailsService.getClosedEmitter().subscribe(() => {
      this.table()?.fetchData();
    }));
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
  }

  private generateMilestoneEvidenceDownloadButton(rowData: MilestoneEvidenceRow, td: HTMLTableCellElement): void {
    const downloadButton = document.createElement('button');
    downloadButton.setAttribute('title', 'Download evidence');
    downloadButton.classList.add('btn-icon', 'download-evidence');
    const iconDownload = document.createElement('i');
    iconDownload.classList.add('icon', 'icon-download-save');
    downloadButton.appendChild(iconDownload);
    downloadButton.addEventListener('click', () => {
      this.downloadEvidence(rowData.internalId, downloadButton);
    }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
    td.appendChild(downloadButton);
  }

  private downloadEvidence(id: string, targetElement: HTMLButtonElement): void {
    const downloadObserver: PartialObserver<HttpEvent<Blob>> = {
      next: (result => {
        if (result.type === HttpEventType.Sent) {
          targetElement.disabled = true;
        }
        if (result.type === HttpEventType.Response) {
          targetElement.disabled = false;
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
          this.notificationService.showLogNotification({
            title: `Evidence "${filename}" successfully downloaded!`,
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElement.disabled = false;
        const statusMessage = 'Error when downloading the evidence file!';
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
    this.networkRollOutService.downloadEvidenceFile(id).subscribe(downloadObserver);
  }

  private replaceNameCellContentWithDetailsLink(nameClassName: string, rowData: MilestoneEvidenceRow, tr: HTMLTableRowElement): void {
    const td = tr.querySelector(`.${nameClassName}`);
    if (td) {
      const link = document.createElement('a');
      link.appendChild(document.createTextNode(rowData.name || 'Unknown'));
      link.addEventListener('click', (event) => {
        this.openEvidenceDetails(rowData);
      }, { signal: this.eventAbortController.signal });
      td.replaceChildren(link);
    }
  }

  openEvidenceDetails(evidence: MilestoneEvidenceRow): void {
    const componentRef = this.detailsService.open(
      EvidencesCarouselComponent,
      this.viewContainerRef,
      undefined,
      new OverlayConfig({
        width: '100%',
      }),
    ) as ComponentRef<EvidencesCarouselComponent>;
    componentRef.setInput('selectedEvidence', evidence);
    const table = this.table();
    componentRef.setInput('totalRecords', table.totalRecords);
    componentRef.setInput('packageDetails', this.packageDetails());
    this.setEvidencesPageInputs(componentRef);
    componentRef.instance.page.subscribe(change => this.onPageChangeRequest(change));
    this.componentRef = componentRef;
  }

  private setEvidencesPageInputs(componentRef: ComponentRef<EvidencesCarouselComponent>): void {
    const table = this.table();
    componentRef.setInput('evidences', table.tableElements);
    componentRef.setInput('offset', table.offset);
    componentRef.setInput('limit', table.limit);
  }

  onPageChangeRequest(change: 'next' | 'prev'): void {
    const clickEvent = new CustomEvent('click');
    if (change === 'next') {
      const rightArrow = this.pagination?.['dom'].paginationGroup.querySelector('[data-value=right]');
      if (rightArrow.classList.contains('disabled')) {
        const first = this.pagination?.['dom'].paginationGroup.querySelector('[data-value=left]')?.nextElementSibling;
        first?.dispatchEvent(clickEvent);
      }
      else {
        rightArrow.dispatchEvent(clickEvent);
      }
    }
    else {
      const leftArrow = this.pagination?.['dom'].paginationGroup.querySelector('[data-value=left]');
      if (leftArrow.classList.contains('disabled')) {
        const last = this.pagination?.['dom'].paginationGroup.querySelector('[data-value=right]')?.previousElementSibling;
        last?.dispatchEvent(clickEvent);
      }
      else {
        leftArrow?.dispatchEvent(clickEvent);
      }
    }
  }

  updatePageInputs(isPageLoaded: boolean): void {
    if (this.componentRef && isPageLoaded) this.setEvidencesPageInputs(this.componentRef);
  }

  private updateTableSetting(isMaximized: boolean): void {
    const table = this.table();
    if (isMaximized) {
      table?.['tableElementRef'].nativeElement.classList.add('compact');
      table['tableElementRef'].nativeElement.parentElement.style.height = 'calc(100vh - 284px - 32px)';
    } else {
      table?.['tableElementRef'].nativeElement.classList.remove('compact');
      table['tableElementRef'].nativeElement.parentElement.style.height = this.tableHeightStyleProp;
    }
  }

  submitEvidencesDecision(details: {decision: 'Reject' | 'Approve', evidences: MilestoneEvidenceRow[]}): void {
    const { decision, evidences } = details;
    let statusValue: CustomerAcceptanceStatus;
    let remarkValue = '';

    if (decision === 'Reject') {
      statusValue = CustomerAcceptanceStatus.CustomerRejected;
      remarkValue = EvidenceRemark.MINOR;
    } else {
      statusValue = CustomerAcceptanceStatus.CustomerApproved;
      remarkValue = EvidenceRemark.OK;
    }
    const requestBody = {
      status: statusValue,
      evidences: evidences.map(evidence => ({
        id: evidence.internalId,
        remarks: remarkValue
      })),
    };
    this.updateEvidenceStatus(requestBody, decision);
  }

  private updateEvidenceStatus(requestBody: EvidenceStatusUpdate, buttonType: string): void {
    const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    this.isVerdictSubmissionDisabled.set(true);
    this.projectService.updateEvidencesStatus(this.packageDetails().packageId, requestBody).subscribe({
      next: () => {
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
        this.table().fetchData();
        this.isVerdictSubmissionDisabled.set(false);
      },
      error: (err) => {
        this.isVerdictSubmissionDisabled.set(false);
        dialogMessage.instance.show = APICallStatus.Error;
        let additionalMessage = '';
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
        } else {
          additionalMessage = '\n Please follow the FAQ doc for further steps.';
        }
        dialogMessage.instance.statusMessage = 'Error when updating the evidence!' + additionalMessage;
        dialogMessage.instance.dialogueTitle = 'Failed to submit';
        dialogMessage.instance.additionalMessage = '';
        dialogMessage.instance.actionOn.next('FAQ');
        console.error(err);
      },
    });
  }
}
