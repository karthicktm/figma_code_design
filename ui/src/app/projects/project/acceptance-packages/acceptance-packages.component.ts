import { Location } from '@angular/common';
import { AfterViewInit, Component, ComponentRef, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Pagination, TabGroup, Table } from '@eds/vanilla';
import { lastValueFrom, Observable, ReplaySubject, Subscription } from 'rxjs';
import { AuthorizationService, ToolPermission } from 'src/app/auth/authorization.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { AcceptancePackageService } from '../acceptance-package.service';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { CustomerAcceptanceStatus, GetPackageDocumentDownloadStatusResponse, GetPackagesResponse, PackageDocumentDownloadStatus, PackageLevel, PackagesEntry, ProjectDetails, SourceTool, SubmitAcceptancePackagesRequest, UserSession } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';
import { DetailsContextualService } from '../acceptance-package-details/details-contextual.service';
import TableUtils from '../acceptance-package-details/table-utilities';
import { myLevelStatusViewModelToDataModel, packageStatusViewModelToDataModel } from '../status-mapping';
import AcceptancePackageUtils from '../acceptance-package-utilities';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { PackageInfoDialogComponent } from './package-info-dialog/package-info-dialog.component';
import { addSearchDropDownOptions, checkValueLength, resetOffsetValue } from 'src/app/shared/table-utilities';
import { ComponentService } from 'src/app/shared/component.service';
import { RoleType } from 'src/app/group-management/group-management-interfaces';

@Component({
  selector: 'app-acceptance-packages',
  templateUrl: './acceptance-packages.component.html',
  styleUrls: ['./acceptance-packages.component.less'],
  providers: [DetailsContextualService]
})
export class AcceptancePackagesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tabs') private readonly tabsElementRef: ElementRef<HTMLElement>;
  @ViewChild('filterPills') private readonly filterPillsElementRef: ElementRef<HTMLElement>;
  @ViewChild('acceptancePackageList') private readonly acceptancePackageListElementRef: ElementRef<HTMLElement>;
  @ViewChild('tableTopButton') private readonly tableTopButtonElementRef: ElementRef<HTMLElement>;

  private eventAbortController = new AbortController();
  private resizeObserver: ResizeObserver;
  private subscription: Subscription = new Subscription();

  PackageDocumentDownloadStatus = PackageDocumentDownloadStatus;
  packageDocumentDownloadStatus = signal<PackageDocumentDownloadStatus>(undefined);
  selectedPackageIds: string[] = [];
  previousTargetTab: string;
  targetTab: string;
  statusMap = packageStatusViewModelToDataModel;
  statusFilterOptions = [...this.statusMap.keys()];
  myLevelStatusMap = myLevelStatusViewModelToDataModel;
  myLevelStatusFilterOptions = [...this.myLevelStatusMap.keys()];

  tabConfigs = [
    { name: 'New', status: 'Init' },
    { name: 'In progress', status: 'InProgress' },
    { name: 'Completed', status: 'Completed' },
    { name: 'All', status: 'All' },
  ];

  statusDropDownOptions = [];

  filterSortColumns = {
    packageId: { columnName: 'Package ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    packageType: { columnName: 'Package scope', searchText: '', sortingIndex: 0, sortingOrder: '' },
    name: { columnName: 'Package name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    sitesInScope: { columnName: 'Sites in scope (Name)', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdsInScope: { columnName: 'Sites in scope (ID by customer)', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteType: { columnName: 'Site type', searchText: '', sortingIndex: 0, sortingOrder: '' },
    submittedBy: { columnName: 'Submitted by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    submittedDate: { columnName: 'Submitted date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    dueDate: { columnName: 'Due date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedBy: { columnName: 'Last modified by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date & time', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: { columnName: 'Overall status', searchText: '', sortingIndex: 0, sortingOrder: '' },
    myLevelStatus: { columnName: 'Status at my level', searchText: '', sortingIndex: 0, sortingOrder: '' },
    userRole: { columnName: 'My role', searchText: '', sortingIndex: 0, sortingOrder: '' },
    multiLevelAcceptance: { columnName: 'Package level', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };
  isFilter = false;
  public sortKey: string;
  private pagination: Pagination;
  acceptancePackageListTable: Table;
  tableElements: PackagesEntry[];
  private scripts: Scripts[] = [];
  projectLinearId: string;
  userSession: UserSession;
  totalRecords: number;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit = 50;
  offset: number;
  statusFilterShow: ReplaySubject<boolean> = new ReplaySubject(1);
  loadingTableData: boolean;
  private readonly tableLimitStorageKey = 'packages-table-limit';
  project: ProjectDetails;
  projectDetails: Promise<ProjectDetails>;
  packageInfoDialog: ComponentRef<PackageInfoDialogComponent>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sessionStorageService: SessionStorageService,
    private location: Location,
    private projectService: ProjectsService,
    private dialogService: DialogService,
    private datePipe: NullStringDatePipe,
    private packageService: AcceptancePackageService,
    private authorizationService: AuthorizationService,
    private detailsService: DetailsContextualService,
    private notificationService: NotificationService,
    private componentService: ComponentService,
  ) { }

  get roleCanCreatePackage(): Observable<boolean> {
    return this.authorizationService.isUserAuthorized(ToolPermission.CreateAcceptancePackage);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.projectLinearId = params.get('id');
      this.projectDetails = lastValueFrom(this.projectService.getProjectDetails(this.projectLinearId))
        .then(value => {
          this.project = value;
          return value;
        })
    });
    const loadedTableLimit = Number.parseInt(localStorage.getItem(this.tableLimitStorageKey));
    if (loadedTableLimit && this.limit !== loadedTableLimit) {
      this.limit = loadedTableLimit;
      if (!this.tableRowNumSelectOptions.includes(this.limit)) {
        if (this.limit < this.tableRowNumSelectOptions[0]) {
          this.tableRowNumSelectOptions.unshift(this.limit);
        } else if (this.limit > this.tableRowNumSelectOptions[this.tableRowNumSelectOptions.length - 1]) {
          this.tableRowNumSelectOptions.push(this.limit);
        } else {
          const index = this.tableRowNumSelectOptions.findIndex(item => item > this.limit);
          this.tableRowNumSelectOptions.splice(index, 0, this.limit);
        }
      }
    }

    this.userSession = this.sessionStorageService.get<UserSession>(CacheKey.userSession);
    if (this.userSession?.userType.toUpperCase() !== 'ERICSSON') {
      this.tabConfigs = this.tabConfigs.filter(tab => tab.status !== 'Init');
    }
    this.subscription.add(this.detailsService.getClosedEmitter().subscribe(item => {
      // filter package evidences based on current filter and sorting criteria when details view gets closed
      this.getPackages('All', this.limit, this.offset, true);
    })
    );
  }

  ngAfterViewInit(): void {
    const tabsDom = this.tabsElementRef.nativeElement;
    if (tabsDom) {
      const tabGroup = new TabGroup(tabsDom);
      tabGroup.init();
      this.scripts.push(tabGroup);
    }
    const filterPillsElement = this.filterPillsElementRef.nativeElement;
    this.resizeObserver = new ResizeObserver(entries => {
      const filterPillsEntry = entries.find(entry => entry.target === filterPillsElement);
      if (filterPillsEntry && filterPillsEntry.contentRect.height && this.acceptancePackageListTable) {
        this.acceptancePackageListTable.dom.table.parentElement.style.height =
          'calc(100vh - 290px - 32px - ' + filterPillsEntry.contentRect.height + 'px)';
      }
    });
    this.resizeObserver.observe(filterPillsElement);

    let targetStatus = this.route.snapshot.queryParamMap.get('acceptancePackagesTab');
    if (!targetStatus) {
      // for customer approver case, "New" tab is not there, set based on status instead of index
      targetStatus = 'InProgress';
    }
    this.openTab(targetStatus);
  }

  private initTable(): void {
    this.selectedPackageIds = [];
    if (this.acceptancePackageListTable) {
      // Remove all previous event listeners and refresh the abort controller
      this.eventAbortController.abort();
      this.eventAbortController = new AbortController();
      this.acceptancePackageListTable.destroy();
      this.acceptancePackageListTable = undefined;
    }
    if (this.pagination) {
      this.pagination.destroy();
      this.pagination.init(this.limit);
    }
    // When re-initialize a table, EDS eventually adds the 3 dot dropdown menu of previous table buttons and the table is then not rendered properly
    // Remove the dropdowns will solve the issue
    const tableTopButtonElement = this.tableTopButtonElementRef.nativeElement;
    if (tableTopButtonElement) {
      const dropdowns = Array.from(tableTopButtonElement.children).filter(element => element.classList.contains('dropdown'));
      if (dropdowns && dropdowns.length > 0) dropdowns.forEach(dropdown => dropdown.remove());
    }

    const columnsProperties = [
      {
        key: 'name',
        title: this.filterSortColumns.name.columnName,
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          td.innerHTML = `<ng-container class="package-name">${cellData}</ng-container>`;
        },
      },
      {
        key: 'packageType',
        title: this.filterSortColumns.packageType.columnName,
        sort: 'none',
      },
      {
        key: 'multiLevelAcceptance',
        title: this.filterSortColumns.multiLevelAcceptance.columnName,
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
          if (cellData !== undefined) {
            if (cellData) td.replaceChildren(document.createTextNode(PackageLevel.MultiLevel));
            else td.replaceChildren(document.createTextNode(PackageLevel.SingleLevel));
          }
        }
      },
      {
        key: 'sitesInScope',
        title: this.filterSortColumns.sitesInScope.columnName,
        sort: 'none',
        cellClass: 'column-detail',
      },
      {
        key: 'siteIdsInScope',
        title: this.filterSortColumns.siteIdsInScope.columnName,
        sort: 'none',
        cellClass: 'column-detail',
      },
      {
        key: 'customerScopeId',
        title: this.filterSortColumns.customerScopeId.columnName,
        sort: 'none',
        cellClass: 'column-detail',
      },
      {
        key: 'siteType',
        title: this.filterSortColumns.siteType.columnName,
        sort: 'none',
        cellClass: 'column-detail',
      },
      {
        key: 'userRole',
        title: this.filterSortColumns.userRole.columnName,
        cellClass: 'cell-nowrap',
        onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
          td.replaceChildren(AcceptancePackageUtils.getRoleDisplayName(cellData));
        }
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
        sort: 'none',
        cellClass: 'cell-nowrap',
        onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
          td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData, { big: true }));
        },
      },
      {
        key: 'submittedBy',
        title: this.filterSortColumns.submittedBy.columnName,
        sort: 'none',
        cellClass: 'column-created-by',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
        },
      },
      {
        key: 'submittedDate',
        title: this.filterSortColumns.submittedDate.columnName,
        sort: 'none',
        cellClass: 'column-date',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.formatDateCell(this.datePipe, cellData, td);
        },
      },
      {
        key: 'dueDate',
        title: this.filterSortColumns.dueDate.columnName,
        sort: 'none',
        cellClass: 'column-date',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any, rowIdx: number): void => {
          cellData !== null && cellData !== '0' && cellData !== this.tableElements[rowIdx].submittedDate ? TableUtils.formatDateCell(this.datePipe, cellData, td) : td.replaceChildren('NA');
        }
      },
      {
        key: 'lastModifiedBy',
        title: this.filterSortColumns.lastModifiedBy.columnName,
        sort: 'none',
        cellClass: 'column-modified-by',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
        },
      },
      {
        key: 'lastModifiedDate',
        title: this.filterSortColumns.lastModifiedDate.columnName,
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
        },
      }
    ];
    const tableHeightStyleProp = 'calc(100vh - 320px - 32px)';
    const canViewDueDate = this.targetTab !== 'Init' && !!this.userSession?.roleType.find((role: RoleType) => [
      RoleType.ProjectAdmin,
      RoleType.EricssonContributor,
      RoleType.CustomerApprover,
      RoleType.CustomerObserver,
    ].includes(role));

    const isCustomerUser = !!this.userSession?.roleType.find((role: RoleType) => [
      RoleType.CustomerApprover,
    ].includes(role));
    if (!isCustomerUser) {
      const idx = columnsProperties.findIndex(col => col.key === 'myLevelStatus');
      if (idx !== -1) {
        columnsProperties.splice(idx, 1); // Hide myLevelStatus if not approver
      }
    }

    if (!canViewDueDate) {
      const idx = columnsProperties.findIndex(col => col.key === 'dueDate');
      if (idx !== -1) {
        columnsProperties.splice(idx, 1); // Hide Due date if not approver / customer observer
      }
    }

    if (!isCustomerUser) {
      const idx = columnsProperties.findIndex(col => col.key === 'userRole');
      if (idx !== -1) {
        columnsProperties.splice(idx, 1); // Hide userRole by me if not approver or observer
      }
    }

    const isEricssonUser = !!this.userSession?.roleType.find((role: RoleType) => [
      RoleType.ProjectAdmin,
      RoleType.EricssonContributor
    ].includes(role));
    if (!isEricssonUser) {
      const idx = columnsProperties.findIndex(col => col.key === 'multiLevelAcceptance');
      if (idx !== -1) {
        columnsProperties.splice(idx, 1); // Hide multiLevelAcceptance if not project admin or ericsson contributor
      }
    }

    const acceptancePackageListTableDOM = this.acceptancePackageListElementRef.nativeElement;
    if (acceptancePackageListTableDOM) {
      const tableElement = document.createElement('table');
      tableElement.classList.add('table', 'sortable');
      acceptancePackageListTableDOM.previousElementSibling.replaceWith(tableElement);
      const selectable = this.targetTab === 'Init' || this.targetTab === 'Completed' ? 'multi' : '';
      const acceptancePackageListTable = new Table(acceptancePackageListTableDOM.previousElementSibling as HTMLElement, {
        data: this.tableElements || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        actions: false,
        selectable,
        onCreatedHead: (thead: HTMLTableCellElement): void => {
          thead.querySelectorAll('tr:first-child th').forEach((th: HTMLTableCellElement) => {
            const attrKey = 'data-key';
            if (!th.classList.contains('cell-select') && Object.keys(this.filterSortColumns).includes(th.getAttribute(attrKey))) {
              th.classList.add('is-sortable');
              th.addEventListener('click', this.addClassSortToHead, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
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
        onCreatedRow: (tr: HTMLTableRowElement, rowData: PackagesEntry): void => {
          // AP Draft status row cannot be navigated in
          if (rowData.status !== CustomerAcceptanceStatus.Draft) {
            const packageNameElement = tr.querySelector('.package-name');

            this.componentService.createRouterLink({ text: rowData.name, link: ['/projects', this.projectLinearId, 'acceptance-packages', rowData.packageId] }, packageNameElement);

            const info = document.createElement('i');
            info.classList.add('icon', 'icon-info', 'pointer', 'mr-sm');
            info.title = `Package ID: ${rowData.packageId}${rowData.externalId ? '\nExternal ID: ' + rowData.externalId : ''}`;
            info.addEventListener('click',
              () => {
                this.openPackageInfo(rowData);
              },
              { signal: this.eventAbortController.signal } as AddEventListenerOptions
            )
            packageNameElement.parentElement.prepend(info);
          } else {
            tr.classList.add('disabled-row');
            this.disableCellSelect(tr);
          }

          // Disable check box in completed tab if package is abandoned
          if (this.targetTab === 'Completed' && rowData.status === CustomerAcceptanceStatus.Abandoned) {
            this.disableCellSelect(tr);
          }

          if (this.targetTab === 'Init' || this.targetTab === 'Completed') {
            rowData.selected = this.selectedPackageIds.indexOf(rowData.packageId) > -1;
            const checkbox = tr.querySelector('input[type="checkbox"]') as HTMLInputElement;
            checkbox.checked = rowData.selected;
          }
        },
        beforeCreatedBody: (): void => {
          const attrKey = 'data-key';
          acceptancePackageListTable?.dom.table
            .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
            .forEach(cell => {
              let input = cell?.firstChild;
              const filterInputMarkerClass = 'filter-marker';
              if (input && !cell.classList.contains(filterInputMarkerClass)) {
                const attribute = cell.getAttribute(attrKey);
                if (attribute.includes('date') || attribute.includes('Date')) {
                  const datePicker = this.componentService.createDatePicker(cell);
                  input = datePicker.instance.datePicker()?.nativeElement;
                } else if (attribute === 'status') {
                  const newInputElement = input as HTMLInputElement;
                  newInputElement.type = 'search';
                  newInputElement.setAttribute('list', 'table-filter-input-datalist-status');

                  this.statusFilterShow.subscribe(showFilter => {
                    if (!showFilter) {
                      newInputElement.style.display = 'none';
                    } else {
                      newInputElement.style.display = 'inline-block';
                    }
                  });

                  const dataList = document.createElement('datalist');
                  dataList.setAttribute('id', 'table-filter-input-datalist-status');

                  this.setDatalistOptions4Status(dataList);

                  newInputElement.parentElement.appendChild(dataList);
                  newInputElement.addEventListener('keyup', (event) => {
                    const currVal = newInputElement.value;
                    let found = false;

                    for (let i = 0; i < this.statusDropDownOptions.length; i++) {
                      if (this.statusDropDownOptions[i].toLowerCase().includes(currVal.toLowerCase())) {
                        found = true;
                        break;
                      }
                    }

                    if (!found) {
                      newInputElement.value = '';
                    }
                  }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
                } else if (attribute === 'myLevelStatus') {
                  addSearchDropDownOptions(input as HTMLInputElement, attribute, this.myLevelStatusFilterOptions);
                } else if (attribute === 'multiLevelAcceptance') {
                  addSearchDropDownOptions(input as HTMLInputElement, attribute, Object.values(PackageLevel));
                }

                input?.addEventListener(
                  'change',
                  (event: KeyboardEvent | CustomEvent) => {
                    const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                    const attributeValue = inputTarget.value || event.detail;

                    if (!checkValueLength(attributeValue, {}, this.notificationService)) {
                      return;
                    }

                    this.filterSortColumns[attribute].searchText = attributeValue;

                    Object.keys(this.filterSortColumns).forEach(filterKey => {
                      if (this.filterSortColumns[filterKey].searchText != '') {
                        this.isFilter = true;
                      }
                    });
                    this.offset = resetOffsetValue;
                    this.getPackages(this.targetTab, this.limit, this.offset);
                  },
                  { signal: this.eventAbortController.signal } as AddEventListenerOptions
                );
                cell.classList.add(filterInputMarkerClass);
                if (!Object.keys(this.filterSortColumns).includes(cell?.getAttribute(attrKey)) && input) {
                  // No filtering if column is not specified in filterSortColumns
                  input.remove();
                  cell.removeAttribute(attrKey);
                }
              }
            });
          // Overwrite EDS table onChangedFilter to remove default filter behavior.
          // The signature of the assigned function must match with the original signature.
          if (acceptancePackageListTable?.onChangedFilter) {
            acceptancePackageListTable.onChangedFilter = (a: any, b: any): void => {
              /* do nothing */
            };
          }
        },
      });
      acceptancePackageListTable.init();
      TableUtils.overwriteEDSTableFeatureTableInfo(acceptancePackageListTable, this);
      this.acceptancePackageListTable = acceptancePackageListTable;
      this.pagination = this.acceptancePackageListTable['pagination'];
      if (this.pagination) {
        const paginationDom = this.pagination['dom'].paginationGroup;
        if (this.tableElements) this.pagination.update(this.tableElements?.length);
        paginationDom.addEventListener('paginationChangePage', this.paginationChange, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
        paginationDom.addEventListener('paginationChangeSelect', this.paginationChange, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
      }
      this.acceptancePackageListTable['pagination'] = undefined;
      this.scripts.push(acceptancePackageListTable);
      this.scripts.push(this.pagination);

      this.acceptancePackageListTable.dom.table.addEventListener('selectRow', (event: CustomEvent): void => {
        event.detail.data.selected = true;
        this.updatePackageSelection(event.detail.data);
      }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);

      this.acceptancePackageListTable.dom.table.addEventListener('unselectRow', (event: CustomEvent): void => {
        event.detail.data.selected = false;
        this.updatePackageSelection(event.detail.data);
      }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
    }
  }

  paginationChange = (event): void => {
    const setOffsetLimit = {
      offset: event.detail.state.currentPage * event.detail.state.numPerPage - event.detail.state.numPerPage,
      limit: event.detail.state.numPerPage,
    };
    if (this.limit !== setOffsetLimit.limit || this.offset !== setOffsetLimit.offset) {
      if (this.limit !== setOffsetLimit.limit) {
        localStorage.setItem(this.tableLimitStorageKey, setOffsetLimit.limit);
      }
      this.limit = setOffsetLimit.limit;
      this.offset = setOffsetLimit.offset;
      this.getPackages(this.targetTab, this.limit, this.offset);
    }
  };

  addClassSortToHead = (event): void => {
    const key = event.srcElement.getAttribute('data-key');
    if (event.srcElement.classList.contains('asc')) {
      event.srcElement.classList.remove('asc');
      event.srcElement.classList.add('desc');
      this.filterSortColumns[key].sortingOrder = 'desc';
    } else if (event.srcElement.classList.contains('desc')) {
      event.srcElement.classList.add('asc');
      event.srcElement.classList.remove('desc');
      this.filterSortColumns[key].sortingOrder = 'asc';
    } else {
      let sibling = event.srcElement.parentNode.firstElementChild;
      while (sibling) {
        if (sibling.nodeType === 1 && sibling !== event.srcElement) {
          const datKey = sibling.getAttribute('data-key');

          if (datKey != null) {
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
    this.getPackages(this.targetTab, this.limit, this.offset);
  };

  ngOnDestroy(): void {
    this.scripts.forEach(script => {
      script.destroy();
    });

    this.eventAbortController.abort();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.detailsService.close();
    if (this.packageInfoDialog?.instance?.dialog) {
      this.packageInfoDialog.instance.dialog.hide();
      this.packageInfoDialog.instance.dialog.destroy();
    }
  }

  /**
   * Opens a tab based on the status
   * @param status selected status to display
   * @param limit and offset are set for pagination
   */
  public openTab(status: string): void {
    // If the same tab is clicked, no need to refresh the table
    if (status === this.targetTab) {
      return;
    }

    if (!this.limit) {
      this.limit = 30;
    }

    this.offset = 0;
    this.previousTargetTab = this.targetTab;
    this.targetTab = status;
    // re-initialize the table if one of the previous or current tables shall be selectable
    if (!this.previousTargetTab
      || !((this.previousTargetTab === 'InProgress' && this.targetTab === 'All') || (this.previousTargetTab === 'All' && this.targetTab === 'InProgress'))
    ) this.initTable();

    this.statusFilterShow.next(true);

    if (this.targetTab === 'Completed') this.checkPackageDocumentDownloadStatus();

    this.clearSelectedFilter('status', false);
    this.updateStatusFilterDatalist(document.getElementById('table-filter-input-datalist-status'));

    // When switching the tab, remove existing sorting option and add default sorting on lastModifiedDate desc
    Object.keys(this.filterSortColumns).forEach(key => {
      if (key === 'lastModifiedDate') {
        this.filterSortColumns[key].sortingOrder = 'desc';
      } else {
        this.filterSortColumns[key].sortingOrder = '';
      }
    });
    if (this.acceptancePackageListTable) {
      const tableHeaderCells = this.acceptancePackageListTable.dom.table.querySelectorAll('th');
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
    }

    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: { acceptancePackagesTab: status },
    });
    this.location.replaceState(urlTree.toString());
    this.getPackages(status, this.limit, this.offset, true);
  }

  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  /**
   * Clears the input of one filter criterion
   * @param currentFilter name of the filter criterion to be cleared
   */
  public clearSelectedFilter(currentFilter: string, forceFiltering: boolean = true): void {
    let showPill = false;
    this.filterSortColumns[currentFilter].searchText = '';
    if (forceFiltering) {
      this.getPackages(this.targetTab, this.limit, this.offset);
    }

    Object.keys(this.filterSortColumns).forEach(filterKey => {
      if (this.filterSortColumns[filterKey].searchText != '') {
        showPill = true;
      }
    });
    this.isFilter = showPill;
    const attrKey = 'data-key';
    this.acceptancePackageListTable?.dom.table
      .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach(filterCell => {
        if (currentFilter === filterCell.getAttribute(attrKey)) {
          filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
        }
      });
  }

  /**
   * Clears the input of all filter criteria
   */
  public clearAllFilters(): void {
    Object.keys(this.filterSortColumns).forEach(filterKey => (this.filterSortColumns[filterKey].searchText = ''));
    const attrKey = 'data-key';
    this.acceptancePackageListTable?.dom.table
      .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach(filterCell => {
        filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
      });
    this.isFilter = false;
    this.getPackages(this.targetTab, this.limit, this.offset);
  }

  /**
   * Open dialog and display package details.
   * @param pkg to use
   */
  openPackageInfo(pkg: PackagesEntry): void {
    const dialogRef = this.dialogService.createDialog(PackageInfoDialogComponent, pkg);
    this.packageInfoDialog = dialogRef;
  }

  /**
   * gets the list of packages depending upon the selected tab
   * @param selectedTab selected tab
   * @param limit number of records per page
   * @param offset starting index of the records
   */
  public getPackages(selectedTab: string, limit: number, offset: number, resetPagination: boolean = false): void {
    let status = '';
    let filterSort = '';
    let sortBy = '';
    Object.keys(this.filterSortColumns).forEach(key => {
      if (this.filterSortColumns[key].sortingOrder != '') {
        sortBy = `${this.filterSortColumns[key].sortingOrder}(${key})`;
      }
    });

    if (selectedTab !== 'All' && this.filterSortColumns.status.searchText === '') {
      status = this.statusMap.get(selectedTab);
    } else {
      if (this.filterSortColumns.status.searchText !== '') {
        const filteredStatus = this.filterSortColumns.status.searchText.toUpperCase() === 'PENDING' ? ['Pending approval'] :
          this.filterSortColumns.status.searchText.toUpperCase() === 'REWORKED' ? ['Reworked'] :
            this.statusFilterOptions.filter(statusOption =>
              statusOption.toUpperCase().includes(this.filterSortColumns.status.searchText.toUpperCase())
            );
        if (filteredStatus.length === 0) {
          this.tableElements = [];
          this.acceptancePackageListTable.update(this.tableElements);
          return;
        }
        status = filteredStatus.map(status => this.statusMap.get(status)).join();
      }
    }
    if (!!status) {
      filterSort = filterSort.concat(`&status=${status}`);
    }

    if (this.isFilter) {
      let isDateFilter = false;
      Object.entries(this.filterSortColumns).forEach(filterEntry => {
        const [filterKey, filter] = filterEntry;
        if (filter.searchText != '') {
          if (filterKey === 'status') { }
          else if (filterKey?.toLowerCase().includes('date')) {
            const dateString = new Date(filter.searchText).toISOString().slice(0, 10);
            filterSort = filterSort.concat(`&${filterKey}=${dateString}`);
            isDateFilter = true;
          }
          else if (filterKey === 'multiLevelAcceptance') {
            const isMultiLevelAcceptance = filter.searchText === PackageLevel.MultiLevel;
            filterSort = filterSort.concat(`&${filterKey}=${isMultiLevelAcceptance}`);
          }
          else if (filterKey === 'myLevelStatus') {
            const filteredStatus = this.myLevelStatusFilterOptions.filter(statusOption =>
              statusOption.toUpperCase().includes(filter.searchText.toUpperCase())
            );
            if (filteredStatus.length !== 0) {
              const myLevelStatus = filteredStatus.map(status => this.myLevelStatusMap.get(status)).join();
              filterSort = filterSort.concat(`&${filterKey}=${myLevelStatus}`);
            }
          }
          else filterSort = filterSort.concat(`&${filterKey}=${filter.searchText}`);
        }
      });
      if (isDateFilter) {
        const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
        filterSort = filterSort.concat(`&timeZone=${timeZone}`);
      }
    }
    if (sortBy) {
      filterSort = filterSort.concat(`&sort=${sortBy}`);
    }

    this.loadingTableData = true;
    this.projectService.getAcceptancePackageList(this.projectLinearId, filterSort, limit, offset).subscribe({
      next: (acceptancePackageList: GetPackagesResponse) => {
        this.totalRecords = acceptancePackageList.totalRecords;
        this.tableElements = acceptancePackageList.results;
        if (this.tableElements) this.acceptancePackageListTable?.update(this.tableElements);
        if (resetPagination) {
          this.pagination.state.currentPage = 1;
          this.pagination.state.numPerPage = this.limit;
          this.pagination.state.hasNextPage = false;
          this.pagination.state.hasPreviousPage = false;
          this.pagination.state.pageClicked = 0;
          this.pagination.state.numPages = 0;
          this.pagination.state.numEntries = 0;
        }
        this.pagination.update(this.totalRecords);
        this.loadingTableData = false;
      },
      error: error => {
        this.loadingTableData = false;
        // Do something to handle error
      },
    });
  }

  onSubmitPackages(): void {
    const status = 'Customer New-Pending Approval';

    const payload: SubmitAcceptancePackagesRequest = {
      status,
      packageIds: this.acceptancePackageListTable.selected.map((acceptancePackage: PackagesEntry) => acceptancePackage.packageId)
    };

    this.subscription.add(
      this.projectService.submitAcceptancePackages(payload).subscribe({
        next: () => {
          this.notificationService.showNotification({
            title: 'Acceptance packages successfully submitted!',
          });
          this.getPackages(this.targetTab, this.limit, this.offset);
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = '';
          if (error.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // server-side error
            errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
          }
          this.notificationService.showNotification({
            title: `Error when submitting the acceptance packages!`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        },
      })
    );
  }

  isPackageCreationAllowed(project: ProjectDetails): boolean {
    return this.isPackageCreationSupported(project?.sourceTool as SourceTool) && project.packageCreationAllowed;
  }

  isPackageCreationSupported(sourceTool: SourceTool): boolean {
    return this.projectService.isProjectPackageManagementInternal(sourceTool)
  }

  isSubmitPackageSupported(sourceTool: SourceTool): boolean {
    return this.projectService.isProjectPackageSubmissionSupported(sourceTool);
  }

  private updateStatusFilterDatalist(dataList: HTMLElement): void {
    if (dataList) {
      while (dataList.firstChild) {
        dataList.removeChild(dataList.lastChild);
      }

      this.setDatalistOptions4Status(dataList);
    }
  }

  private setDatalistOptions4Status(dataList: HTMLElement): void {
    if (this.statusMap.get(this.targetTab)) {
      const statusOpts = this.statusMap.get(this.targetTab).split(',');
      this.statusDropDownOptions = statusOpts.map((v) => {
        return AcceptancePackageUtils.getStatus(v)
      });
    } else {
      // this is tab status
      this.statusDropDownOptions = this.statusFilterOptions.filter(opt => opt !== 'Init' && opt !== 'InProgress' && opt !== 'Completed');
    }

    this.statusDropDownOptions.filter((item, pos, self) => {
      return self.indexOf(item) === pos;
    }).forEach(opt => {
      const option = document.createElement('option');
      option.setAttribute('value', opt);
      dataList.appendChild(option);
    });
  }

  private disableCellSelect(tr: HTMLTableRowElement): void {
    const td = tr.querySelector('.cell-select');
    if (td) {
      const checkboxInput = td.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const checkboxLabel = td.querySelector('label');
      // Disable the checkbox to avoid selection when 'Select all' is clicked
      checkboxInput.disabled = true;
      // Hide the checkbox itself
      checkboxLabel.style.display = 'none';
    }
  };

  private updatePackageSelection(data: PackagesEntry): void {
    const selected = data.selected;
    const selectedId = data.packageId;

    // if selected and not already in the array, add it
    if (selected && !this.selectedPackageIds.includes(selectedId)) {
      this.selectedPackageIds.push(selectedId);
    }

    // if not selected and in the array, remove it
    const index = this.selectedPackageIds.indexOf(selectedId);
    if (!selected && index > -1) {
      this.selectedPackageIds.splice(index, 1);
    }
  }

  private checkPackageDocumentDownloadStatus(): void {
    this.subscription.add(this.projectService.checkPackageDocumentDownloadStatus(this.projectLinearId).subscribe({
      next: (statusResp: GetPackageDocumentDownloadStatusResponse) => {
        const status = statusResp.status;
        this.packageDocumentDownloadStatus.set(status);
      },
      error: () => {
        this.notificationService.showNotification({
          title: `Error while checking status of package documents!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      }
    }));
  }

  generatePackageDocument(event: MouseEvent): void {
    const maxPackageCount = 50;
    if (this.selectedPackageIds.length > maxPackageCount) {
      this.notificationService.showNotification({
        title: `You can select upto ${maxPackageCount} packages to download at one go.`,
        icon: 'icon-triangle-warning',
        stripeColor: 'orange',
      });
    } else {
      const targetElement = event.target as HTMLButtonElement;
      targetElement.disabled = true;
      this.subscription.add(this.projectService.generatePackageDocumentDownload(this.projectLinearId, this.selectedPackageIds).subscribe({
        next: () => {
          this.packageDocumentDownloadStatus.set(PackageDocumentDownloadStatus.IN_PROGRESS);
          this.notificationService.showNotification({
            title: `Thank you for your request and we are preparing the document now. We shall notify you via email when the document is ready for downloading.`,
          });
        },
        error: () => {
          targetElement.disabled = false;
          this.notificationService.showNotification({
            title: `Error while sending request to generate package documents!`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        }
      }));
    }
  }

  downloadPackageDocument(event: MouseEvent): void {
    const targetElement = event.target as HTMLButtonElement;
    const targetElementOriginalText: string = targetElement.innerText;
    const targetElementTextNode = Array.from(targetElement.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    this.subscription.add(this.projectService.downloadPackageDocument(this.projectLinearId).subscribe({
      next: (result => {
        if (result.type === HttpEventType.Sent) {
          targetElement.disabled = true;
          targetElementTextNode.nodeValue = `${targetElementOriginalText.slice(0, targetElementOriginalText.length - 12)}...preparing`;
        }
        if (result.type === HttpEventType.DownloadProgress) {
          const downloadProgress = `${result.total ? `${parseFloat((result.loaded / result.total * 100).toFixed(0))}%` : `${this.projectService.formatBytes(result.loaded, 0)}`}`;
          targetElementTextNode.nodeValue = `${targetElementOriginalText.slice(0, targetElementOriginalText.length - downloadProgress.length - 3)}...${downloadProgress}`;
        }
        if (result.type === HttpEventType.Response) {
          targetElementTextNode.nodeValue = targetElementOriginalText;
          targetElement.disabled = false;
          const contentDisposition = result.headers.get('content-disposition');
          // retrieve the file name and remove potential quotes from it
          const filename = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim().replaceAll('"', '');
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          const defaultFileName = 'package-documents.zip'
          link.download = filename || defaultFileName;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.packageDocumentDownloadStatus.set(PackageDocumentDownloadStatus.COMPLETE);
          this.notificationService.showNotification({
            title: 'Package documents successfully downloaded!',
            description: `Downloading of package documents of project ${this.projectLinearId} completed successfully.`
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElementTextNode.nodeValue = targetElementOriginalText;
        targetElement.disabled = false;
        this.notificationService.showNotification({
          title: `Error when downloading package documents!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      },
    }));
  }
}
