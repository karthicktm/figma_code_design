import { Component, effect, input, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ChecklistLineItemsShort, ChecklistLineItemsShortResponse, ProjectDetails, SourceTool } from 'src/app/projects/projects.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import TableUtils from '../../acceptance-package-details/table-utilities';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { DetailsContextualService } from '../../acceptance-package-details/details-contextual.service';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { ProjectLineItemDetailsComponent } from 'src/app/projects/project-structure/project-line-item-details/project-line-item-details.component';
import { NodeInfoDialogComponent } from 'src/app/projects/project-structure/node-info-dialog/node-info-dialog.component';
import { ExtendedTableColumnKey } from 'src/app/projects/project-structure/line-item-list/extended-table-column-key';
import { StoreService } from '../../store.service';
import { CacheKey } from 'src/app/portal/services/session-storage.service';

const nameClassName = 'line-item-name';

@Component({
  selector: 'app-acceptance-package-form-milestone-line-items',
  standalone: true,
  imports: [
    SharedModule,
  ],
  providers: [DetailsContextualService],
  templateUrl: './acceptance-package-form-milestone-line-items.component.html',
  styleUrl: './acceptance-package-form-milestone-line-items.component.less'
})
export class AcceptancePackageFormMilestoneLineItemsComponent implements OnDestroy {
  private eventAbortController = new AbortController();

  @ViewChild(TableServerSidePaginationComponent) private readonly table!: TableServerSidePaginationComponent;

  projectId = input.required<string>();
  milestoneIds = input.required<string[]>();

  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<ChecklistLineItemsShortResponse>;
  filterSortColumns: FilterSortConfiguration = {
    sharedId: { columnName: ExtendedTableColumnKey.sharedId, searchText: '', sortingIndex: 0, sortingOrder: '' },
    name: { columnName: 'Line item name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    description: { columnName: 'Description', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: {
      columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '',
      options: ['Draft', 'Ready']
    },
    raSessionId: { columnName: 'RA session ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    downloadStatus: { columnName: 'Download status', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last updated date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };

  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 10;
  columnsProperties = [
    {
      key: 'name',
      title: this.filterSortColumns.name.columnName,
      cellClass: nameClassName,
    },
    {
      key: 'description',
      title: this.filterSortColumns.description.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataDoubleDash,
    },
    {
      key: 'siteName',
      title: this.filterSortColumns.siteName.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'siteIdByCustomer',
      title: this.filterSortColumns.siteIdByCustomer.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'siteNameByCustomer',
      title: this.filterSortColumns.siteNameByCustomer.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'workplanName',
      title: this.filterSortColumns.workplanName.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'status',
      title: this.filterSortColumns.status.columnName,
      cellStyle: 'white-space: nowrap',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData, { big: true }));
      },
    },
    {
      key: 'raSessionId',
      title: this.filterSortColumns.raSessionId.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'downloadStatus',
      title: this.filterSortColumns.downloadStatus.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'lastModifiedDate',
      title: this.filterSortColumns.lastModifiedDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    }
  ];

  extendedColumnProperties = [
    {
      key: 'sharedId',
      title: ExtendedTableColumnKey.sharedId,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
  ];

  tableHeightStyleProp = 'calc(100vh - 494px)';
  tableOptions: TableOptions = {
    onCreatedRow: (tr: HTMLTableRowElement, rowData: ChecklistLineItemsShort): void => {
      const td = tr.querySelector(`.${nameClassName}`);
      if (rowData && rowData.evidenceCount > 0) {
        TableUtils.replaceLineItemIdCellContentWithDetails(nameClassName, rowData, td,
          (rowData) => this.openLevelDetails(rowData),
          (rowData) => this.openLineItemDetail(rowData),
          this.eventAbortController);
      } else {
        TableUtils.replaceLineItemIdCellContentWithInfoIcon(rowData, td, (rowData) => this.openLevelDetails(rowData), this.eventAbortController);
      }
    }
  };

  constructor(
    private datePipe: NullStringDatePipe,
    private networkRollOutService: NetworkRollOutService,
    private detailsService: DetailsContextualService,
    private viewContainerRef: ViewContainerRef,
    private dialogService: DialogService,
    private storeService: StoreService,
  ) {
    effect(() => {
      const projectId = this.projectId();
      const milestoneIds = this.milestoneIds();
      const currentProject: ProjectDetails = this.storeService.get(CacheKey.currentProject)
      if (currentProject &&
        ('sourceTool' in currentProject) &&
        currentProject['sourceTool'] === SourceTool.siteTracker) {
        // add the properties in specified position
        this.columnsProperties.splice(0, 0, this.extendedColumnProperties[0])
      }
      if (projectId && milestoneIds && milestoneIds.length > 0) {
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<ChecklistLineItemsShortResponse> => {
          return this.networkRollOutService.getMilestoneLineItemsByMilestoneIds(projectId, milestoneIds, limit, offset, filterSort);
        }
      } else {
        this.table.clearTable();
      }
    });
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
  }

  openLineItemDetail(rowData: ChecklistLineItemsShort): void {
    this.detailsService.open(ProjectLineItemDetailsComponent, this.viewContainerRef, {
      projectId: this.projectId(),
      lineItemId: rowData.internalId,
      allowAttachmentsDelete: false,
    });
  }

  openLevelDetails(rowData: ChecklistLineItemsShort): void {
    this.dialogService.createDialog(NodeInfoDialogComponent, {
      nodeId: rowData.internalId,
      nodeType: 'lineItem',
      type: 'lineItem',
      projectId: this.projectId(),
    });
  }
}
