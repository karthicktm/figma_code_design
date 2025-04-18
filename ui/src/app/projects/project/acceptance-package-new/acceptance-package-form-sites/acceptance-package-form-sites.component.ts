import { AfterViewInit, Component, effect, ElementRef, input, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Table, Pagination } from '@eds/vanilla';
import { ReplaySubject, Subscription, PartialObserver } from 'rxjs';
import { FilterSortAttr } from 'src/app/group-management/group-management-interfaces';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectStructureShort, ProjectStructureShortResponse } from 'src/app/projects/projects.interface';
import { checkValueLength, resetOffsetValue } from 'src/app/shared/table-utilities';
import { FormDataService } from '../form-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-acceptance-package-form-sites',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './acceptance-package-form-sites.component.html',
  styleUrl: './acceptance-package-form-sites.component.less'
})
export class AcceptancePackageFormSitesComponent implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild('multiSiteTable')
  readonly multiSiteElementRef: ElementRef<HTMLElement>;
  @Input() packageForm: FormGroup;
  @Input() doLITableReset: ReplaySubject<boolean>;
  @Input() isEdit: boolean = false;

  selectedOnly = input<boolean>();

  private subscription: Subscription = new Subscription();
  private scripts: Scripts[] = [];

  loadingMultiSites: boolean;
  filterColumns = {
    networkSiteName: { columnName: 'Site name', searchText: '', maxLength: 1000, infoText: 'Enter comma separated names to search multiple sites' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', maxLength: 1000, infoText: 'Enter comma separated IDs to search multiple sites' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '' },
    siteType: { columnName: 'Site type', searchText: '' }
  }

  table: Table;
  tableElements: ProjectStructureShort[];
  columnsProperties: any[];
  totalRecords: number;
  pagination: Pagination;
  limit: number = 50;
  offset: number = 0;
  projectId: string;
  public packageId: string;
  isFilter = false;
  multiSites: FormControl<string[]>;
  public confirmedFilters = this.filterColumns;

  constructor(private networkRollOutService: NetworkRollOutService,
    private route: ActivatedRoute,
    private sharedService: FormDataService,
    private notificationService: NotificationService,
  ) {
    effect(() => {
      const selectedOnly = this.selectedOnly();
      this.retrieveSites();
    });
  }

  ngOnInit(): void {
    if (this.isEdit) {
      this.projectId = this.route.snapshot.parent.paramMap.get('id');
      this.packageId = this.route.snapshot.paramMap.get('id');
    }
    else {
      this.projectId = this.route.snapshot.paramMap.get('id');
    }
    const step2FormGroup = this.packageForm.controls.step2 as FormGroup;
    this.multiSites = step2FormGroup.controls.multiSites as FormControl<string[]>;
  }

  ngAfterViewInit(): void {
    this.columnsProperties = [
      {
        key: 'internalId',
        title: 'Id',
        hidden: 'hidden',
      },
      {
        key: 'networkSiteName',
        title: this.filterColumns.networkSiteName.columnName,
        cellStyle: 'white-space: nowrap',
      },
      {
        key: 'siteIdByCustomer',
        title: this.filterColumns.siteIdByCustomer.columnName,
      },
      {
        key: 'siteNameByCustomer',
        title: this.filterColumns.siteNameByCustomer.columnName,
      },
      {
        key: 'siteType',
        title: this.filterColumns.siteType.columnName,
      },
    ];
    const tableHeightStyleProp = 'calc(100vh - 400px - 100px)';
    const tableDOM = this.multiSiteElementRef.nativeElement;
    if (tableDOM) {
      const table = new Table(tableDOM, {
        data: this.tableElements || [],
        columns: this.columnsProperties,
        height: tableHeightStyleProp,
        scroll: true,
        selectable: 'multi',
        onCreatedHead: (thead: HTMLTableCellElement): void => {
          thead.querySelectorAll('tr:first-child th').forEach((th: HTMLTableCellElement) => {
            if (th.classList.contains('cell-select')) {
              const dropdown = th.querySelector('.dropdown');
              dropdown?.remove();
            }
          });
        },
        beforeCreatedBody: (): void => {
          const attrKey = 'data-key';
          table?.dom.table
            .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
            .forEach(cell => {
              const input = cell?.firstChild;
              const filterInputMarkerClass = 'filter-marker';
              if (input && !cell.classList.contains(filterInputMarkerClass)) {
                const attribute = cell.getAttribute(attrKey);

                if (attribute === 'siteType') {
                  this.networkRollOutService.getProjectStructureHeader(this.projectId).subscribe(neHeaders => {
                    const options = neHeaders['siteTypes'] ? neHeaders['siteTypes'].split(',') : null;

                    if (options && options.length > 0) {
                      const newInputElement = input as HTMLInputElement;
                      newInputElement.type = 'search';
                      newInputElement.setAttribute('list', `table-filter-input-datalist-${attribute}`);

                      const dataList = document.createElement('datalist');
                      dataList.setAttribute('id', `table-filter-input-datalist-${attribute}`);

                      options.forEach(opt => {
                        const option = document.createElement('option');
                        option.setAttribute('value', opt);
                        dataList.appendChild(option);
                      });

                      newInputElement.parentElement.appendChild(dataList);
                      newInputElement.addEventListener('keyup', (event) => {
                        const currVal = newInputElement.value;
                        let found = false;

                        for (let i = 0; i < options.length; i++) {
                          if (options[i].toLowerCase().includes(currVal.toLowerCase())) {
                            found = true;
                            break;
                          }
                        }

                        if (!found) {
                          newInputElement.value = '';
                        }
                      });
                    }
                  });
                }

                if (this.filterColumns[attribute]?.infoText && this.filterColumns[attribute]?.infoText.length > 0) {
                  const newInputElement = input as HTMLInputElement;
                  newInputElement.classList.add('with-icon');
                  const iconDiv = document.createElement('div');
                  iconDiv.classList.add('suffix', 'icon-inside');
                  iconDiv.title = this.filterColumns[attribute].infoText;
                  const iconInfo = document.createElement('i');
                  iconInfo.classList.add('icon', 'icon-info');
                  iconDiv.appendChild(iconInfo);
                  newInputElement.parentElement.appendChild(iconDiv);
                }

                input.addEventListener(
                  'change',
                  (event: KeyboardEvent) => {
                    const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                    const attribute = inputTarget.parentElement.getAttribute(attrKey);
                    const attributeValue = inputTarget.value;

                    if (!checkValueLength(attributeValue, this.filterColumns[attribute], this.notificationService)) {
                      return;
                    }

                    this.filterColumns[attribute].searchText = attributeValue;
                    Object.keys(this.filterColumns).forEach(filterKey => {
                      if (this.filterColumns[filterKey].searchText != '') {
                        this.isFilter = true;
                      }
                    });
                    this.offset = resetOffsetValue;
                    this.retrieveSites();
                  },
                  false
                );
                cell.classList.add(filterInputMarkerClass);
              }
            });
          // Overwrite EDS table onChangedFilter to remove default filter behavior.
          // The signature of the assigned function must match with the original signature.
          if (table?.onChangedFilter) {
            table.onChangedFilter = (a: any, b: any): void => {
              /* do nothing */
            };
          }
        },
        onCreatedRow: (tr: HTMLTableRowElement, rowData: ProjectStructureShort): void => {
          const checkbox = tr.querySelector('input[type="checkbox"]') as HTMLInputElement;
          const checked = this.matchChecklist(rowData.internalId);
          checkbox.checked = checked;
          if (checked) {
            rowData.selected = true;
          }
          else {
            rowData.selected = false;
          }
          this.updateChecklistItem(rowData);
        },
      });
      table.init();

      this.sharedService.sendData(this.multiSites.value);

      // add event listener for row selection
      tableDOM.addEventListener('selectRow', (event: CustomEvent): void => {
        event.detail.data.selected = true;
        this.updateChecklistItem(event.detail.data);
      });

      // add event listener for row deselection
      tableDOM.addEventListener('unselectRow', (event: CustomEvent): void => {
        event.detail.data.selected = false;
        this.updateChecklistItem(event.detail.data);
      });
      this.table = table;
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
  }

  ngOnDestroy(): void {
    this.scripts.forEach(script => {
      script.destroy();
    });
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  paginationChange = (event): void => {
    const setOffsetLimit = {
      offset: (event.detail.state.currentPage * event.detail.state.numPerPage) - event.detail.state.numPerPage,
      limit: event.detail.state.numPerPage
    }
    if (this.limit !== setOffsetLimit.limit || this.offset !== setOffsetLimit.offset) {
      this.limit = setOffsetLimit.limit;
      this.offset = setOffsetLimit.offset;
      this.retrieveSites();
    }
  }

  retrieveSites(): void {
    this.toggleLoadingMultiSites(true);
    this.isFilter = false;
    const filterAttr: FilterSortAttr[] = [];
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterColumns));
    Object.keys(this.filterColumns).forEach(filterKey => {
      if (this.filterColumns[filterKey].searchText !== '') {
        this.isFilter = true;
        filterAttr.push({
          key: filterKey,
          value: this.filterColumns[filterKey].searchText
        });
      }
    });

    const observer: PartialObserver<ProjectStructureShortResponse> = {
      next: (data: ProjectStructureShortResponse) => {
        this.toggleLoadingMultiSites(false);
        this.totalRecords = data.totalRecords;
        this.tableElements = data.results;
        this.table.update(this.tableElements);
        this.pagination.update(this.totalRecords);
      },
      error: (err) => {
        this.toggleLoadingMultiSites(false);
        this.totalRecords = 0;
        this.tableElements = [];
        this.table.update(this.tableElements);
        this.pagination.update(this.totalRecords);

        this.notificationService.showNotification({
          title: 'Error when retrieving site list!'
        });
      },
    };
    if (this.selectedOnly()) {
      const siteIds: string[] = this.multiSites.value;
      this.subscription.add(
        this.networkRollOutService.getProjectStructureByIds(siteIds, this.limit, this.offset, filterAttr).subscribe(observer)
      );
    } else {
      if (!this.isEdit) {
        filterAttr.push({
          key: 'lineItemStatus',
          value: 'Ready'
        });
      }
      this.subscription.add(
        this.networkRollOutService.getProjectStructureShort(this.limit, this.offset, this.projectId, filterAttr).subscribe(observer)
      );
    }

  }

  updateChecklistItem(data: ProjectStructureShort): void {
    let isChanged = false;
    const siteIdsControl = this.multiSites;
    const selected = data.selected;
    const siteId = data.internalId;
    // if selected and not already in the array, add it
    if (selected && !siteIdsControl.value.includes(siteId)) {
      siteIdsControl.setValue([...siteIdsControl.value, siteId]);
      isChanged = true;
    }

    // if not selected and in the array, remove it
    const siteIdIndex = siteIdsControl.value.indexOf(siteId);
    if (!selected && siteIdIndex > -1) {
      siteIdsControl.value.splice(siteIdIndex, 1);
      siteIdsControl.setValue(siteIdsControl.value);
      isChanged = true;

      const step3FormGroup = this.packageForm.controls.step3 as FormGroup;
      const lineItemIds = step3FormGroup.controls.lineItemIds as FormArray;

      if (lineItemIds.value.length > 0) { // In case of back navigation, old checklist line items should be cleared off when site(s) deselected
        lineItemIds.patchValue([]);
      }

      this.doLITableReset.next(true); // This is signalled to clear line item table in next step, next step should restart a fresh
    }

    if (isChanged) this.sharedService.sendData(siteIdsControl.value);
  }

  matchChecklist(id: string): boolean {
    const foundValue = this.multiSites.value?.find(item => item === id);
    if (foundValue !== undefined) {
      return true;
    }
    else {
      return false;
    }
  }

  private toggleLoadingMultiSites(loading: boolean): void {
    this.loadingMultiSites = loading;
  }

  /**
   * Clears the input of all filter criteria
   */
  public clearAllFilters(): void {
    Object.keys(this.filterColumns).forEach(filterKey => this.filterColumns[filterKey].searchText = '');
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterColumns));
    const filterBody = this.multiSiteElementRef.nativeElement.querySelector('thead>tr.filters');
    filterBody.querySelectorAll('tr td>input').forEach((inputFilter) => {
      (inputFilter as HTMLInputElement).value = '';
    });
    this.isFilter = false;
    this.retrieveSites();
  }

  /**
   * Clears the input of one filter criterion
   * @param currentFilter name of the filter criterion to be cleared
   */
  public clearSelectedFilter(currentFilter: string): void {
    let showPill = false;
    this.filterColumns[currentFilter].searchText = '';
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterColumns));
    Object.keys(this.confirmedFilters).forEach(filterkey => {
      if (this.confirmedFilters[filterkey].searchText != '') {
        showPill = true;
      }
    });
    const attrKey = 'data-key';
    this.table?.dom.table.querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach((filterCell) => {
        if (currentFilter === filterCell.getAttribute(attrKey)) {
          (filterCell.firstChild as HTMLInputElement).value = '';
        }
      });

    this.isFilter = showPill;
    this.retrieveSites();
  }
}
