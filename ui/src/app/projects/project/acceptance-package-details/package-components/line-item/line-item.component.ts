import {
  AfterViewInit,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
  input,
  signal
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { Pagination, Table } from '@eds/vanilla';
import { ApprovalRuleOption, CustomerAcceptanceStatus, EvidenceDetails, LineItemInfo, LineItemResponse, LineItemStatusUpdateWithScope, PackageLineItem } from 'src/app/projects/projects.interface';
import { ProjectsService } from '../../../../projects.service';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, exhaustMap, filter, map, tap } from 'rxjs/operators';
import { of, Subject, Subscription } from 'rxjs';
import { DetailsContextualService } from '../../details-contextual.service';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { LineItemDetailsComponent } from '../line-item-details/line-item-details.component';
import { Data as LineItemInfoData, LineItemInfoDialogComponent } from 'src/app/projects/details-dialog/line-item-info-dialog/line-item-info-dialog.component';
import TableUtils from '../../table-utilities';
import { ColumnsProps } from '@eds/vanilla/table/Table';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { AcceptancePackageService, RoleInPackage } from '../../../acceptance-package.service';
import { HttpStatusCode } from '@angular/common/http';
import { evidenceCountOptions, evidenceStatusViewModelToDataModel, myLevelStatusViewModelToDataModel } from '../../../status-mapping';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';
import { SimplifiedTreeNode } from '../taxonomy-tree/taxonomy-tree.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { LineItemDecisionConfirmationDialogComponent } from '../line-item-decision-confirmation-dialog/line-item-decision-confirmation-dialog.component';
import { addSearchDropDownOptions, checkValueLength, resetOffsetValue } from 'src/app/shared/table-utilities';
import { ExtendedTableColumnKey } from 'src/app/projects/project-structure/line-item-list/extended-table-column-key';
import { ComponentService } from 'src/app/shared/component.service';

@Component({
  selector: 'app-line-item',
  templateUrl: './line-item.component.html',
  styleUrls: ['./line-item.component.less'],
})
export class LineItemComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('lineItemTable') private readonly lineItemTableElementRef: ElementRef<HTMLElement>;
  lineItemData: Observable<LineItemResponse>;
  @Input() taxonomyFilterData: SimplifiedTreeNode[];
  @Input() applyFilter: boolean;
  @Input() packageStatus: CustomerAcceptanceStatus;
  @Input() isPackageCompleted: boolean;
  @Input() isTileMaximized: boolean;
  @Input() approvalRule: string;
  @Output() isTableLoaded = new EventEmitter<boolean>();
  @Output() isUpdatePackageStatus = new EventEmitter<boolean>();
  readonly isMultiLevelAcceptance = input<boolean>();
  limit: number = 50;
  offset: number = 0;
  packageId: string;
  pagination: Pagination;
  totalRecords: number;
  selectable = '';
  columnsProperties: any[];
  loadingLineItems: boolean;
  disabledSubmission: boolean = true;
  reloadLineItemsTable: Subject<boolean> = new Subject();

  private scripts: Scripts[] = [];
  public filterSortColumns = {
    sharedId: { columnName: 'SharedId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    name: { columnName: 'Name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: { columnName: 'Overall status', searchText: '', sortingIndex: 0, sortingOrder: '' },
    myLevelStatus: { columnName: 'Status at my level', searchText: '', sortingIndex: 0, sortingOrder: '' },
    section: { columnName: 'Section', searchText: '', sortingIndex: 0, sortingOrder: '' },
    approvedEvidenceCount: { columnName: 'Approved evidence(s)', searchText: '', sortingIndex: 0, sortingOrder: '' },
    rejectedEvidenceCount: { columnName: 'Rejected evidence(s)', searchText: '', sortingIndex: 0, sortingOrder: '' },
    pendingEvidenceCount: { columnName: 'Pending evidence(s)', searchText: '', sortingIndex: 0, sortingOrder: '' },
    viewOnlyEvidenceCount: { columnName: 'View only evidence(s)', searchText: '', sortingIndex: 0, sortingOrder: '' },
    description: { columnName: 'Description', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanCategory: { columnName: 'Workplan category', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };
  table: Table;
  tableElements: PackageLineItem[];
  public isFilter = false;
  public confirmedFilters = this.filterSortColumns;
  private subscription: Subscription = new Subscription();
  private readonly tableSettingsStorageKey = 'line-items-table-settings';
  readonly isApprover = signal<boolean>(false);
  readonly isCustomerUser = signal<boolean>(false);

  statusMap = evidenceStatusViewModelToDataModel;
  statusFilterOptions = [...this.statusMap.keys()];
  myLevelStatusMap = myLevelStatusViewModelToDataModel;
  myLevelStatusFilterOptions = [...this.myLevelStatusMap.keys()];
  private evidenceStatusCountUpdate: EventEmitter<{
    rowIndex: number;
    approvedEvidence: number;
    pendingEvidence: number;
    rejectedEvidence: number;
    viewOnlyEvidence: number;
  }> = new EventEmitter();
  tableUtils = TableUtils;

  constructor(
    private projectService: ProjectsService,
    private componentService: ComponentService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private packageService: AcceptancePackageService,
    private detailsService: DetailsContextualService,
    private viewContainerRef: ViewContainerRef,
    private datePipe: NullStringDatePipe
  ) {
  }

  ngOnInit(): void {
    this.packageId = this.route.snapshot.paramMap.get('id');
    this.subscription.add(this.packageService.currentPackageUser.subscribe(pkgUsr => {
      if (pkgUsr.userRole) {
        this.isApprover.set(pkgUsr.userRole === RoleInPackage.CustomerApprover);
        this.isCustomerUser.set(pkgUsr.userRole === RoleInPackage.CustomerApprover || pkgUsr.userRole === RoleInPackage.CustomerObserver)
      }

      if (this.isApprover()) {
        if (this.packageStatus === CustomerAcceptanceStatus.CustomerReworked) {
          this.filterSortColumns.status.searchText = 'Reworked';
        }
        if (this.packageStatus === CustomerAcceptanceStatus.CustomerReworkedPendingApproval) {
          if (this.isMultiLevelAcceptance()) {
            this.filterSortColumns.status.searchText = 'Pending';
          } else {
            this.filterSortColumns.status.searchText = 'Reworked-Pending approval';
          }
        }
      }
      this.getLineItemsByPackageId();
    }));


    this.subscription.add(
      this.detailsService.getClosedEmitter().subscribe((item: LineItemInfo) => {
        this.updateLineItemStatusInView({ status: item.status, lineItemIds: [item.internalId] });
      })
    );
    this.subscription.add(
      this.packageService.updatePackageStatus.subscribe((event) => {
        // Handle the emitted event from the LineItemDetailsComponent
        this.isUpdatePackageStatus.emit(true);
      })
    );
    this.subscription.add(this.reloadLineItemsTable.subscribe(value => {
      if (value) {
        this.filterLineItem();
      }
    }));
  }

  ngAfterViewInit(): void {
    this.selectable = !this.isPackageCompleted && this.isApprover() ? 'multi' : '';
    this.lineItemData.subscribe((data: LineItemResponse) => {
      this.toggleLoadingLineItems(false);
      this.columnsProperties = [
        {
          key: 'name',
          title: this.filterSortColumns.name.columnName,
          cellClass: 'cell-nowrap',
          onCreatedCell: (td: HTMLTableCellElement, cellData: string, rowIndex: number): void => {
            this.handleNameCell(td, cellData, rowIndex);
          },
        },
        {
          key: 'description',
          title: this.filterSortColumns.description.columnName,
          cellClass: 'detail-overflow',
        },
        {
          key: 'approvedEvidenceCount',
          title: this.filterSortColumns.approvedEvidenceCount.columnName,
          cellClass: 'detail-overflow',
          onCreatedCell: (td: HTMLTableCellElement, cellData: number, rowIndex: number): void => {
            if (cellData === 0) td.replaceChildren(document.createTextNode('NA'));
            this.subscription.add(
              this.evidenceStatusCountUpdate.pipe(
                filter(update => update.rowIndex === rowIndex),
                map(update => update.approvedEvidence),
              ).subscribe({
                next: update => {
                  this.tableElements[rowIndex].approvedEvidenceCount = update;
                },
              })
            );
          },
        },
        {
          key: 'rejectedEvidenceCount',
          title: this.filterSortColumns.rejectedEvidenceCount.columnName,
          cellClass: 'detail-overflow',
          onCreatedCell: (td: HTMLTableCellElement, cellData: number, rowIndex: number): void => {
            if (cellData === 0) td.replaceChildren(document.createTextNode('NA'));
            this.subscription.add(
              this.evidenceStatusCountUpdate.pipe(
                filter(update => update.rowIndex === rowIndex),
                map(update => update.rejectedEvidence),
              ).subscribe({
                next: update => {
                  this.tableElements[rowIndex].rejectedEvidenceCount = update;
                },
              })
            );
          },
        },
        {
          key: 'pendingEvidenceCount',
          title: this.filterSortColumns.pendingEvidenceCount.columnName,
          cellClass: 'detail-overflow',
          onCreatedCell: (td: HTMLTableCellElement, cellData: number, rowIndex: number): void => {
            if (cellData === 0) td.replaceChildren(document.createTextNode('NA'));
            this.subscription.add(
              this.evidenceStatusCountUpdate.pipe(
                filter(update => update.rowIndex === rowIndex),
                map(update => update.pendingEvidence),
              ).subscribe({
                next: update => {
                  this.tableElements[rowIndex].pendingEvidenceCount = update;
                },
              })
            );
          },
        },
        {
          key: 'viewOnlyEvidenceCount',
          title: this.filterSortColumns.viewOnlyEvidenceCount.columnName,
          cellClass: 'detail-overflow',
          onCreatedCell: (td: HTMLTableCellElement, cellData: number, rowIndex: number): void => {
            if (cellData === 0) td.replaceChildren(document.createTextNode('NA'));
            this.subscription.add(
              this.evidenceStatusCountUpdate.pipe(
                filter(update => update.rowIndex === rowIndex),
                map(update => update.viewOnlyEvidence),
              ).subscribe({
                next: update => {
                  this.tableElements[rowIndex].viewOnlyEvidenceCount = update;
                },
              })
            );
          },
        },
        {
          key: 'myLevelStatus',
          title: this.filterSortColumns.myLevelStatus.columnName,
          cellClass: 'cell-nowrap',
          onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
            td.replaceChildren(AcceptancePackageUtils.getMultiActionStatusTag(cellData, { big: true }));
          }
        },
        {
          key: 'status',
          title: this.filterSortColumns.status.columnName,
          cellClass: 'cell-nowrap',
          onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
            td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData, { big: true }));
          }
        },
        {
          key: 'lastModifiedDate',
          title: this.filterSortColumns.lastModifiedDate.columnName,
          sort: 'none',
          cellClass: 'column-date',
          onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
            TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
          },
        },
        {
          key: 'siteName',
          title: this.filterSortColumns.siteName.columnName,
        },
        {
          key: 'siteIdByCustomer',
          title: this.filterSortColumns.siteIdByCustomer.columnName,
        },
        {
          key: 'workplanName',
          title: this.filterSortColumns.workplanName.columnName,
        },
        {
          key: 'customerScopeId',
          title: this.filterSortColumns.customerScopeId.columnName,
        },
        {
          key: 'workplanCategory',
          title: this.filterSortColumns.workplanCategory.columnName,
        },
      ];

      if (!this.isApprover() || !this.isMultiLevelAcceptance()) {
        const idx = this.columnsProperties.findIndex(col => col.key === 'myLevelStatus');

        if (idx !== -1) {
          this.columnsProperties.splice(idx, 1); // Hide myLevelStatus if not approver
        }
      }

      const tableHeightStyleProp = 'calc(100vh - 400px - 56px)';
      this.totalRecords = data.totalRecords;
      this.tableElements = data.results;
      const extendProperties = this.tableElements.map(lineItem => lineItem.extendedAttributes);

      extendProperties.forEach((attributes, lineItemIndex) => {
        attributes
          .forEach((attr) => {
            const columnKey = attr.attributeName;
            // these columns are not applicable for customer            
            if (this.isCustomerUser()) {
              if (ExtendedTableColumnKey.evidenceDownloadStatus === columnKey 
                || ExtendedTableColumnKey.rASessionId === columnKey 
                || ExtendedTableColumnKey.rASessionRecordId === columnKey) {
                return;
              }
            }

            this.tableElements[lineItemIndex][columnKey] = attr.attributeValue;

            if (lineItemIndex === 0) {
              // use this property in V3 to control the visibility of extended attribute
              if (attr.isVisible) {
                const tableColumn = {
                  key: attr.attributeName,
                  title: attr.attributeName,
                  onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
                    if (attr.attributeName.toLowerCase().includes('date') && attr.attributeValue !== '') {
                      TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');

                    }
                    else {
                      TableUtils.formatCellContentWithoutCellDataNA
                    }
                  },
                };
                const attributeName = attr.attributeName;

                this.filterSortColumns[attributeName] = {
                  columnName: attr.attributeName, searchText: '', sortingIndex: 0, sortingOrder: ''
                };
                // when the specific extended attribute is available, add the properties in specified position
                if (columnKey === ExtendedTableColumnKey.sharedId) {
                  
                  // insert before name column
                  const idx = this.columnsProperties.findIndex(col => col.key === 'name');
                  if (idx !== -1) {
                    this.columnsProperties.splice(idx, 0, tableColumn); 
                  }

                } else if (columnKey === ExtendedTableColumnKey.section) {
                  // not needed to process the column in specified case
                  if (!this.isApprover()) {

                    // insert after description column
                    const idx = this.columnsProperties.findIndex(col => col.key === 'description');
                    if (idx !== -1) {
                      this.columnsProperties.splice(idx + 1, 0, tableColumn); 
                    }
                  }
                } else {
                  const position = this.columnsProperties.length;
                  if (position >= 0) {
                    // insert extended attributes dynamic columns 2 columns before end
                    this.columnsProperties.splice(position, 0, tableColumn);
                  } else {
                    this.columnsProperties.push(tableColumn);
                  }
                }
              }
            }
          });
      })
      const tableDOM = this.lineItemTableElementRef.nativeElement;
      if (tableDOM) {
        const loadedTableSettings: ColumnsProps[] = JSON.parse(localStorage.getItem(this.tableSettingsStorageKey));
        loadedTableSettings?.forEach((setting) => {
          const columnProperty = this.columnsProperties.find((prop) => setting.key === prop.key);
          if (columnProperty) {
            // Merge column property that eventually contains functions with loaded setting.
            Object.assign(columnProperty, setting);
          }
        });

        this.columnsProperties = TableUtils.sortUserOrderedColumns(this.columnsProperties, loadedTableSettings);
        const table = new Table(tableDOM, {
          data: this.tableElements || [],
          columns: this.columnsProperties,
          height: tableHeightStyleProp,
          scroll: true,
          selectable: this.selectable,
          onCreatedHead: (thead: HTMLTableCellElement): void => {
            thead.querySelectorAll('tr:first-child th').forEach((th: HTMLTableCellElement) => {
              if (!th.classList.contains('cell-select')) {
                th.classList.add('is-sortable');
                th.addEventListener('click', this.addClassSortToHead, false);
              }
              if (th.classList.contains('cell-select')) {
                const dropdown = th.querySelector('.dropdown');
                dropdown?.remove();
              }
            });
          },
          beforeCreatedBody: (): void => {
            const attrKey = 'data-key';
            table?.dom.table.querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`).forEach((cell) => {
              let input = cell?.firstChild;
              const filterInputMarkerClass = 'filter-marker'
              if (input && !cell.classList.contains(filterInputMarkerClass)) {
                const attribute = cell.getAttribute(attrKey);
                if (attribute.includes('date') || attribute.includes('Date')) {
                  const datePicker = this.componentService.createDatePicker(cell);
                  input = datePicker.instance.datePicker()?.nativeElement;
                } else if (attribute === 'status') {
                  addSearchDropDownOptions(input as HTMLInputElement, attribute, this.statusFilterOptions);
                } else if (attribute.includes('EvidenceCount') && evidenceCountOptions[attribute]) {
                  addSearchDropDownOptions(input as HTMLInputElement, attribute, Object.keys(evidenceCountOptions[attribute]));
                } else if (attribute === 'myLevelStatus') {
                  addSearchDropDownOptions(input as HTMLInputElement, attribute, this.myLevelStatusFilterOptions);
                }

                input.addEventListener('change', (event: KeyboardEvent | CustomEvent) => {
                  const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                  const attributeValue = inputTarget.value || event.detail;

                  if (!checkValueLength(attributeValue, {}, this.notificationService)) {
                    return;
                  }

                  this.filterSortColumns[attribute].searchText = attributeValue;
                  this.offset = resetOffsetValue;
                  this.filterLineItem();
                }, false);
                cell.classList.add(filterInputMarkerClass);
              }
            });

            // Overwrite EDS table onChangedFilter to remove default filter behavior.
            // The signature of the assigned function must match with the original signature.
            if (table?.onChangedFilter) { table.onChangedFilter = (a: any, b: any): void => { /* do nothing */ } };
          },
          onChangedSettings: (settings: ColumnsProps[]): void => {
            localStorage.setItem(this.tableSettingsStorageKey, JSON.stringify(settings));
          },
        });
        this.table = table;
        table.init();

        TableUtils.overwriteEDSTableFeatureTableInfo(table, this);

        this.pagination = this.table['pagination'];
        if (this.pagination) {
          const paginationDom = this.pagination['dom'].paginationGroup;
          this.pagination.update(this.totalRecords);
          paginationDom.addEventListener('paginationChangePage', this.paginationChange, false);
          paginationDom.addEventListener('paginationChangeSelect', this.paginationChange, false);
        }
        this.table['pagination'] = undefined;
        this.scripts.push(table);
      }
      if (this.table) {
        const tableHeaderCells = this.table.dom.table.querySelectorAll('th');
        tableHeaderCells.forEach(th => {
          if (th.classList.contains('is-sortable')) {
            const dataKey = th.getAttribute('data-key');
            th.classList.remove('asc');
            th.classList.remove('desc');
            if (dataKey === 'lastModifiedDate') {
              th.classList.add('desc');
            }
          }
        });
        // After table is initialized, update it with real data
        this.filterLineItem();
      }
    });
  }
  paginationChange = (event): void => {
    const setOffsetLimit = {
      offset: (event.detail.state.currentPage * event.detail.state.numPerPage) - event.detail.state.numPerPage,
      limit: event.detail.state.numPerPage
    }
    if (this.limit !== setOffsetLimit.limit || this.offset !== setOffsetLimit.offset) {
      this.limit = setOffsetLimit.limit;
      this.offset = setOffsetLimit.offset;
      this.filterLineItem();
    }
  }

  addClassSortToHead = (event): void => {
    const key = event.srcElement.getAttribute('data-key');
    if (event.srcElement.classList.contains('asc')) {
      event.srcElement.classList.remove('asc');
      event.srcElement.classList.add('desc');
      this.filterSortColumns[key].sortingOrder = 'desc';
    }
    else if (event.srcElement.classList.contains('desc')) {
      event.srcElement.classList.add('asc');
      event.srcElement.classList.remove('desc');
      this.filterSortColumns[key].sortingOrder = 'asc';
    }
    else {
      let sibling = event.srcElement.parentNode.firstElementChild;
      while (sibling) {
        if (sibling.nodeType === 1 && sibling !== event.srcElement) {
          if (sibling.hasAttribute('data-key')) {
            const datKey = sibling.getAttribute('data-key');
            this.filterSortColumns[datKey].sortingOrder = '';
            sibling.classList.remove('asc');
            sibling.classList.remove('desc');
          }
        }
        sibling = sibling.nextSibling;
      }
      event.srcElement.classList.add('asc');
      this.filterSortColumns[key].sortingOrder = 'asc';
    }
    this.filterLineItem();
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.detailsService.close();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!this.lineItemTableElementRef
      && !!changes.isTileMaximized
      && changes.isTileMaximized.previousValue !== changes.isTileMaximized.currentValue
    ) {
      this.updateTableSetting(changes.isTileMaximized.currentValue);
    }

    if (!changes.taxonomyFilterData.firstChange && changes.taxonomyFilterData.currentValue) {
      if (this.applyFilter) {
        this.filterLineItem();
      }
    }

    const packageStatus: SimpleChange = changes.packageStatus
    if (packageStatus.firstChange || packageStatus.previousValue !== packageStatus.currentValue) {
      if (packageStatus.currentValue === CustomerAcceptanceStatus.CustomerNewPendingApproval || packageStatus.currentValue === CustomerAcceptanceStatus.CustomerReworkedPendingApproval) {
        const userActionInProgressSubscription = this.packageService.currentPackageUserActionInProgress.subscribe({
          next: (isInProgress) => this.disabledSubmission = !isInProgress,
        });
        this.subscription.add(userActionInProgressSubscription);
      }
      else {
        this.disabledSubmission = true;
      }
    }

  }

  private handleNameCell(td: HTMLTableCellElement, cellData: string, rowIndex: number): void {
    const rowData = this.table?.data[rowIndex] as unknown as PackageLineItem;
    const htmlText = `<i class="icon icon-info pointer"></i> `;
    if (rowData && (rowData.pendingEvidenceCount + rowData.rejectedEvidenceCount + rowData.approvedEvidenceCount + rowData.viewOnlyEvidenceCount) > 0) {
      td.innerHTML = htmlText.concat(`<a id="lineItem-Id" disabled>${cellData}</a>`);
      td.querySelector('#lineItem-Id').addEventListener('click', (event) => {
        const lineItemDetailsUpdates = this.openLineItemDetails(rowData);
        this.subscription.add(
          lineItemDetailsUpdates.subscribe({
            next: (lineItem: LineItemInfo) => {
              // checking and updating evidence count only makes sense for packages in pending status where Customer Approver might approve/reject the evidences in the details view
              if (this.packageStatus === CustomerAcceptanceStatus.CustomerNewPendingApproval || this.packageStatus === CustomerAcceptanceStatus.CustomerReworkedPendingApproval) {
                this.projectService.getAllLineItemEvidences(this.packageId, lineItem.internalId).subscribe({
                  next: (evidences: EvidenceDetails[]) => {
                    const approvedEvidence = evidences.filter(evidence => [CustomerAcceptanceStatus.CustomerApproved, CustomerAcceptanceStatus.DeemedApproved].includes(evidence.status)).length;
                    const pendingEvidence = evidences.filter(evidence => [
                      CustomerAcceptanceStatus.CustomerNewPendingApproval,
                      CustomerAcceptanceStatus.CustomerReworkedPendingApproval,
                    ].includes(evidence.status)).length;
                    const rejectedEvidence = evidences.filter(evidence => [CustomerAcceptanceStatus.CustomerRejected, CustomerAcceptanceStatus.CustomerRejectedNoAction].includes(evidence.status)).length;
                    const viewOnlyEvidence = evidences.filter(evidence => [CustomerAcceptanceStatus.CustomerAcceptanceNotRequired].includes(evidence.status)).length;
                    const evidenceStatusCountUpdate = { rowIndex, approvedEvidence, pendingEvidence, rejectedEvidence, viewOnlyEvidence };
                    this.evidenceStatusCountUpdate.emit(evidenceStatusCountUpdate);
                  }
                })
              }
            },
          })
        );
      });
    } else {
      td.innerHTML = htmlText.concat(cellData);
    }
    td.querySelector('.icon').addEventListener('click', (event) => {
      this.openLineItemInfo(rowData);
    });
  }

  /**
   * Get line item data.
   */
  getLineItemsByPackageId(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.toggleLoadingLineItems(true);
      })
    );
    // Get the first row to get table column properties including columns based on extendedAttributes
    const lineItemData = this.projectService.getLineItemsByPackageId(this.packageId, 1, 0, this.filterSortColumns)
      .pipe(map((data: LineItemResponse) => {
        return data;
      }),
        catchError((err) => {
          this.toggleLoadingLineItems(false);
          return [];
        }),

      );
    this.lineItemData = loadingStartFlagging.pipe(

      exhaustMap(() => lineItemData),
    );
  }

  /**
   * Get line item data.
   */
  /**
   * Get line item data.
   */
  getLineItemsBySearch(filterPost): void {
    this.toggleLoadingLineItems(true);

    const searchWithFilter = this.projectService.getLineItemsSearch(filterPost, this.limit, this.offset, this.packageId, this.filterSortColumns)
    const searchWithoutFilter = this.projectService.getLineItemsByPackageId(this.packageId, this.limit, this.offset, this.filterSortColumns)

    // only when the filter attributes are available, use the search interface
    // else use the get interface
    let invokingMethod = undefined
    if (Object.keys(filterPost).length === 0) {
      invokingMethod = searchWithoutFilter;
    } else {
      invokingMethod = searchWithFilter
    }

    invokingMethod
      .subscribe({
        next: (data: LineItemResponse) => {
          this.toggleLoadingLineItems(false);
          this.totalRecords = data.totalRecords;
          this.tableElements = data.results;
          const extendProperties = this.tableElements.map(data => data.extendedAttributes);
          extendProperties.forEach((attr, i) => {
            attr
              .forEach((element) => {
                const columKey = element.attributeName;
                this.tableElements[i][columKey] = element.attributeValue;
              });
          })
          this.table.update(this.tableElements);
          this.pagination.update(this.totalRecords);
        },
        error: (err) => {
          this.tableElements = [];
          this.table.update(this.tableElements);
          console.error(err.error?.responseMessageDescription);
          this.toggleLoadingLineItems(false);
        },
      });
  }

  /**
   * Filter line items
   */
  public filterLineItem(): void {
    this.isFilter = false;
    let onlySorting = true;
    const checkSorting = Object.keys(this.filterSortColumns).find(key => this.filterSortColumns[key].searchText != '');
    if (checkSorting) {
      onlySorting = false;
      this.isFilter = true;
    };
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    if (onlySorting && (!this.taxonomyFilterData || this.taxonomyFilterData.length === 0)) {
      this.getLineItemsBySearch({});
    }
    else {
      const searchedStatus = this.confirmedFilters.status.searchText;
      const searchedMyLevelStatus = this.confirmedFilters.myLevelStatus.searchText;
      const packageTaxonomy = [];
      if (this.taxonomyFilterData) {
        // Network elements do not contain line items so they are not passed to BE in the search criteria
        this.taxonomyFilterData.filter(node => node.nodeType !== 'networkElement').forEach((taxoNomyFilter) => {
          const taxonomy = {
            type: taxoNomyFilter.type,
            id: taxoNomyFilter.id
          }
          packageTaxonomy.push(taxonomy);
        });
      }
      let name;
      let description;
      let status;
      let myLevelStatus: string;
      let lastModifiedDate;
      const evidenceApprovalStatus = [];
      const extendedAttributes = [];
      if (searchedStatus !== '') {
        const filteredStatus = this.statusFilterOptions.filter(statusOption =>
          statusOption.toUpperCase().includes(searchedStatus.toUpperCase())
        );
        status = filteredStatus.map(status => this.statusMap.get(status)).join();
      }
      if (searchedMyLevelStatus !== '') {
        const filteredStatus = this.myLevelStatusFilterOptions.filter(statusOption =>
          statusOption.toUpperCase().includes(searchedMyLevelStatus.toUpperCase())
        );
        myLevelStatus = filteredStatus.map(status => this.myLevelStatusMap.get(status)).join();
      }
      if (this.confirmedFilters.name.searchText != '') {
        name = `${this.confirmedFilters.name.searchText}`;
      }
      if (this.confirmedFilters.description.searchText != '') {
        description = `${this.confirmedFilters.description.searchText}`;
      }
      if (this.confirmedFilters.lastModifiedDate.searchText != '') {
        lastModifiedDate = this.confirmedFilters.lastModifiedDate.searchText;
      }
      if (this.confirmedFilters.approvedEvidenceCount.searchText != ''
        && evidenceCountOptions.approvedEvidenceCount[this.confirmedFilters.approvedEvidenceCount.searchText]) {
        evidenceApprovalStatus.push(evidenceCountOptions.approvedEvidenceCount[this.confirmedFilters.approvedEvidenceCount.searchText]);
      }
      if (this.confirmedFilters.rejectedEvidenceCount.searchText != ''
        && evidenceCountOptions.rejectedEvidenceCount[this.confirmedFilters.rejectedEvidenceCount.searchText]) {
        evidenceApprovalStatus.push(evidenceCountOptions.rejectedEvidenceCount[this.confirmedFilters.rejectedEvidenceCount.searchText]);
      }
      if (this.confirmedFilters.pendingEvidenceCount.searchText != ''
        && evidenceCountOptions.pendingEvidenceCount[this.confirmedFilters.pendingEvidenceCount.searchText]) {
        evidenceApprovalStatus.push(evidenceCountOptions.pendingEvidenceCount[this.confirmedFilters.pendingEvidenceCount.searchText]);
      }
      if (this.confirmedFilters.viewOnlyEvidenceCount.searchText != ''
        && evidenceCountOptions.viewOnlyEvidenceCount[this.confirmedFilters.viewOnlyEvidenceCount.searchText]) {
        evidenceApprovalStatus.push(evidenceCountOptions.viewOnlyEvidenceCount[this.confirmedFilters.viewOnlyEvidenceCount.searchText]);
      }

      Object.keys(this.confirmedFilters).forEach(key => {
        if (key !== 'name'
          && key !== 'status'
          && key !== 'myLevelStatus'
          && key !== 'description'
          && key !== 'lastModifiedDate'
          && key !== 'approvedEvidenceCount'
          && key !== 'pendingEvidenceCount'
          && key !== 'rejectedEvidenceCount'
          && key !== 'viewOnlyEvidenceCount'
        ) {
          if (this.confirmedFilters[key].searchText != '') {
            const extendedValues = {
              attribute: key,
              attributeValue: this.confirmedFilters[key].searchText
            }
            extendedAttributes.push(extendedValues);
          }
        }
      });
      const filterPost = {
        packageTaxonomy,
        lineItemProperties: {
          name,
          description,
          statuses: status?.length > 0 ? status.split(',') : undefined,
          myLevelStatuses: myLevelStatus?.length > 0 ? myLevelStatus.split(',') : undefined,
          evidenceApprovalStatus: evidenceApprovalStatus.length > 0 ? evidenceApprovalStatus : undefined,
          lastModifiedDate,
          extendedAttributes
        }
      };
      this.getLineItemsBySearch(filterPost);
    }
  }

  public openLineItemDetails(details: PackageLineItem): EventEmitter<LineItemInfo> {
    const componentRef = this.detailsService.open(
      LineItemDetailsComponent,
      this.viewContainerRef,
      {
        lineItemId: details.internalId,
        packageId: this.packageId,
        projectId: this.route.snapshot.parent.params.id,
        lineItemDetails: details,
        isPackageCompleted: this.isPackageCompleted,
        packageStatus: this.packageStatus,
        reloadLineItemsTable: this.reloadLineItemsTable,
        isMultiLevelAcceptance: this.isMultiLevelAcceptance
      }

    ) as ComponentRef<LineItemDetailsComponent>

    return componentRef.instance.lineItemUpdate
  }

  private openLineItemInfo(details: PackageLineItem): void {
    const dialogData: LineItemInfoData = {
      lineItemDetails: details, packageId: this.packageId, packageStatus: this.packageStatus,
      projectId: this.route.snapshot.parent.params.id
    };
    const dialogRef = this.dialogService.createDialog(
      LineItemInfoDialogComponent,
      dialogData
    );
  }

  /**
   * @param permission to check
   * @returns boolean whether that permission is granted
   */
  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  /**
   * Clears the input of one filter criterion
   * @param currentFilter name of the filter criterion to be cleared
   */
  public clearSelectedFilter(currentFilter: string): void {
    let showPill = false;
    this.filterSortColumns[currentFilter].searchText = '';
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    Object.keys(this.confirmedFilters).forEach(filterkey => {
      if (this.confirmedFilters[filterkey].searchText != '') {
        showPill = true;
      }
    });
    const attrKey = 'data-key';
    this.table?.dom.table.querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach((filterCell) => {
        if (currentFilter === filterCell.getAttribute(attrKey)) {
          filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
        }
      });

    this.isFilter = showPill;
    this.filterLineItem();
  }

  acceptRejectLineItems(buttonType: 'Reject' | string): void {
    const statusValue = (buttonType === 'Reject') ? CustomerAcceptanceStatus.CustomerRejected : CustomerAcceptanceStatus.CustomerApproved;
    const selectedLineItems = this.table.selected;

    if (selectedLineItems.length > 0) {
      const lineItemIds = selectedLineItems.map((rowData: any) => {
        return rowData.internalId as string;
      });

      const lineItemIdsPayload = {
        status: statusValue,
        lineItemIds,
      };
      if (this.approvalRule === ApprovalRuleOption.OFF) {
        this.updateLineItemStatus(lineItemIdsPayload, buttonType);
      } else if (this.approvalRule === ApprovalRuleOption.ON) {
        this.updateLineItemStatusWithScope(lineItemIdsPayload, buttonType);
      } else {
        this.notificationService.showNotification({
          title: 'Please check the selected approval rule of the package!'
        });
      }
    }
    else {
      const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading, additionalMessage: '' };
      const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
      dialogMessage.instance.show = APICallStatus.Error;
      dialogMessage.instance.statusMessage = 'Please select line items';
    }
  }

  updateLineItemStatus(
    lineItemsStatusChange: {
      status: CustomerAcceptanceStatus,
      lineItemIds: string[],
    },
    buttonType: string
  ): void {
    const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading, additionalMessage: '' };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    this.projectService.updateLineItemStatus(this.packageId, lineItemsStatusChange).subscribe({
      next: (data: LineItemResponse) => {
        dialogMessage.instance.show = APICallStatus.Success;
        dialogMessage.instance.additionalMessage = 'Your verdict has been received. The evidence decision has been updated.';
        this.isUpdatePackageStatus.emit(true);
        if (buttonType == 'Approve') {
          dialogMessage.instance.dialogueTitle = 'Line items approved';
          dialogMessage.instance.iconStatus = 'icon-check';
          this.updateLineItemStatusInView(lineItemsStatusChange);
        }
        else if (buttonType == 'Reject') {
          dialogMessage.instance.dialogueTitle = 'Line items rejected';
          dialogMessage.instance.iconStatus = 'icon-cross';
          this.updateLineItemStatusInView(lineItemsStatusChange);
        }
      },
      error: (err) => {
        dialogMessage.instance.show = APICallStatus.Error;
        let additionalMessage = '';
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
        } else if (err.status === HttpStatusCode.BadRequest) {
          additionalMessage = '\n ' + err.error.responseMessageDescription;
        } else {
          additionalMessage = '\n Please follow the FAQ doc for further steps.';
        }
        dialogMessage.instance.statusMessage = 'Error when updating the line items!' + additionalMessage;
        dialogMessage.instance.dialogueTitle = 'Failed to submit';
        dialogMessage.instance.additionalMessage = '';
        dialogMessage.instance.actionOn.next('FAQ');
      },
    });
  }

  updateLineItemStatusWithScope(
    lineItemsStatusChange: {
      status: CustomerAcceptanceStatus,
      lineItemIds: string[],
    },
    buttonType: string
  ): void {
    const scope = buttonType === 'Approve' ? 'All' : 'Pending';
    const confirmationDialog = this.dialogService.createDialog(LineItemDecisionConfirmationDialogComponent, { buttonType, scope });
    const dialogSubscription = confirmationDialog.instance.dialogResult.subscribe((result: boolean) => {
      if (result) {
        const requestBody = {
          ...lineItemsStatusChange,
          evidencesStatusType: scope
        } as LineItemStatusUpdateWithScope;
        const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading, additionalMessage: '' };
        const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
        this.projectService.updateLineItemStatusWithScope(this.packageId, requestBody).subscribe({
          next: () => {
            dialogMessage.instance.show = APICallStatus.Success;
            dialogMessage.instance.additionalMessage = 'Your verdict has been received. The evidence decision has been updated.';
            this.isUpdatePackageStatus.emit(true);
            if (buttonType == 'Approve') {
              dialogMessage.instance.dialogueTitle = 'Line items approved';
              dialogMessage.instance.iconStatus = 'icon-check';
            }
            else if (buttonType == 'Reject') {
              dialogMessage.instance.dialogueTitle = 'Line items rejected';
              dialogMessage.instance.iconStatus = 'icon-cross';
            }
            this.filterLineItem();
          },
          error: (err) => {
            dialogMessage.instance.show = APICallStatus.Error;
            let additionalMessage = '';
            if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
              additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
            } else if (err.status === HttpStatusCode.BadRequest) {
              additionalMessage = '\n ' + err.error.responseMessageDescription;
            } else {
              additionalMessage = '\n Please follow the FAQ doc for further steps.';
            }
            dialogMessage.instance.statusMessage = 'Error when updating the line items!' + additionalMessage;
            dialogMessage.instance.dialogueTitle = 'Failed to submit';
            dialogMessage.instance.additionalMessage = '';
            dialogMessage.instance.actionOn.next('FAQ');
          },
        });
      }
    });
    this.subscription.add(dialogSubscription);
  }

  private updateLineItemStatusInView(lineItemsStatusChange: { status: CustomerAcceptanceStatus; lineItemIds: string[]; }): void {
    if (lineItemsStatusChange?.lineItemIds?.length > 0) {
      lineItemsStatusChange.lineItemIds.forEach((lineItemId: string) => {
        const lineItemIndex = this.tableElements.findIndex(lineItem => lineItem.internalId === lineItemId);
        if (lineItemIndex > -1)
          this.tableElements[lineItemIndex].status = lineItemsStatusChange.status;
      });
      this.table.update(this.tableElements);
    };
  }

  /**
   * Clears the input of all filter criteria
   */
  public clearAllFilters(): void {
    Object.keys(this.filterSortColumns).forEach(filterKey => this.filterSortColumns[filterKey].searchText = '');
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    const filterBody = this.lineItemTableElementRef.nativeElement.querySelector('thead>tr.filters');
    filterBody.querySelectorAll('tr td input').forEach((inputFilter) => {
      (inputFilter as HTMLInputElement).value = '';
    });
    this.isFilter = false;
    this.filterLineItem();
  }

  private toggleLoadingLineItems(loading: boolean): void {
    this.loadingLineItems = loading;
    this.isTableLoaded.emit(!loading);
  }

  private updateTableSetting(isMaximized: boolean): void {
    if (isMaximized) {
      this.lineItemTableElementRef.nativeElement.classList.add('compact');
      this.lineItemTableElementRef.nativeElement.parentElement.style.height = 'calc(100vh - 270px - 32px)';
    } else {
      this.lineItemTableElementRef.nativeElement.classList.remove('compact');
      this.lineItemTableElementRef.nativeElement.parentElement.style.height = 'calc(100vh - 400px - 32px)';
    }
  }
}
