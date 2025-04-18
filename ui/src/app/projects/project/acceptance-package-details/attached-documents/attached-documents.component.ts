import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, OnDestroy, ViewContainerRef, SimpleChanges, SimpleChange, OnChanges, Output, EventEmitter, ComponentRef, signal, input } from '@angular/core';
import { Pagination, Table } from '@eds/vanilla';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { CustomerAcceptanceStatus, Evidence, EvidenceRemark, GetEvidenceResponse, PackageEvidenceFilter, ProjectDetails, EvidenceStatusUpdate, UserSession, SourceTool } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { AddNewDocumentDialogComponent } from '../../../details-dialog/add-new-document-dialog/add-new-document-dialog.component';
import { ReferenceEvidenceDialogComponent } from '../../../details-dialog/reference-evidence-dialog/reference-evidence-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { DetailsContextualService } from '../details-contextual.service';
import { HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { DeleteDocumentDialogComponent } from './delete-document-dialog/delete-document-dialog.component';
import TableUtils from '../table-utilities';
import { SourceReportDialogComponent } from './source-report-dialog/source-report-dialog.component';
import { AcceptancePackageService, RoleInPackage } from '../../acceptance-package.service';
import { evidenceStatusViewModelToDataModel, myLevelStatusViewModelToDataModel } from '../../status-mapping';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { EvidencesCarouselComponent } from './evidences-carousel/evidences-carousel.component';
import { addSearchDropDownOptions, checkValueLength, resetOffsetValue } from 'src/app/shared/table-utilities';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { ComponentService } from 'src/app/shared/component.service';

@Component({
  selector: 'app-attached-documents',
  templateUrl: './attached-documents.component.html',
  styleUrls: ['./attached-documents.component.less'],
  providers: [DetailsContextualService]
})
export class AttachedDocumentsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('attachedEvidencesTableElement') private readonly attachedEvidencesTableElementRef: ElementRef<HTMLElement>;
  @ViewChild('pagination') readonly paginationRef: ElementRef<HTMLElement>;

  @Input() projectDetails: ProjectDetails;
  @Input() packageStatus: CustomerAcceptanceStatus;
  @Input() isPackageCompleted: boolean;
  @Output() isUpdatePackageStatus = new EventEmitter<boolean>();

  readonly isMultiLevelAcceptance = input<boolean>();
  private _tableElements: Evidence[];
  get tableElements(): Evidence[] { return this._tableElements };
  private set tableElements(tableData) {
    this._tableElements = tableData;
    this.evidencesUpdate.emit();
  };
  private evidencesUpdate = new EventEmitter<unknown>;
  private lastPageChangeRequest: 'next' | 'prev';
  private subscription: Subscription = new Subscription();
  public attachedEvidencesTable: Table;
  pagination: Pagination;
  columnsProperties: any;
  public isFilter = false;
  public limit: number = 10;
  public offset: number = 0;
  public totalRecords: number;
  selectable = '';
  private scripts: Scripts[] = [];
  private eventAbortController = new AbortController();
  public searchText: string;
  public packageId: string;
  public projectId: string;
  public userSession: UserSession;
  disabledSubmission: boolean = true;
  disabledContribution: boolean = true;
  isAddReferenceDocumentAllowed = signal(false);
  isApprover: boolean = false;
  isMultiCheck: boolean;
  public filterSortColumns = {
    name: { columnName: 'Name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    tag: { columnName: 'Tag', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: { columnName: 'Overall status', searchText: '', sortingIndex: 0, sortingOrder: '' },
    myLevelStatus: { columnName: 'Status at my level', searchText: '', sortingIndex: 0, sortingOrder: '' },
    remarks: { columnName: 'Remarks', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdBy: { columnName: 'Uploaded by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdDate: { columnName: 'Upload date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  }
  public confirmedFilters = this.filterSortColumns;
  statusMap = evidenceStatusViewModelToDataModel;
  statusFilterOptions = [...this.statusMap.keys()];
  myLevelStatusMap = myLevelStatusViewModelToDataModel;
  myLevelStatusFilterOptions = [...this.myLevelStatusMap.keys()];
  tableUtils = TableUtils;
  SourceTool = SourceTool;

  constructor(
    private projectsService: ProjectsService,
    private packageService: AcceptancePackageService,
    private componentService: ComponentService,
    private dialogService: DialogService,
    private sessionStorage: SessionStorageService,
    private route: ActivatedRoute,
    private detailsService: DetailsContextualService,
    private viewContainerRef: ViewContainerRef,
    private datePipe: NullStringDatePipe,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.userSession = this.sessionStorage.get(CacheKey.userSession);
    this.subscription.add(this.detailsService.getClosedEmitter().subscribe(item => {
      // filter package evidences based on current filter and sorting criteria when details view gets closed
      this.filterPackageEvidence();
    })
    );

    this.packageId = this.route.snapshot.paramMap.get('id');
    this.projectId = this.route.snapshot.parent.parent.paramMap.get('id');

    this.subscription.add(this.packageService.currentPackageUser.subscribe(pkgUsr => {
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

      this.subscription.add(
        this.packageService.updatePackageStatus.subscribe((event) => {
          // Handle the emitted event from the LineItemDetailsComponent
          this.isUpdatePackageStatus.emit(true);
        })
      );
      this.filterPackageEvidence(true);
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes || !changes.packageStatus) {
      return;
    }

    const packageStatus: SimpleChange = changes.packageStatus
    if (packageStatus.firstChange || packageStatus.previousValue !== packageStatus.currentValue) {
      this.isAddReferenceDocumentAllowed.set(false);
      if (packageStatus.currentValue === CustomerAcceptanceStatus.CustomerNewPendingApproval || packageStatus.currentValue === CustomerAcceptanceStatus.CustomerReworkedPendingApproval) {
        firstValueFrom(this.packageService.currentPackageUser).then(packageUser => {
          if (packageUser.userRole === RoleInPackage.EricssonContributor)
            this.isAddReferenceDocumentAllowed.set(true);
          else
            firstValueFrom(this.packageService.currentPackageUserActionInProgress).then((isInProgress) => {
              this.disabledSubmission = !isInProgress;
              this.isAddReferenceDocumentAllowed.set(isInProgress);
            });
        });
        this.disabledContribution = true;
      }
      else {
        this.disabledSubmission = true;

        if (this.projectDetails?.sourceTool === SourceTool.siteTracker && packageStatus.currentValue === CustomerAcceptanceStatus.CustomerReworked) {
          this.disabledContribution = true;
        } else {
          this.disabledContribution = false;
        }
      }
    }
  }

  ngAfterViewInit(): void {
    this.selectable = !this.isPackageCompleted && !this.isMultiCheck && this.isApprover ? 'multi' : '';

    const columnsProperties = [
      {
        key: 'name',
        title: this.filterSortColumns.name.columnName,
        onCreatedCell: (td: HTMLTableCellElement,
          cellData: string,
          rowData
        ): void => {
          td.innerHTML = `<a class="lineItem-Id">${cellData}</a>`;
        },
      },
      {
        key: 'tag',
        title: this.filterSortColumns.tag.columnName,
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
        key: 'createdBy',
        title: this.filterSortColumns.createdBy.columnName,
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
        },
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
    ];

    if (!this.isApprover || !this.isMultiLevelAcceptance()) {
      const idx = columnsProperties.findIndex(col => col.key === 'myLevelStatus');

        if (idx !== -1) {
          columnsProperties.splice(idx, 1); // Hide myLevelStatus if not approver
        }
    }

    const tableHeightStyleProp = 'calc(100vh - 400px - 32px)';
    const attachedEvidencesTableDOM = this.attachedEvidencesTableElementRef.nativeElement;
    if (attachedEvidencesTableDOM) {
      const table = new Table(attachedEvidencesTableDOM, {
        data: this.tableElements || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        selectable: this.selectable,
        scroll: true,
        actions: true,
        onCreatedHead: (thead): void => {
          const attrKey = 'data-key';
          thead.querySelectorAll('tr:first-child th').forEach((th) => {
            if (th.dataset.key !== undefined) {
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

          thead.querySelectorAll('tr:last-child th>div>i').forEach((evidence) => {
            evidence.addEventListener('click', (event) => {
              const attribute = event.srcElement.getAttribute('id');
              const attributeValue = event.srcElement.parentNode.previousSibling.value;
              this.filterSortColumns[attribute].searchText = attributeValue;
              this.filterPackageEvidence();
            }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
          });
        },
        onCreatedRow: (tr: HTMLTableRowElement, rowData: Evidence): void => {
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
            tr.querySelector('.lineItem-Id').addEventListener('click', (event) => {
              this.openEvidenceDetails(rowData);
            }, { signal: this.eventAbortController.signal } as AddEventListenerOptions)
          );
        },
        onCreatedActionsCell: (td: HTMLTableCellElement, rowData: Evidence): void => {
          let htmlText = `<i class="icon icon-download-save"></i>`;
          if (
            // Ericsson contributor
            (this.userSession.userType?.toLowerCase() === 'ericsson'
              && (this.userSession.roleType.includes(RoleType.EricssonContributor)
              || this.userSession.roleType.includes(RoleType.ProjectAdmin)
            )
              && [CustomerAcceptanceStatus.CustomerNew,
                CustomerAcceptanceStatus.Ready,
                CustomerAcceptanceStatus.CustomerReworked,
                CustomerAcceptanceStatus.Draft].includes(rowData.status)
            )
            // Customer: An evidence is allowed to be soft deleted if it's an reference document and was uploaded by current user
            || (rowData.status === CustomerAcceptanceStatus.CustomerAcceptanceNotRequired
              && rowData.createdBy?.toLowerCase() === this.userSession.signum.toLowerCase()
            )
            && ![
              CustomerAcceptanceStatus.CustomerApproved,
              CustomerAcceptanceStatus.AcceptanceDocumentInitiate,
              CustomerAcceptanceStatus.AcceptanceDocumentReady,
              CustomerAcceptanceStatus.AcceptanceDocumentSent,
              CustomerAcceptanceStatus.AcceptanceDocumentSendFailed,
              CustomerAcceptanceStatus.CustomerRejected,
              CustomerAcceptanceStatus.DeemedApproved,
              CustomerAcceptanceStatus.Abandoned,
            ].includes(this.packageStatus)
          ) {
            htmlText = htmlText + `<i class="icon icon-trashcan"></i>`;
          }
          td.innerHTML = htmlText;
          td.querySelector('.icon-download-save').addEventListener('click', (evt) => {
            this.download(rowData);
          }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
          td.querySelector('.icon-trashcan')?.addEventListener('click', (evt) => {
            this.deleteEvidence(rowData.internalId);
          }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
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
                addSearchDropDownOptions(input as HTMLInputElement, attribute, this.statusFilterOptions, 'package-evid');
              } else if (attribute === 'remarks') {
                addSearchDropDownOptions(input as HTMLInputElement, attribute, Object.values(EvidenceRemark), 'package-evid');
              } else if (attribute === 'myLevelStatus') {
                addSearchDropDownOptions(input as HTMLInputElement, attribute, this.myLevelStatusFilterOptions, 'package-evid');
              }

              input?.addEventListener('change', (event: KeyboardEvent | CustomEvent) => {
                const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                const attributeValue = inputTarget.value || event.detail;

                if (!checkValueLength(attributeValue, {}, this.notificationService)) {
                  return;
                }

                this.filterSortColumns[attribute].searchText = attributeValue;
                this.offset = resetOffsetValue;
                this.filterPackageEvidence();
              }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
              cell.classList.add(filterInputMarkerClass);
            }
          });
          // Overwrite EDS table onChangedFilter to remove default filter behavior.
          // The signature of the assigned function must match with the original signature.
          if (table?.onChangedFilter) { table.onChangedFilter = (a: any, b: any): void => { /* do nothing */ } };
        },
      });

      table.init();
      TableUtils.overwriteEDSTableFeatureTableInfo(table, this);
      this.attachedEvidencesTable = table;
      this.pagination = this.attachedEvidencesTable['pagination'];
      if (this.pagination) {
        const paginationDom = this.pagination['dom'].paginationGroup;
        this.pagination.update(this.totalRecords);
        paginationDom.addEventListener('paginationChangePage', this.paginationChange, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
        paginationDom.addEventListener('paginationChangeSelect', this.paginationChange, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
      }
      this.attachedEvidencesTable['pagination'] = undefined;
      this.scripts.push(this.attachedEvidencesTable);
    }

    if (this.attachedEvidencesTable) {
      const tableHeaderCells = this.attachedEvidencesTable.dom.table.querySelectorAll('th');
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
   * This function is adding sorting manually
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
    this.filterPackageEvidence();
  };

  /**
   * Gets the current package evidences page
   */
  private getPackageEvidence(): void {
    let sortBy = '';
    let filterSort = '';
    const sortKey = Object.keys(this.confirmedFilters).find(key => this.confirmedFilters[key].sortingOrder != '');
    if (sortKey) {
      sortBy = `${this.confirmedFilters[sortKey].sortingOrder}(${sortKey})`;
    }
    if (!!sortBy) {
      filterSort = filterSort.concat(`&sort=${sortBy}`);
    }
    this.projectsService.getPackageAdditionalEvidences(this.packageId, this.limit,
      this.offset, filterSort).subscribe({
        next: (evidences: GetEvidenceResponse) => {
          this.totalRecords = evidences.totalRecords;
          this.tableElements = evidences.results;
          const allStatus = evidences.results.map(data => {
            return data.status;
          });
          this.isMultiCheck = allStatus.every(val => val === CustomerAcceptanceStatus.CustomerAcceptanceNotRequired);
          if (this.isApprover && this.isMultiCheck) {
            const thead = this.attachedEvidencesTableElementRef.nativeElement.firstElementChild;
            const checkboxInput = thead.querySelector('input[type="checkbox"]') as HTMLInputElement;
            const checkboxLabel = thead.querySelector('label') as HTMLElement;
            const clickableDiv = thead.querySelector('div') as HTMLElement;
            if (checkboxInput) {
              checkboxInput.disabled = true;
            }
            if (checkboxLabel) {
              checkboxLabel.style.display = 'none';
            }
            if (clickableDiv) {
              clickableDiv.style.display = 'none';
            }
          }

          if (this.attachedEvidencesTable) {
            this.attachedEvidencesTable.update(this.tableElements);
          }

          if (this.pagination) {
            this.pagination.update(evidences.totalRecords);
          }
        },
        error: (error) => {
          this.tableElements = [];
          // Do something to handle error
        },
      });
  }

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
      this.filterPackageEvidence();
    }
  };

  /**
   * Search the document
   */
  public searchPackageEvidences(requestBody: PackageEvidenceFilter, initialFilter: boolean): void {
    let sortBy = '';
    let filterSort = '';
    const sortKey = Object.keys(this.confirmedFilters).find(key => this.confirmedFilters[key].sortingOrder != '');
    if (sortKey) {
      sortBy = `${this.confirmedFilters[sortKey].sortingOrder}(${sortKey})`;
    }
    if (!!sortBy) {
      filterSort = filterSort.concat(`&sort=${sortBy}`);
    }
    this.projectsService.getPackageAdditionalEvidencesBySearch(requestBody, this.packageId, this.limit, this.offset, filterSort)
      .subscribe({
        next: (data: GetEvidenceResponse) => {
          if (initialFilter && data.totalRecords === 0) {
            this.clearSelectedFilter('status');
          } else {
            this.tableElements = data.results;
            this.attachedEvidencesTable.update(this.tableElements);
            this.pagination.update(data.totalRecords);
          }
        },
        error: (err) => {
          this.tableElements = [];
          this.attachedEvidencesTable.update(this.tableElements);
          console.error(err.error.responseMessageDescription);
        },
      })
  }

  public filterPackageEvidence(initialFilter = false): void {
    this.isFilter = false;
    let onlySorting = true;
    const checkSorting = Object.keys(this.filterSortColumns).find(key => this.filterSortColumns[key].searchText != '');
    if (checkSorting) {
      onlySorting = false;
      this.isFilter = true;
    }
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    if (onlySorting) {
      this.getPackageEvidence();
    }
    else {
      const searchedStatus = this.confirmedFilters.status.searchText;
      const searchedMyLevelStatus = this.confirmedFilters.myLevelStatus.searchText;
      let name: string;
      let status: string;
      let myLevelStatus: string;
      let createdDate: string;
      let lastModifiedDate: string;
      let tag: string;
      let remarks: string;
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
      const createdBy = this.confirmedFilters.createdBy.searchText != '' ? `${this.confirmedFilters.createdBy.searchText}` : undefined;
      if (this.confirmedFilters.createdDate.searchText != '') {
        createdDate = this.confirmedFilters.createdDate.searchText;
      }
      if (this.confirmedFilters.lastModifiedDate.searchText != '') {
        lastModifiedDate = this.confirmedFilters.lastModifiedDate.searchText;
      }
      if (this.confirmedFilters.tag.searchText != '') {
        tag = `${this.confirmedFilters.tag.searchText}`;;
      }
      if (this.confirmedFilters.remarks.searchText != '') {
        remarks = `${this.confirmedFilters.remarks.searchText}`;;
      }
      const filterPost: PackageEvidenceFilter = {
        name,
        tag,
        statuses: status?.length > 0 ? status.split(',') : undefined,
        myLevelStatuses: myLevelStatus?.length > 0 ? myLevelStatus.split(',') : undefined,
        remarks,
        createdBy,
        createdDate,
        lastModifiedDate
      }

      this.searchPackageEvidences(filterPost, initialFilter);
    }
  }

  /**
   * Downloads the details.
   * @param rowData complete row details
   */
  public download(rowData: Evidence): void {
    this.projectsService.downloadEvidence(rowData.internalId).subscribe({
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

  /**
   * changes the page and updates the table
   * @param event event handlers
   */
  public changedPaginationHandler(event): void {
    this.limit = event.limit;
    this.offset = event.offset;
    this.attachedEvidencesTable.update(this.tableElements);
  }

  /**
   * open dialog and display add new document form
   */
  public addNew(): void {
    const dialogRef = this.dialogService.createDialog(
      AddNewDocumentDialogComponent,
      { packageId: this.packageId, projectId: this.projectId }
    );
    dialogRef.instance.dialogResult.subscribe({
      next: (response: boolean) => {
        if (response) {
          if (this.isApprover &&
            (this.packageStatus === CustomerAcceptanceStatus.CustomerReworked || this.packageStatus === CustomerAcceptanceStatus.CustomerReworkedPendingApproval)) {
            this.filterSortColumns.status.searchText = 'Reworked';
          }
          this.filterPackageEvidence();
        }
      },
      error: () => {
        console.log('error');
      }
    })
  }

  /**
   * open dialog to upload multiple evidences with reference document tag
   */
  public addReferenceDocument(): void {
    const dialogRef = this.dialogService.createDialog(
      ReferenceEvidenceDialogComponent,
      { packageId: this.packageId, projectId: this.projectId }
    );
    this.subscription.add(dialogRef.instance.dialogResult.subscribe((result: boolean) => {
      if (!!result) {
        this.filterPackageEvidence();
      }
    }));
  }

  /**
   * @param permission to check
   */
  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  /**
   * Open dialog and display the evidence details carousel.
   * @param evidence to use
   */
  openEvidenceDetails(evidence: Evidence): void {
    const componentRef = this.detailsService.open(
      EvidencesCarouselComponent,
      this.viewContainerRef,
      {
        selectedEvidence: evidence,
      }
    ) as ComponentRef<EvidencesCarouselComponent>;
    componentRef.setInput('packageId', this.packageId);
    componentRef.setInput('projectId', this.projectId);
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
    // Workaround change detection by manually setting inputs on desired change
    this.subscription.add(this.evidencesUpdate.subscribe(() => {
      componentRef.instance.selectedEvidence =
        this.pagination.state.pageClicked === 'left'
          || (this.pagination.state.pageClicked === this.tableElements.length.toString() && this.lastPageChangeRequest === 'prev')
          ? this.tableElements[this.tableElements.length - 1]
          : this.tableElements.find(() => true)
        ;
      componentRef.instance.evidences = this.tableElements;
      componentRef.instance.offset = this.offset;
    }));
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.detailsService.close();
    this.eventAbortController.abort();
  }

  /**
   * Clears the input of one filter criterion.
   * @param currentFilter name of the filter criterion to be cleared
   */
  public clearSelectedFilter(currentFilter: string): void {
    let showPill = false;
    this.filterSortColumns[currentFilter].searchText = '';
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    this.filterPackageEvidence();
    Object.keys(this.confirmedFilters).forEach(filterkey => {
      if (this.confirmedFilters[filterkey].searchText != '') {
        showPill = true;
      }
    });
    const attrKey = 'data-key';
    this.attachedEvidencesTable?.dom.table.querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach((filterCell) => {
        if (currentFilter === filterCell.getAttribute(attrKey)) {
          filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
        }
      });
    this.isFilter = showPill;
  }

  /**
   * Clears the input of all filter criteria
   */
  public clearAllFilters(): void {
    Object.keys(this.filterSortColumns).forEach(filterKey => this.filterSortColumns[filterKey].searchText = '');
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    const filterBody = this.attachedEvidencesTableElementRef.nativeElement.querySelector('thead>tr.filters');
    filterBody.querySelectorAll('tr td input').forEach((inputFilter) => {
      (inputFilter as HTMLInputElement).value = '';
    });
    this.filterPackageEvidence();
    this.isFilter = false;
  }

  public acceptAndRejectPackageEvidences(buttonType: string): void {
    const acceptIds = [];
    let statusValue = '';
    let remarkValue = '';
    if (buttonType == 'Reject') {
      statusValue = CustomerAcceptanceStatus.CustomerRejected;
      remarkValue = EvidenceRemark.MINOR;
    }
    else {
      statusValue = CustomerAcceptanceStatus.CustomerApproved;
      remarkValue = EvidenceRemark.OK;
    }
    if (this.attachedEvidencesTable.selected.length > 0) {
      this.attachedEvidencesTable.selected.forEach((rowData: Evidence) => {
        const ids = {
          id: rowData.internalId,
          remarks: remarkValue
        }
        acceptIds.push(ids);
      });
      const requestBody = {
        status: statusValue,
        evidences: acceptIds
      };

      this.updatePackageEvidencesStatus(requestBody, buttonType);
    }
    else {
      this.updatePackageEvidencesStatus(null, buttonType);
    }
  }

  updatePackageEvidencesStatus(requestBody: EvidenceStatusUpdate, buttonType: string): void {
    const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    if (requestBody != null) {
      this.projectsService.updatePackageEvidencesStatus(this.packageId, requestBody).subscribe({
        next: (data: GetEvidenceResponse) => {
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
          this.getPackageEvidence();
        },
        error: (err) => {
          dialogMessage.instance.show = APICallStatus.Error;
          let additionalMessage = '';
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
          } else {
            additionalMessage = '\n Please follow the FAQ doc for further steps.';
          }
          dialogMessage.instance.statusMessage = 'Error when updating the package evidences!' + additionalMessage;
          dialogMessage.instance.dialogueTitle = 'Failed to submit';
          dialogMessage.instance.additionalMessage = '';
          dialogMessage.instance.actionOn.next('FAQ');

          console.error(err);
        },
      });
    }
    else {
      dialogMessage.instance.show = APICallStatus.Error;
      dialogMessage.instance.statusMessage = 'Please select the package evidences';
    }
  }

  public deleteEvidence(evidenceId: string): void {
    const dialogRef = this.dialogService.createDialog(DeleteDocumentDialogComponent);

    this.subscription.add(dialogRef.instance.dialogResult.subscribe((confirmed) => {
      if (confirmed) {
        this.projectsService.deleteEvidence(evidenceId).subscribe({
          next: () => {
            this.getPackageEvidence();
          },
          error: (error) => {
            this.notificationService.showNotification({
              title: 'Error when deleting evidence!',
              description: 'Click to open the FAQ doc for further steps.'

            }, true);
          }
        });
      }
    }));
  }

  public sourceReportAsEvidence(): void {
    const dialogRef = this.dialogService.createDialog(SourceReportDialogComponent, {
      projectId: this.projectId,
      parentId: this.packageId,
      parentType: 'AcceptancePackage',
    });

    this.subscription.add(dialogRef.instance.dialogResult.subscribe((result: boolean) => {
      if (!!result) {
        this.filterPackageEvidence();
      }
    }));
  }
}
