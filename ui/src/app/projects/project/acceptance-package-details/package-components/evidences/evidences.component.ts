import {
  AfterViewInit,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  input,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Pagination, Table } from '@eds/vanilla';
import { Observable, Subscription } from 'rxjs';
import { ProjectsService } from '../../../../projects.service';
import { NullStringDatePipe } from '../../../../../shared/null-string-date.pipe';
import { CustomerAcceptanceStatus, EvidenceRemark, EvidenceType, GetLineItemEvidenceResponse, LineItemEvidenceSearchRequest, PackageEvidenceRow, StatusLineItemsUpdate } from '../../../../projects.interface';
import { ActivatedRoute } from '@angular/router';
import { DialogService } from '../../../../../../app/portal/services/dialog.service';
import { tap } from 'rxjs/operators';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { DetailsContextualService } from '../../details-contextual.service';
import TableUtils from '../../table-utilities';
import { ColumnsProps } from '@eds/vanilla/table/Table';
import { AcceptancePackageService, RoleInPackage } from '../../../acceptance-package.service';
import { HttpStatusCode } from '@angular/common/http';
import { evidenceStatusViewModelToDataModel, myLevelStatusViewModelToDataModel } from '../../../status-mapping';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';
import { EvidencesCarouselComponent } from '../lineitem-evidence-details/evidences-carousel/evidences-carousel.component';
import { addSearchDropDownOptions, checkValueLength, resetOffsetValue } from 'src/app/shared/table-utilities';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ComponentService } from 'src/app/shared/component.service';

@Component({
  selector: 'app-evidences',
  templateUrl: './evidences.component.html',
  styleUrls: ['./evidences.component.less'],
  providers: [DetailsContextualService]
})
export class EvidencesComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('evidenceTable') private readonly evidenceTableElementRef: ElementRef<HTMLElement>;
  pagination: Pagination;
  public limit: number = 50;
  public offset: number = 0;
  packageId: string;
  private scripts: Scripts[] = [];
  totalRecords: number;
  selectable = '';
  columnsProperties: any;
  table: Table;
  private _tableElements: PackageEvidenceRow[] = [];
  get tableElements(): PackageEvidenceRow[] { return this._tableElements };
  private set tableElements(tableData) {
    this._tableElements = tableData;
    this.evidencesUpdate.emit();
  };
  private evidencesUpdate = new EventEmitter<unknown>;
  private lastPageChangeRequest: 'next' | 'prev';
  private subscription: Subscription = new Subscription();
  loadingEvidences: boolean;
  @Input() taxonomyFilterData;
  @Input() applyFilter: boolean;
  @Input() isPackageCompleted: boolean;
  @Input() packageStatus: string;
  @Input() isTileMaximized: boolean;
  @Output() isTableLoaded = new EventEmitter<boolean>();
  @Output() isUpdatePackageStatus = new EventEmitter<boolean>();
  readonly isMultiLevelAcceptance = input<boolean>();
  public filterSortColumns = {
    name: { columnName: 'Evidence name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lineItemDesc: { columnName: 'Line item description', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: { columnName: 'Overall status', searchText: '', sortingIndex: 0, sortingOrder: '' },
    myLevelStatus: { columnName: 'Status at my level', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdDate: { columnName: 'Upload date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
    type: { columnName: 'Type', searchText: '', sortingIndex: 0, sortingOrder: '' },
    remarks: { columnName: 'Remarks', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lineItemName: { columnName: 'Line item name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanCategory: { columnName: 'Workplan category', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };
  public isFilter = false;
  public confirmedFilters = this.filterSortColumns;
  disabledSubmission: boolean = true;
  isApprover: boolean = false;
  private readonly tableSettingsStorageKey = 'line-item-evidences-table-settings';

  statusMap = evidenceStatusViewModelToDataModel;
  statusFilterOptions = [...this.statusMap.keys()];
  myLevelStatusMap = myLevelStatusViewModelToDataModel;
  myLevelStatusFilterOptions = [...this.myLevelStatusMap.keys()];
  tableUtils = TableUtils;

  constructor(
    private projectService: ProjectsService,
    private componentService: ComponentService,
    private dialogService: DialogService,
    private datePipe: NullStringDatePipe,
    private route: ActivatedRoute,
    private packageService: AcceptancePackageService,
    private detailsService: DetailsContextualService,
    private viewContainerRef: ViewContainerRef,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.packageId = this.route.snapshot.paramMap.get('id');
    this.subscription.add(this.detailsService.getClosedEmitter().subscribe(item => {
      // filter evidences based on current filter and sorting criteria when details view gets closed
      this.filterEvidence();
    }));

    this.subscription.add(this.packageService.currentPackageUser.subscribe( pkgUsr => {
      if (pkgUsr.userRole) {
        this.isApprover = pkgUsr.userRole === RoleInPackage.CustomerApprover;
      }

      if (this.isApprover) {
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
      this.filterEvidence(true);
    }));

    if (this.packageStatus === CustomerAcceptanceStatus.CustomerNewPendingApproval || this.packageStatus === CustomerAcceptanceStatus.CustomerReworkedPendingApproval) {
      const userActionInProgressSubscription = this.packageService.currentPackageUserActionInProgress.subscribe({
        next: (isInProgress) => this.disabledSubmission = !isInProgress,
      });
      this.subscription.add(userActionInProgressSubscription);
      this.subscription.add(
        this.packageService.updatePackageStatus.subscribe((event) => {
          // Handle the emitted event from the LineItemDetailsComponent
          this.isUpdatePackageStatus.emit(true);
        })
      );
    }
    else {
      this.disabledSubmission = true;
    }
  }

  ngAfterViewInit(): void {
    this.selectable = !this.isPackageCompleted && this.isApprover ? 'multi' : '';

    this.columnsProperties = [
      {
        key: 'name',
        title: this.filterSortColumns.name.columnName,
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          td.innerHTML = `<a id="lineItem-Id">${cellData}</a>`;
        },
      },
      {
        key: 'type',
        title: this.filterSortColumns.type.columnName,
      },
      {
        key: 'lineItemName',
        title: this.filterSortColumns.lineItemName.columnName,
      },
      {
        key: 'lineItemDesc',
        title: this.filterSortColumns.lineItemDesc.columnName,
      },
      {
        key: 'remarks',
        title: this.filterSortColumns.remarks.columnName,
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
        key: 'createdDate',
        title: this.filterSortColumns.createdDate.columnName,
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.formatDateCell(this.datePipe, cellData, td);
        },
      },
      {
        key: 'lastModifiedDate',
        title: this.filterSortColumns.lastModifiedDate.columnName,
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
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

    if (!this.isApprover || !this.isMultiLevelAcceptance()) {
      const idx = this.columnsProperties.findIndex(col => col.key === 'myLevelStatus');

        if (idx !== -1) {
          this.columnsProperties.splice(idx, 1); // Hide myLevelStatus if not approver
        }
    }
    const tableHeightStyleProp = 'calc(100vh - 415px - 56px)';
    const tableDOM = this.evidenceTableElementRef.nativeElement;
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
        selectable: this.selectable,
        onCreatedHead: (thead): void => {
          const attrKey = 'data-key';
          thead.querySelectorAll('tr:first-child th').forEach((th) => {
            if (!th.classList.contains('cell-select') && Object.keys(this.filterSortColumns).includes(th.getAttribute(attrKey))) {
              th.classList.add('is-sortable');
              th.addEventListener('click', this.addClassSortToHead, false);
            }
            if (!Object.keys(this.filterSortColumns).includes(th.getAttribute(attrKey))) {
              // No sorting if column is not specified in filterSortColumns
              th.removeAttribute(attrKey);
            }
            if (th.classList.contains('cell-select')) {
              const dropdown = th.querySelector('.dropdown');
              dropdown?.remove();
            }
          });
        },
        onCreatedRow: (tr: HTMLTableRowElement, rowData: PackageEvidenceRow): void => {
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
          this.subscription.add(
            tr.querySelector('#lineItem-Id').addEventListener('click', (event) => {
              this.openEvidenceDetails(rowData, rowData.internalId);
            })
          );
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
              } else if (attribute === 'type') {
                addSearchDropDownOptions(input as HTMLInputElement, attribute, Object.keys(EvidenceType));
              } else if (attribute === 'remarks') {
                addSearchDropDownOptions(input as HTMLInputElement, attribute, Object.values(EvidenceRemark));
              } else if (attribute === 'myLevelStatus') {
                addSearchDropDownOptions(input as HTMLInputElement, attribute, this.myLevelStatusFilterOptions);
              }

              input?.addEventListener('change', (event: KeyboardEvent | CustomEvent) => {
                const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                const attributeValue = inputTarget.value || event.detail;

                if (!checkValueLength(attributeValue, {}, this.notificationService)) {
                  return;
                }

                this.filterSortColumns[attribute].searchText = attributeValue;
                this.offset = resetOffsetValue;
                this.filterEvidence();
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
      table.init();
      TableUtils.overwriteEDSTableFeatureTableInfo(table, this);
      this.table = table;

      this.pagination = this.table['pagination'];
      if (this.pagination) {
        const paginationDom = this.pagination['dom'].paginationGroup;
        this.pagination.update(this.totalRecords)
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
      })
    }
  }
  /**
   * This function is adding sorting manulay
   * and remove sorting from other fields adding sorting to current clicking event
   * @param event
   */
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
    this.filterEvidence();
  };

  onPageChangeRequest(change: 'next' | 'prev'): void {
    this.lastPageChangeRequest = change;
    const direction: 'left' | 'right' = change === 'next' ? 'right' : 'left';
    const changeNum: number = change === 'next' ? 1 : -1;

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

  /**
    * Pagination chnage page and select dropdown
    * @param event
    */
  paginationChange = (event): void => {
    const setOffsetLimit = {
      offset:
        event.detail.state.currentPage * event.detail.state.numPerPage -
        event.detail.state.numPerPage,
      limit: event.detail.state.numPerPage,
    };
    if (
      this.limit !== setOffsetLimit.limit ||
      this.offset !== setOffsetLimit.offset
    ) {
      this.limit = setOffsetLimit.limit;
      this.offset = setOffsetLimit.offset;
      this.filterEvidence();
    }
  };

  setLineItemEvidences(lineItemEvidences: GetLineItemEvidenceResponse): void {
    this.totalRecords = lineItemEvidences.totalRecords;

    this.toggleLoadingEvidences(false);
    this.tableElements = lineItemEvidences.results;
    this.table.update(this.tableElements);
    this.pagination.update(this.totalRecords)
  }

  /**
   * getEvidencesByPackageId function  we will get line item data from service getLineItemByPackageId
   */
  getEvidencesByPackageId(): void {
    this.toggleLoadingEvidences(true);
    this.projectService.getLineItemsEvidences(this.packageId, this.limit, this.offset, this.filterSortColumns).pipe(
      tap(data => this.setLineItemEvidences(data)),
    ).subscribe();
  }

  /**
   * This function will call on apply filter / magnifier glass icon click
   * getEvidencesBySearch function we will get line item data from service getEvidencesBySearch
   */
  getEvidencesBySearch(filterPost: LineItemEvidenceSearchRequest, initialFilter: boolean): void {
    this.toggleLoadingEvidences(true);
    this.projectService.getLineItemEvidenceSearch(filterPost, this.limit, this.offset, this.packageId, this.filterSortColumns).pipe(
      tap(data => {
        if (initialFilter && data.totalRecords === 0) {
          this.clearSelectedFilter('status');
        } else {
          this.setLineItemEvidences(data);
        }
      }),
    ).subscribe({
      error: (err) => {
        this.toggleLoadingEvidences(false);
        this.tableElements = [];
        this.table.update(this.tableElements);
        console.error(err.error.responseMessageDescription);
      },
    });
  }

  /**
   * filterEvidence function  search functionality will get data filtered coulmn
   * @filterText is array of filters
   */
  public filterEvidence(initialFilter = false): void {
    let onlySorting = true;
    this.isFilter = false;
    Object.keys(this.filterSortColumns).forEach(key => {
      if (this.filterSortColumns[key].searchText != '') {
        onlySorting = false;
        this.isFilter = true;
      }
    });
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    if (onlySorting && (!this.taxonomyFilterData || this.taxonomyFilterData.length == 0)) {
      this.getEvidencesByPackageId();
    }

    else {
      const searchedStatus = this.confirmedFilters.status.searchText;
      const searchedMyLevelStatus = this.confirmedFilters.myLevelStatus.searchText;
      const packageTaxonomy = [];
      if (this.taxonomyFilterData) {
        // Network elements do not contain line items so they are not passed to BE in the search criteria
        this.taxonomyFilterData.filter(node => node.nodeType !== 'networkElement').forEach((taxonomyFilter) => {
          const taxonomy = {
            type: taxonomyFilter.type,
            id: taxonomyFilter.id
          }
          packageTaxonomy.push(taxonomy);
        });
      }
      let name;
      let status;
      let myLevelStatus: string;
      let createdDate;
      let lastModifiedDate;
      let type;
      let remarks;
      let lineItemDesc;
      let lineItemName;
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
      if (this.confirmedFilters.status.searchText != '') {
        status = status;
      }
      if (this.confirmedFilters.createdDate.searchText != '') {
        createdDate = this.confirmedFilters.createdDate.searchText;
      }
      if (this.confirmedFilters.lastModifiedDate.searchText != '') {
        lastModifiedDate = this.confirmedFilters.lastModifiedDate.searchText;
      }
      if (this.confirmedFilters.type.searchText != '') {
        type = `${this.confirmedFilters.type.searchText}`;
      }
      if (this.confirmedFilters.remarks.searchText != '') {
        remarks = `${this.confirmedFilters.remarks.searchText}`;
      }
      if (this.confirmedFilters.lineItemDesc.searchText != '') {
        lineItemDesc = this.confirmedFilters.lineItemDesc.searchText;
      }
      if (this.confirmedFilters.lineItemName.searchText != '') {
        lineItemName = this.confirmedFilters.lineItemName.searchText;
      }
      const filterPost: LineItemEvidenceSearchRequest = {
        packageTaxonomy,
        evidenceProperties: {
          name,
          lineItemDesc,
          lineItemName,
          statuses: status?.length > 0 ? status.split(',') : undefined,
          myLevelStatuses: myLevelStatus?.length > 0 ? myLevelStatus.split(',') : undefined,
          createdDate,
          lastModifiedDate,
          type,
          remarks
        }
      }
      this.getEvidencesBySearch(filterPost, initialFilter);
    }
  }

  /**
   * Open dialog and display the evidence details carousel.
   * @param evidence to use
   */
  openEvidenceDetails(evidence: PackageEvidenceRow, lineItemId: string): void {
    const componentRef = this.detailsService.open(
      EvidencesCarouselComponent,
      this.viewContainerRef,
      {
        selectedEvidence: evidence,
        lineItemId,
      }
    ) as ComponentRef<EvidencesCarouselComponent>;
    componentRef.setInput('packageId', this.packageId);
    componentRef.setInput('isPackageCompleted', this.isPackageCompleted);
    componentRef.setInput('packageStatus', this.packageStatus);
    componentRef.setInput('evidences', this.tableElements);
    componentRef.setInput('totalRecords', this.totalRecords);
    componentRef.setInput('offset', this.offset);
    componentRef.setInput('limit', this.limit);
    this.subscription.add(
      componentRef.instance.pageChange.subscribe({
        next: (change) => {
          this.onPageChangeRequest(change);
        },
      })
    );
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
    if (!!this.evidenceTableElementRef
      && !!changes.isTileMaximized
      && changes.isTileMaximized.previousValue !== changes.isTileMaximized.currentValue
    ) {
      this.updateTableSetting(changes.isTileMaximized.currentValue);
    }

    if (!changes.taxonomyFilterData.firstChange && changes.taxonomyFilterData.currentValue) {
      if (this.applyFilter) {
        this.filterEvidence();
      }
    }
  }

  /**
   * Clears the input of one filter criterion
   * @param currentFilter name of the filter criterion to be cleared
   */
  public clearSelectedFilter(currentFilter: string): void {
    let showPill = false;
    this.filterSortColumns[currentFilter].searchText = '';
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    this.filterEvidence();
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
  }
  /**
* @param permission permmission to check
* @returns boolean whter that permission is granted
*/

  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  acceptRejectEvidences(buttonType: string): void {
    const acceptIds = [];
    let statusValue: CustomerAcceptanceStatus;
    let remarkValue = '';
    if (buttonType == 'Reject') {
      statusValue = CustomerAcceptanceStatus.CustomerRejected;
      remarkValue = EvidenceRemark.MINOR;
    }
    else {
      statusValue = CustomerAcceptanceStatus.CustomerApproved;
      remarkValue = EvidenceRemark.OK;
    }
    if (this.table.selected.length > 0) {
      const evidences = this.table.selected.map((row: PackageEvidenceRow) => ({
        id: row.internalId,
        remarks: remarkValue
      }));
      const payload = {
        status: statusValue,
        evidences
      };
      this.updateLineItemEvidencesStatus(payload, buttonType);
    }
    else {
      this.updateLineItemEvidencesStatus(null, buttonType);
    }
  }

  /**
* @param ids selected ids
* @returns status updated record
*/
  updateLineItemEvidencesStatus(requestBody: StatusLineItemsUpdate, buttonType: string): void {
    const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    if (requestBody != null) {
      this.projectService.updateEvidencesStatus(this.packageId, requestBody).subscribe({
        next: () => {
          dialogMessage.instance.show = APICallStatus.Success;
          dialogMessage.instance.additionalMessage = 'Your verdict has been received. The evidence decision has been updated.';
          this.isUpdatePackageStatus.emit(true);
          if (buttonType == 'Approve') {
            dialogMessage.instance.dialogueTitle = 'Evidence approved';
            dialogMessage.instance.iconStatus = 'icon-check';
          }
          else if (buttonType == 'Reject') {
            dialogMessage.instance.dialogueTitle = 'Evidence rejected';
            dialogMessage.instance.iconStatus = 'icon-cross';
          }
          this.filterEvidence();
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
        },
      });
    }
    else {
      dialogMessage.instance.show = APICallStatus.Error;
      dialogMessage.instance.statusMessage = 'Please select evidences';
    }
  }

  /**
   * Clears the input of all filter criteria
   */
  public clearAllFilters(): void {
    Object.keys(this.filterSortColumns).forEach(filterKey => this.filterSortColumns[filterKey].searchText = '');
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    const filterBody = this.evidenceTableElementRef.nativeElement.querySelector('thead>tr.filters');
    filterBody.querySelectorAll('tr td input').forEach((inputFilter) => {
      (inputFilter as HTMLInputElement).value = '';
    });
    this.filterEvidence();
    this.isFilter = false;
  }

  private toggleLoadingEvidences(loading: boolean): void {
    this.loadingEvidences = loading;
    this.isTableLoaded.emit(!loading);
  }

  private updateTableSetting(isMaximized: boolean): void {
    if (isMaximized) {
      this.evidenceTableElementRef.nativeElement.classList.add('compact');
      this.evidenceTableElementRef.nativeElement.parentElement.style.height = 'calc(100vh - 270px - 32px)';
    } else {
      this.evidenceTableElementRef.nativeElement.classList.remove('compact');
      this.evidenceTableElementRef.nativeElement.parentElement.style.height = 'calc(100vh - 400px - 32px)';
    }
  }
}
