import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  signal,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NodeInfoDialogComponent } from 'src/app/projects/project-structure/node-info-dialog/node-info-dialog.component';
import { ProjectLineItemDetailsComponent } from 'src/app/projects/project-structure/project-line-item-details/project-line-item-details.component';
import { ChecklistDetail, ChecklistLineItemsShort, ChecklistLineItemsShortResponse, CustomerAcceptanceStatus, ProjectDetails, SourceTool } from 'src/app/projects/projects.interface';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { DetailsContextualService } from '../../../acceptance-package-details/details-contextual.service';
import TableUtils from '../../../acceptance-package-details/table-utilities';
import { TreeNode } from '../navigation-tree/tree/tree-node.interface';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { CacheKey } from 'src/app/portal/services/session-storage.service';
import { ExtendedTableColumnKey } from 'src/app/projects/project-structure/line-item-list/extended-table-column-key';
import { StoreService } from '../../../store.service';
import { SelectOptions } from '../../acceptance-package-form-step5/acceptance-package-form-step5.component';

const lineItemNameClassName = 'line-item-name';

@Component({
  selector: 'app-line-item-data',
  templateUrl: './line-item-data.component.html',
  styleUrls: ['./line-item-data.component.less'],
  providers: [DetailsContextualService],
})
export class LineItemDataComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(TableServerSidePaginationComponent) private readonly lineItemsTable!: TableServerSidePaginationComponent;

  @Input() isEdit: boolean;
  @Input() checkList: TreeNode;
  @Input() packageForm: FormGroup;
  @Input() doLITableReset: ReplaySubject<boolean>;

  private readonly isWorkplanBased = signal<boolean>(false);
  readonly tableName = 'package-new-line-item';

  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<ChecklistLineItemsShortResponse>;
  public filterSortColumns = {
    sharedId: { columnName: 'SharedId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    name: { columnName: 'name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    description: { columnName: 'description', searchText: '', sortingIndex: 0, sortingOrder: '' },
    section: { columnName: 'Section', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: {
      columnName: 'status', searchText: '', sortingIndex: 0, sortingOrder: '', showFilter: new ReplaySubject(1),
      options: ['New', 'Ready']
    },
    raSessionId: { columnName: 'raSessionId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    evidenceDownloadStatus: { columnName: 'evidenceDownloadStatus', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'lastModifiedDate', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };
  tableHeightStyleProp = 'calc(100vh - 546px)';
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 10;
  columnsProperties = [
    {
      key: 'name',
      title: 'Line item Name',
      cellClass: lineItemNameClassName,
    },
    {
      key: 'description',
      title: 'Line item description',
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
      title: 'Last updated date & time',
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

  tableOptions: TableOptions = {
    selectable: 'multi',
    onSelectRow: (event: CustomEvent) => {
      event.detail.data.selected = true;
      this.updateChecklistItem(event.detail.data);
    },
    onUnSelectRow: (event: CustomEvent) => {
      event.detail.data.selected = false;
      this.updateChecklistItem(event.detail.data);
    },
    onCreatedRow: (tr: HTMLTableRowElement, rowData: ChecklistLineItemsShort): void => {
      const step3FormGroup = this.packageForm.controls.step3 as FormGroup;
      const lineItemIds = step3FormGroup.controls.lineItemIds as FormArray;
      rowData.selected = lineItemIds.value.indexOf(rowData.internalId) > -1;

      const checkbox = tr.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.checked = rowData.selected;

      // only allow NOT onboarded to be selected
      // row is onboarded and cannot be selected
      if (!(!rowData.isOnboarded) && !rowData.selected) {
        rowData.disabled = true;
        tr.classList.add('disabled');
      }

      const td = tr.querySelector(`.${lineItemNameClassName}`);
      if (rowData && rowData.evidenceCount > 0) {
        TableUtils.replaceLineItemIdCellContentWithDetails(lineItemNameClassName, rowData, td,
          (rowData) => this.openLevelDetails(rowData),
          (rowData) => this.openLineItemDetail(rowData), this.eventAbortController);
      } else {
        TableUtils.replaceLineItemIdCellContentWithInfoIcon(rowData, td, (rowData) => this.openLevelDetails(rowData), this.eventAbortController);
      }
    }
  };

  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();
  public projectId: string;
  checkListDetail: ChecklistDetail;
  selectedOnly = false;
  title = 'Line Items';
  private eventAbortController = new AbortController();

  constructor(
    private datePipe: NullStringDatePipe,
    private networkRollOutService: NetworkRollOutService,
    private detailsService: DetailsContextualService,
    private viewContainerRef: ViewContainerRef,
    private activeRoute: ActivatedRoute,
    private dialogService: DialogService,
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
    const step3FormGroup = this.packageForm.controls.step3 as FormGroup;
    step3FormGroup.controls.checkList;

    const step2FormGroup = this.packageForm.controls.step2 as FormGroup;
    const multiSelectOption = step2FormGroup.controls.multiSelectOption as FormControl<string>;
    this.subscription.add(multiSelectOption.valueChanges.subscribe((selectedOption) => {
      if (selectedOption === SelectOptions.WORKPLAN) this.isWorkplanBased.set(true);
      else this.isWorkplanBased.set(false);
    }));

    this.subscription.add(this.doLITableReset.subscribe(value => {
      if (value && this.lineItemsTable) { // Special case when any site from previous step has be been deselected
        this.lineItemsTable.clearTable(); //Clearing the table
        this.title = 'Line Items'; // Reset the title
      }
    }))
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.checkList) {
      this.selectedOnly = false;

      const setDefaultStatusSearchForEditMode = (filterSort: FilterSortConfiguration): void => {
        if (filterSort.status.searchText?.length === 0)
          filterSort.status.searchText = [
            CustomerAcceptanceStatus.CustomerNew,
            CustomerAcceptanceStatus.CustomerRevision,
            CustomerAcceptanceStatus.Ready,
          ].join();
      }

      if (changes.checkList.currentValue && changes.checkList.currentValue.nodeType === 'LineItems') {
        this.title = 'All line items' + ' (' + this.checkList?.id + ')';
        const isWorkplanBased = this.isWorkplanBased();
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<ChecklistLineItemsShortResponse> => {
          if (!this.isEdit) {
            filterSort.status.searchText = 'Ready';
          } else {
            setDefaultStatusSearchForEditMode(filterSort);
          }
          if (isWorkplanBased) {
            return this.networkRollOutService.searchAllLineItemsForWorkplan(this.checkList?.parentId, limit, offset, filterSort);
          }
          else {
            return this.networkRollOutService.searchAllLineItems(this.checkList?.parentId, limit, offset, filterSort);
          }
        }
      } else if (changes.checkList.currentValue) {
        this.title = this.checkList?.name;
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<ChecklistLineItemsShortResponse> => {
          if (!this.isEdit) {
            filterSort.status.searchText = 'Ready';
            return this.networkRollOutService.searchChecklistLineItems(this.projectId, this.checkList?.id, limit, offset, filterSort);
          } else {
            setDefaultStatusSearchForEditMode(filterSort);
            return this.networkRollOutService.searchChecklistLineItems(this.projectId, this.checkList?.id, limit, offset, filterSort);
          }
        }
      }

      if (!this.isEdit) {
        this.filterSortColumns.status.showFilter.next(false);
      } else {
        this.filterSortColumns.status.showFilter.next(true);
      }
    }
  }

  updateChecklistItem(data: ChecklistLineItemsShort): void {
    const step3FormGroup = this.packageForm.controls.step3 as FormGroup;
    const lineItemIds = step3FormGroup.controls.lineItemIds as FormArray;
    const selected = data.selected;
    const lineItemId = data.internalId;

    // if selected and not already in the array, add it
    if (selected && !lineItemIds.value.includes(lineItemId)) {
      lineItemIds.setValue([...lineItemIds.value, lineItemId]);
    }
    // if not selected and in the array, remove it
    const lineItemIndex = lineItemIds.value.indexOf(lineItemId);
    if (!selected && lineItemIndex > -1) {
      lineItemIds.value.splice(lineItemIndex, 1);
      lineItemIds.setValue(lineItemIds.value);
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach(script => {
      script.destroy();
    });
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.eventAbortController.abort();
  }

  public openLineItemDetail(rowData): void {
    this.detailsService.open(ProjectLineItemDetailsComponent, this.viewContainerRef, {
      projectId: this.projectId,
      lineItemId: rowData.internalId,
      allowAttachmentsDelete: false,
    });
  }

  openLevelDetails(rowData): void {
    this.dialogService.createDialog(NodeInfoDialogComponent, {
      nodeId: rowData.internalId,
      nodeType: 'lineItem',
      type: 'lineItem',
      projectId: this.projectId,
    });
  }

  toggleSelected(event): void {
    this.selectedOnly = event.target.checked;
    if (this.selectedOnly) {
      const step3FormGroup = this.packageForm.controls.step3 as FormGroup;
      const lineItemIds: string[] = step3FormGroup.controls.lineItemIds.value;
      this.lineItemsTable.filterTableData(lineItem => lineItemIds.includes((lineItem as ChecklistLineItemsShort).internalId));
    } else {
      this.lineItemsTable.resetTableData();
    }
  }
}
