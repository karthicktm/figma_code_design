import { Component, EventEmitter, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, PartialObserver, Subscription } from 'rxjs';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { Data, SourceReportDialogComponent } from '../../project/acceptance-package-details/attached-documents/source-report-dialog/source-report-dialog.component';
import { DetailsContextualService } from '../../project/acceptance-package-details/details-contextual.service';
import TableUtils from '../../project/acceptance-package-details/table-utilities';
import { ChecklistDetail, ChecklistLineItemsShort, ChecklistLineItemsShortResponse, CustomerAcceptanceStatus, ProjectDetails, SourceTool, ToolContext } from '../../projects.interface';
import { UploadReferencedEvidenceDialogComponent } from '../../upload-referenced-evidence-dialog/upload-referenced-evidence-dialog.component';
import { ProjectLineItemDetailsComponent } from '../project-line-item-details/project-line-item-details.component';
import AcceptancePackageUtils from '../../project/acceptance-package-utilities';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { NodeInfoDialogComponent } from '../node-info-dialog/node-info-dialog.component';
import { ExtendedTableColumnKey } from './extended-table-column-key';
import { CacheKey } from 'src/app/portal/services/session-storage.service';
import { StoreService } from '../../project/store.service';
import { projectStructureLineItemStatusViewModelToDataModel } from '../../project/status-mapping';

const lineItemNameClassName = 'line-item-name';
const lineItemPkgNameClassName = 'line-item-pkg-name';

@Component({
  selector: 'app-line-item-list',
  templateUrl: './line-item-list.component.html',
  styleUrls: ['./line-item-list.component.less'],
  providers: [DetailsContextualService]
})
export class LineItemListComponent implements OnInit, OnDestroy {
  @Input() readonly pageTitle: string = 'Line items'
  private eventAbortController = new AbortController();

  CustomerAcceptanceStatus = CustomerAcceptanceStatus;
  public siteId: string;
  public projectId: string;
  public checklistId: string;
  checklistDetail: ChecklistDetail;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 25;
  columnsProperties = [
    {
      key: 'name',
      title: 'Line item name',
      cellClass: lineItemNameClassName,
    },
    {
      key: 'description',
      title: 'Line item description',
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataDoubleDash,
    },
    {
      key: 'packageName',
      title: 'Package name',
      cellClass: lineItemPkgNameClassName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'status',
      title: 'Status',
      cellStyle: 'white-space: nowrap',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData, { big: true }));
      },
    },
    {
      key: 'rasessionId',
      title: 'RA session ID',
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'evidenceDownloadStatus',
      title: 'Download status',
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'lastModifiedDate',
      title: 'Last updated',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    }
  ];

  extendedColumnProperties = [{
    key: 'sharedId',
    title: ExtendedTableColumnKey.sharedId,
    onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
  }, {
    key: 'section',
    title: ExtendedTableColumnKey.section,
    onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
  }]


  @ViewChild(TableServerSidePaginationComponent) private readonly lineItemsTable!: TableServerSidePaginationComponent;
  tableHeightStyleProp = 'calc(100vh - 290px - 32px)';
  tableOptions: TableOptions = {
    actions: true,
    selectable: 'multi',
    onCreatedRow: (tr: HTMLTableRowElement, rowData: ChecklistLineItemsShort): void => {
      const td = tr.querySelector(`.${lineItemNameClassName}`);
      if (rowData && (rowData as ChecklistLineItemsShort)?.evidenceCount > 0) {
        TableUtils.replaceLineItemIdCellContentWithDetails(lineItemNameClassName, rowData, td,
          (rowData) => this.openLevelDetails(rowData),
          (rowData) => this.openLineItemDetails(rowData),
          this.eventAbortController);
      } else {
        TableUtils.replaceLineItemIdCellContentWithInfoIcon(rowData, td,
          (rowData) => this.openLevelDetails(rowData),
          this.eventAbortController);
      }
      if (rowData.packageId && rowData.packageId !== 'NA') {
        const tdPkgId = tr.querySelector(`.${lineItemPkgNameClassName}`);
        TableUtils.replacePackageNameCellWithLink(lineItemPkgNameClassName, rowData, tdPkgId, this.projectId, this.eventAbortController);
      }
      if (!!rowData.raSessionId || (rowData.status !== CustomerAcceptanceStatus.Ready && rowData.status !== CustomerAcceptanceStatus.Draft)) {
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
    },
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: ChecklistLineItemsShort): void => {
      let htmlText = '';
      if (!rowData.raSessionId && (rowData.status === CustomerAcceptanceStatus.Draft || rowData.status === CustomerAcceptanceStatus.CustomerRejected)) {
        htmlText = htmlText + `<button class="btn-icon action-upload"><i class="icon icon-upload" title="Upload new evidence"></i></button>
        <button class="btn-icon action-source-report"><i class="icon icon-hierarchy-chart" title="Source report"></i></button>`;
      }
      if (rowData.status === CustomerAcceptanceStatus.CustomerRejected) {
        if (rowData.packageStatus === CustomerAcceptanceStatus.CustomerRejected) {
          htmlText = htmlText + `<button class="btn-icon action-rework"><i class="icon icon-reload" title="Rework"></i></button>`;
        } else {
          htmlText = htmlText + `<button class="btn-icon action-rework" disabled><i class="icon icon-reload" title="Rework not allowed.\nCorresponding package is not yet rejected."></i></button>`;
        }
      }

      td.innerHTML = htmlText;

      td.querySelector('.action-upload')?.addEventListener('click', () => {
        const subscription = this.onUploadNewLineItemEvidence(rowData).subscribe(newFiles => {
          if (newFiles.length > 0) {
            this.lineItemsTable.fetchData();
            subscription.unsubscribe();
          }
        });
      }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
      td.querySelector('.action-source-report')?.addEventListener('click', () => {
        const subscription = this.sourceReportAsEvidence(rowData).subscribe(isAdded => {
          this.lineItemsTable.fetchData();
          subscription.unsubscribe();
        });
      }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
      td.querySelector('.action-rework')?.addEventListener('click', () => {
        this.openLineItemDetails(rowData, true);
      }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);

      if (rowData && (rowData as ChecklistLineItemsShort)?.evidenceCount > 0) {
        this.generateLineItemEvidencesDownloadButton(rowData, td);
      }
    },
  }
  totalRecords: number;
  private subscription: Subscription = new Subscription();
  public showLoader: boolean;
  private scripts: Scripts[] = [];
  statusMap = projectStructureLineItemStatusViewModelToDataModel;
  statusFilterOptions = [...this.statusMap.keys()];
  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<ChecklistLineItemsShortResponse>;
  public filterSortColumns = {
    sharedId: { columnName: 'SharedId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    name: { columnName: 'name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    description: { columnName: 'description', searchText: '', sortingIndex: 0, sortingOrder: '' },
    section: { columnName: 'Section', searchText: '', sortingIndex: 0, sortingOrder: '' },
    packageName: { columnName: 'packageName', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: {
      columnName: 'status', searchText: '', sortingIndex: 0, sortingOrder: '', options: this.statusFilterOptions
    },
    raSessionId: { columnName: 'raSessionId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    evidenceDownloadStatus: { columnName: 'evidenceDownloadStatus', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'lastModifiedDate', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };

  public confirmedFilters = this.filterSortColumns;
  constructor(
    private activeRoute: ActivatedRoute,
    private datePipe: NullStringDatePipe,
    private networkRollOutService: NetworkRollOutService,
    private detailsService: DetailsContextualService,
    private viewContainerRef: ViewContainerRef,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private storeService: StoreService,
  ) {
    const currentProject: ProjectDetails = this.storeService.get(CacheKey.currentProject)
    if (currentProject &&
      ('sourceTool' in currentProject) &&
      currentProject['sourceTool'] === SourceTool.siteTracker) {
      // add the properties in specified position
      this.columnsProperties.splice(0, 0, this.extendedColumnProperties[0])
      this.columnsProperties.splice(3, 0, this.extendedColumnProperties[1])
    }
  }

  ngOnInit(): void {
    this.projectId = this.activeRoute.snapshot.parent.parent.paramMap.get('id');
    if (this.activeRoute.routeConfig.path === 'all-line-items') {
      this.siteId = this.activeRoute.snapshot.parent.paramMap.get('networkSiteId');
    }
    else {
      this.siteId = this.activeRoute.snapshot.parent.parent.paramMap.get('networkSiteId');
    }
    this.subscription.add(this.activeRoute.paramMap.subscribe((params: ParamMap) => {

      this.checklistId = params.get('id');

      const handleFilterSort = (filterSort: FilterSortConfiguration): FilterSortConfiguration => {
        const filterCopy = JSON.parse(JSON.stringify(filterSort));
        const searchedStatus = filterCopy.status;
        if (searchedStatus.searchText !== '') {
          const filteredStatus = this.statusFilterOptions.filter(statusOption =>
            statusOption.toUpperCase() === searchedStatus.searchText.toUpperCase()
          );
          if (filteredStatus.length > 0) searchedStatus.searchText = filteredStatus.map(status => this.statusMap.get(status)).join();
        }
        return filterCopy;
      }
      if (this.checklistId) {
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<ChecklistLineItemsShortResponse> => {
          return this.networkRollOutService.searchChecklistLineItems(this.projectId, this.checklistId, limit, offset, handleFilterSort(filterSort));
        }
      } else if (this.siteId) {
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<ChecklistLineItemsShortResponse> => {
          const contextFilter = this.activeRoute.snapshot.queryParamMap.keys.filter(paramKey => ['workplanId', 'milestoneId'].includes(paramKey))
            .map(paramKey => {
              const contextFilter = {};
              contextFilter[paramKey] = { searchText: this.activeRoute.snapshot.queryParamMap.get(paramKey) };
              return contextFilter;
            })
            .find(() => true);;
          return this.networkRollOutService.searchAllLineItems(this.siteId, limit, offset, handleFilterSort({ ...contextFilter, ...filterSort }));
        }
      }
      //Ensure data is reloaded when other checklist are clicked in navigation panel
      this.lineItemsTable.fetchData();
    }));
  }

  private generateLineItemEvidencesDownloadButton(rowData: ChecklistLineItemsShort, td: HTMLTableCellElement): void {
    const downloadButton = document.createElement('button');
    downloadButton.setAttribute('title', 'Download all evidences');
    downloadButton.classList.add('btn-icon', 'download-all-evidences');
    const iconDownload = document.createElement('i');
    iconDownload.classList.add('icon', 'icon-download-save');
    downloadButton.appendChild(iconDownload);
    downloadButton.addEventListener('click', () => {
      this.downloadLineItemEvidences(this.projectId, rowData.internalId, downloadButton);
    }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
    td.appendChild(downloadButton);
  }

  /**
   * Download line item evidences.
   * @param projectId of the project
   * @param id internal id of the line item
   * @param targetElement
   */
  private downloadLineItemEvidences(projectId: string, id: string, targetElement: HTMLButtonElement): void {
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
            title: 'Evidences successfully downloaded!',
            description: `Downloading of the line item evidences completed successfully.`
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElement.disabled = false;
        const statusMessage = 'Error when downloading the report!';
        // push notification for the error message
        this.notificationService.showLogNotification({
          title: statusMessage,
          description: 'Please try again.'
        });
      },
    };
    this.networkRollOutService.downloadLineItemEvidences(projectId, id).subscribe(downloadObserver);
  }


  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.eventAbortController.abort();
  }

  public openLineItemDetails(rowData: ChecklistLineItemsShort, isRework: boolean = false): void {
    this.detailsService.open(
      ProjectLineItemDetailsComponent,
      this.viewContainerRef,
      {
        projectId: this.projectId,
        lineItemId: rowData.internalId,
        isRework,
        siteId: this.siteId,
      }
    );
  }

  /**
   * open dialog to upload multiple evidences
   */
  public onUploadNewLineItemEvidence(rowData: ChecklistLineItemsShort): EventEmitter<string[]> {
    const dialog = this.dialogService.createDialog(
      UploadReferencedEvidenceDialogComponent,
      {
        projectId: this.projectId,
        id: rowData.internalId,
        name: rowData.lineItemId,
        lineItemId: rowData.internalId,
      },
    );
    return dialog.instance.dialogResult;
  }

  /**
   * open dialog to source report from NRO tool as evidence
   */
  public sourceReportAsEvidence(rowData: ChecklistLineItemsShort): EventEmitter<boolean> {
    const data: Data = {
      projectId: this.projectId,
      parentId: rowData.internalId,
      parentType: 'LineItem',
      parentIds: [this.siteId],
      context: ToolContext.nro,
    };
    const dialog = this.dialogService.createDialog(SourceReportDialogComponent, data);
    return dialog.instance.dialogResult;
  }

  openLevelDetails(rowData): void {
    this.dialogService.createDialog(NodeInfoDialogComponent, {
      nodeId: rowData.internalId,
      nodeType: 'lineItem',
      type: 'lineItem',
      projectId: this.projectId,
    });
  }

  isStatusButtonDisabled(currentStatus: CustomerAcceptanceStatus): boolean {
    const selectedRows = this.lineItemsTable?.table.selected as ChecklistLineItemsShort[];
    if (!selectedRows || selectedRows.length === 0) return true;
    return !selectedRows.every(lineItem => lineItem.status === currentStatus);
  }

  onConvertStatus(event: MouseEvent, toStatus: CustomerAcceptanceStatus): void {
    const selectedRows = this.lineItemsTable?.table.selected as ChecklistLineItemsShort[];
    if (!!selectedRows && selectedRows.length > 0) {
      const targetElement = event.target as HTMLButtonElement;
      targetElement.disabled = true;
      targetElement.classList.add('loading');
      const lineItemIds = selectedRows.map(lineItem => lineItem.internalId);
      const requestBody = {
        lineItemIds,
        status: toStatus,
      };

      this.subscription.add(
        this.networkRollOutService.updateProjectLineItemStatus(requestBody).subscribe({
          next: (() => {
            targetElement.disabled = false;
            targetElement.classList.remove('loading');
            this.lineItemsTable.fetchData();
          }),
          error: (error) => {
            targetElement.disabled = false;
            targetElement.classList.remove('loading');
            let errorMessage = '';
            if (error.error instanceof ErrorEvent) {
              // client-side error
              errorMessage = `Error: ${error.error.message}`;
            } else {
              // server-side error
              errorMessage = `Error status: ${error.status}\nMessage: ${error.message}`;
            }
            this.notificationService.showNotification({
              title: `Error when updating line item status!`,
              description: `${errorMessage
                || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'}`,
            }, true);
          },
        })
      );
    }
  }
}
