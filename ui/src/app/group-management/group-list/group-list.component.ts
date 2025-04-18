import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Pagination, Table } from '@eds/vanilla';
import { Subscription } from 'rxjs';
import { DialogService } from 'src/app/portal/services/dialog.service';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import { GroupCreateDialogComponent } from '../group-create-dialog/group-create-dialog.component';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { FilterSortAttr, Group, GroupList, GroupManagementRoleType } from '../group-management-interfaces';
import { GroupManagementService } from '../group-management.service';
import RoleTitleMapping from 'src/app/auth/role-mapping.utils';
import { addSearchDropDownOptions, checkValueLength, resetOffsetValue } from 'src/app/shared/table-utilities';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ComponentService } from 'src/app/shared/component.service';

/**
 * Map that defines the mapping between presented text of a
 * group status to the model field name `isSoftDeleted`.
 */
const groupStatusViewModelToDataModel = new Map([
  ['Active', false],
  ['Inactive', true]
]);

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.less']
})
export class GroupListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('group') readonly groupTableElementRef: ElementRef<HTMLElement>;
  private scripts: Scripts[] = [];
  tableElements: Group[];
  private pagination: Pagination;
  limit: number = 10;
  offset: number = 0;
  loadingTableData: boolean;
  totalRecords: number;
  private eventAbortController = new AbortController();
  private subscription: Subscription = new Subscription();
  table: Table;
  public isFilter = false;
  public filterSortColumns = {
    groupName: { columnName: 'Group name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    projectAdmins: { columnName: 'Group admin(s)', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date & time', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedBy: { columnName: 'Last modified by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    roleType: { columnName: 'Role type', searchText: '', sortingIndex: 0, sortingOrder: '' },
    isSoftDeleted: { columnName: 'Is soft deleted', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  constructor(
    private groupManagementService: GroupManagementService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private datePipe: NullStringDatePipe,
    private notificationService: NotificationService,
    private componentService: ComponentService,
  ) { }

  ngOnInit(): void {
    this.retrieveGroups();
  }

  ngAfterViewInit(): void {
    const columnsProperties = [
      {
        key: 'groupName',
        title: this.filterSortColumns.groupName.columnName,
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          td.innerHTML = `<ng-container class="group-name">${cellData}</ng-container>`;
        },
      },
      {
        key: 'roleType',
        title: this.filterSortColumns.roleType.columnName,
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          RoleTitleMapping.assignTitleForGivenRole(cellData, td)
        }
      },
      {
        key: 'isSoftDeleted',
        title: this.filterSortColumns.isSoftDeleted.columnName,
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          td.replaceChildren(this.getStatusTag(cellData));
        }
      },
      {
        key: 'projectAdmins',
        title: this.filterSortColumns.projectAdmins.columnName,
      },
      {
        key: 'lastModifiedBy',
        title: this.filterSortColumns.lastModifiedBy.columnName,
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

    const tableHeightStyleProp = 'calc(100vh - 300px)';
    const groupTableDOM = this.groupTableElementRef.nativeElement as HTMLElement;
    if (groupTableDOM) {
      const table = new Table(groupTableDOM, {
        data: this.tableElements || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        actions: true,
        onCreatedHead: (thead): void => {
          thead.querySelectorAll('tr:first-child th').forEach((th) => {
            if (th.dataset.key !== undefined) {
              th.classList.add('is-sortable');
              th.addEventListener('click', this.addClassSortToHead, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
            }
          });
        },
        beforeCreatedBody: (): void => {
          const attrKey = 'data-key';
          table?.dom.table.querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`).forEach((cell) => {
            let input = cell?.firstChild;
            const filterInputMarkerClass = 'filter-marker';
            if (input && !cell.classList.contains(filterInputMarkerClass)) {
              const attribute = cell.getAttribute(attrKey);
              if (attribute.includes('date') || attribute.includes('Date')) {
                const datePicker = this.componentService.createDatePicker(cell);
                input = datePicker.instance.datePicker()?.nativeElement;
              } else if (attribute === 'isSoftDeleted') {
                addSearchDropDownOptions(input as HTMLInputElement, attribute, ['Active', 'Inactive']);
              } else if (attribute === 'roleType') {
                const options = Object.values(GroupManagementRoleType).filter((v) => isNaN(Number(v)));
                addSearchDropDownOptions(input as HTMLInputElement, attribute, options);
              }

              input?.addEventListener('change', (event: KeyboardEvent | CustomEvent) => {
                const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                const attributeValue = inputTarget.value || event.detail;

                if (!checkValueLength(attributeValue, {}, this.notificationService)) {
                  return;
                }

                this.filterSortColumns[attribute].searchText = attributeValue;
                this.offset = resetOffsetValue;
                this.retrieveGroups();
              }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
              cell.classList.add(filterInputMarkerClass);
            }
          });
          // Overwrite EDS table onChangedFilter to remove default filter behavior.
          // The signature of the assigned function must match with the original signature.
          if (table?.onChangedFilter) { table.onChangedFilter = (a: any, b: any): void => { /* do nothing */ }; };
        },
        onCreatedRow: (tr: HTMLTableRowElement, rowData: Group): void => {
          const packageNameElement = tr.querySelector('.group-name');
          this.componentService.createRouterLink({ text: rowData.groupName, link: ['/group-management', rowData.groupId] }, packageNameElement);
        }
      });
      table.init();
      TableUtils.overwriteEDSTableFeatureTableInfo(table, this);
      this.table = table;
      this.pagination = this.table['pagination'];
      this.scripts.push(this.table);
      this.scripts.push(this.pagination);
      if (this.pagination) {
        const paginationDom = this.pagination['dom'].paginationGroup;
        this.pagination.update(this.totalRecords);
        paginationDom.addEventListener('paginationChangePage', this.paginationChange, false);
        paginationDom.addEventListener('paginationChangeSelect', this.paginationChange, false);
      }
      this.table['pagination'] = undefined;

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
    this.retrieveGroups();
  };

  paginationChange = (event): void => {
    const setOffsetLimit = {
      offset: (event.detail.state.currentPage * event.detail.state.numPerPage) - event.detail.state.numPerPage,
      limit: event.detail.state.numPerPage
    };
    if (this.limit !== setOffsetLimit.limit || this.offset !== setOffsetLimit.offset) {
      this.limit = setOffsetLimit.limit;
      this.offset = setOffsetLimit.offset;
      this.retrieveGroups();
    }
  }

  openEditGroup(groupId: string): void {
    this.router.navigate([`/group-management/${groupId}`], { relativeTo: this.route });
  }

  retrieveGroups(): void {
    const filterSortAttr: FilterSortAttr[] = [];
    this.isFilter = false;
    // If no another column is selected for sorting, default sorting on lastModifiedDate
    let sortAttr = {
      key: 'sort',
      value: 'desc(lastModifiedDate)'
    };
    Object.keys(this.filterSortColumns).forEach(filterKey => {
      if (this.filterSortColumns[filterKey].searchText !== '') {
        this.isFilter = true;
        if (filterKey === 'isSoftDeleted') {
          const statusMap = this.mapStatus(this.filterSortColumns[filterKey].searchText);
          if (statusMap) filterSortAttr.push({
            key: 'isSoftDeleted',
            value: statusMap
          });
        }
        else {
          filterSortAttr.push({
            key: filterKey,
            value: this.filterSortColumns[filterKey].searchText
          });
        }
      }
      if (this.filterSortColumns[filterKey].sortingOrder !== '') {
        sortAttr = {
          key: 'sort',
          value: `${this.filterSortColumns[filterKey].sortingOrder}(${filterKey})`
        };
      }
    });
    filterSortAttr.push(sortAttr);
    this.loadingTableData = true;
    this.subscription.add(this.groupManagementService.getGroupList(this.limit, this.offset, filterSortAttr).subscribe({
      next: (res: GroupList) => {
        this.tableElements = res.results;
        this.table.update(this.tableElements);
        this.totalRecords = res.totalRecords;
        this.pagination.update(this.totalRecords);
        this.loadingTableData = false;
      },
      error: (error) => {
        this.loadingTableData = false;
        console.error(error);
      },
    }));
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  /**
  * Clears the input of one filter criterion
  * @param currentFilter name of the filter criterion to be cleared
  */
  public clearSelectedFilter(currentFilter: string): void {
    this.filterSortColumns[currentFilter].searchText = '';
    this.retrieveGroups();
    const attrKey = 'data-key';
    this.table?.dom.table.querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach((filterCell) => {
        if (currentFilter === filterCell.getAttribute(attrKey)) {
          filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
        }
      });
  }

  /**
  * Clears the input of all filter criteria
  */
  public clearAllFilters(): void {
    Object.keys(this.filterSortColumns).map(filterKey => this.filterSortColumns[filterKey].searchText = '');
    const filterBody = this.table?.dom.table.querySelector('thead>tr.filters');
    filterBody.querySelectorAll('tr td input').forEach((inputFilter) => {
      (inputFilter as HTMLInputElement).value = '';
    });
    this.isFilter = false;
    this.retrieveGroups();
  }

  public groupCreate(): void {
    const dialogRef = this.dialogService.createDialog(
      GroupCreateDialogComponent
    );

    const dialogSubscription = dialogRef.instance.dialogResult.subscribe(result => {
      if (!!result) {
        this.openEditGroup(result);
      }
    });

    this.subscription.add(dialogSubscription);
  }

  private getStatusTag(isSoftDeleted: boolean): HTMLElement {
    const kdb = document.createElement('kbd');
    kdb.classList.add(
      'tag', 'big',
    );
    if (!isSoftDeleted) {
      kdb.appendChild(document.createTextNode('Active'));
      kdb.classList.add('green');
    } else {
      kdb.appendChild(document.createTextNode('Inactive'));
      kdb.classList.add('red');
    }
    return kdb;
  }

  private mapStatus(searchText: string): string {
    const filteredStatusOption = Array.from(groupStatusViewModelToDataModel.keys()).filter(statusOption =>
      statusOption.toUpperCase().startsWith(searchText.toUpperCase())
    );
    const filteredStatus = filteredStatusOption.map(status => groupStatusViewModelToDataModel.get(status));

    if (filteredStatus.length === 0) return 'unknown';

    // filtered statuses contain all possible statuses, no need to add status filter in query
    if (filteredStatus.length === groupStatusViewModelToDataModel.size) return undefined;
    return filteredStatus.join();
  }
}
