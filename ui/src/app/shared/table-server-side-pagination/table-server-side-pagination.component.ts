import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, InputSignal, OnDestroy, OnInit, Output, ViewChild, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pagination, Table } from '@eds/vanilla';
import { ColumnsProps } from '@eds/vanilla/table/Table';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import { Observable, ReplaySubject, Subscription, catchError, tap, throwError } from 'rxjs';
import { PageInfo } from 'src/app/projects/projects.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { checkValueLength, resetOffsetValue, updateNoDataRowInTable } from '../table-utilities';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ComponentService } from '../component.service';

export interface FilterSortConfiguration {
  [key: string]: {
    columnName: string;
    searchText: string;
    sortingIndex: number;
    sortingOrder: 'asc' | 'desc' | '';
    options?: string[];
    showFilter?: ReplaySubject<boolean>;
    minLength?: number;
    maxLength?: number;
    infoText?: string;
  };
}

export interface TableOptions {
  actions?: boolean;
  selectable?: string;
  onSelectRow?: (event: CustomEvent) => void;
  onUnSelectRow?: (event: CustomEvent) => void;
  onCreatedActionsCell?: (td: HTMLTableCellElement, rowData: Object) => void;
  onCreatedRow?: (tr: HTMLTableRowElement, rowData: Object) => void;
}

export enum TableType {
  Compact = 'compact',
  Tiny = 'tiny',
}

@Component({
  selector: 'app-table-server-side-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule
  ],
  templateUrl: './table-server-side-pagination.component.html',
  styleUrl: './table-server-side-pagination.component.less'
})
export class TableServerSidePaginationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('table') private readonly tableElementRef: ElementRef<HTMLElement>;
  loadingTableData = signal(false);
  @Input()
  readonly filterSortColumns: FilterSortConfiguration;
  appliedFilterSortColumns = signal<FilterSortConfiguration>({});
  isFilter = signal(false);
  @Input()
  readonly tableLimitStorageKey: string;
  readonly tableSettingsStorageKey = input<string>();
  readonly tableName = input<string>();
  readonly tableType = input<TableType>();
  @Input()
  readonly options: TableOptions;

  /**
   * Column properties according to https://eds.internal.ericsson.com/components/table/api
   */
  @Input()
  readonly columnsProperties: (ColumnsProps & any)[];

  fetchPageHandler: InputSignal<(limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<any> | void> = input.required();
  @Input()
  limit = 10;
  @Input()
  offset = 0;
  totalRecords: number = 0;
  @Input()
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  @Input()
  tableHeightStyleProp = 'calc(100vh - 290px - 32px)';
  @Output() isDataLoaded: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private notificationService: NotificationService,
    private componentService: ComponentService,
  ) {
    effect(() => {
      const fetchPageHandler = this.fetchPageHandler();
      if (fetchPageHandler && this.table) this.fetchData();
    },
    {
      allowSignalWrites: true
    });
  }

  private data: any[];
  get tableElements(): any[] {
    return this.data || []
  }
  table: Table;
  private pagination: Pagination;

  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    if (this.tableLimitStorageKey) {
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
    }

    this.appliedFilterSortColumns.set(this.filterSortColumns || {});
  }

  ngAfterViewInit(): void {
    let columnsProperties = this.columnsProperties;
    const tableHeightStyleProp = this.tableHeightStyleProp;
    const tableOptions = this.options || {};

    const tableDOM = this.tableElementRef.nativeElement;
    if (tableDOM) {
      const tableSettingsStorageKey = this.tableSettingsStorageKey();
      const loadedTableSettings: ColumnsProps[] = tableSettingsStorageKey ? JSON.parse(localStorage.getItem(tableSettingsStorageKey)) : [];
      loadedTableSettings?.forEach((setting) => {
        const columnProperty = this.columnsProperties.find((prop) => setting.key === prop.key);
        if (columnProperty) {
          // Merge column property that eventually contains functions with loaded setting.
          Object.assign(columnProperty, setting);
        }
      });
      columnsProperties = TableUtils.sortUserOrderedColumns(this.columnsProperties, loadedTableSettings);
      const table = new Table(tableDOM, Object.assign({
        data: this.data || [],
        columns: columnsProperties,
        resize: true,
        height: tableHeightStyleProp,
        onCreatedHead: (thead: HTMLTableCellElement): void => {
          thead.querySelectorAll('tr:first-child th').forEach((th: HTMLTableCellElement) => {
            const attrKey = 'data-key';
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
        beforeCreatedBody: (): void => {
          const attrKey = 'data-key';
          table?.dom.table
            .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
            .forEach(cell => {
              let input = cell?.firstChild;
              const filterInputMarkerClass = 'filter-marker';
              if (!Object.keys(this.filterSortColumns).includes(cell?.getAttribute(attrKey)) && input) {
                // No filtering if column is not specified in filterSortColumns
                input.remove();
                cell.removeAttribute(attrKey);
              } else if (input && !cell.classList.contains(filterInputMarkerClass)) {
                const attribute = cell.getAttribute(attrKey);
                const newInputElement = input as HTMLInputElement;

                newInputElement.setAttribute('id', `table-filter-input-text-${attribute}`);

                if (this.filterSortColumns[attribute].showFilter) {
                  this.filterSortColumns[attribute].showFilter.subscribe(isVisible => {
                    if (!isVisible) {
                      newInputElement.style.display = 'none';
                    } else {
                      newInputElement.style.display = 'inline-block';
                    }
                  });
                }

                if (attribute.includes('date') || attribute.includes('Date')) {
                  const datePicker = this.componentService.createDatePicker(cell);
                  input = datePicker.instance.datePicker()?.nativeElement;
                } else if (this.filterSortColumns[attribute].options && this.filterSortColumns[attribute].options.length > 0) {
                  newInputElement.type = 'search';
                  // to fix issue related to edge browser where saved info hinders the rendering of options
                  newInputElement.autocomplete = 'off';
                  newInputElement.setAttribute('list', `table-filter-input-datalist-${attribute}`);

                  const dataList = document.createElement('datalist');
                  dataList.setAttribute('id', `table-filter-input-datalist-${attribute}`);

                  this.filterSortColumns[attribute].options.forEach(opt => {
                    const option = document.createElement('option');
                    option.setAttribute('value', opt);
                    dataList.appendChild(option);
                  });

                  newInputElement.parentElement.appendChild(dataList);
                  newInputElement.addEventListener('keyup', (event) => {
                    const currVal = newInputElement.value;
                    let found = false;

                    for (let i = 0; i < this.filterSortColumns[attribute].options.length; i++) {
                      if (this.filterSortColumns[attribute].options[i].toLowerCase().includes(currVal.toLowerCase())) {
                        found = true;
                        break;
                      }
                    }

                    if (!found) {
                      newInputElement.value = '';
                    }
                  });
                } else if (this.filterSortColumns[attribute].infoText && this.filterSortColumns[attribute].infoText.length > 0) {
                  newInputElement.classList.add('with-icon');
                  const iconDiv = document.createElement('div');
                  iconDiv.classList.add('suffix', 'icon-inside');
                  iconDiv.title = this.filterSortColumns[attribute].infoText;
                  const iconInfo = document.createElement('i');
                  iconInfo.classList.add('icon', 'icon-info');
                  iconDiv.appendChild(iconInfo);
                  newInputElement.parentElement.appendChild(iconDiv);
                }

                input?.addEventListener(
                  'change',
                  (event: KeyboardEvent | CustomEvent) => {
                    const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                    const attributeValue = inputTarget.value || event.detail;

                    if (!checkValueLength(attributeValue, this.filterSortColumns[attribute], this.notificationService)) {
                      return;
                    }

                    this.filterSortColumns[attribute].searchText = attributeValue;

                    this.appliedFilterSortColumns.set({ ...this.filterSortColumns });
                    const isFilterGiven = !!Object.keys(this.filterSortColumns).find(filterKey => this.filterSortColumns[filterKey].searchText != '');
                    this.isFilter.set(isFilterGiven);
                    this.offset = resetOffsetValue;
                    this.fetchData();
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

          const tableHeaderCells = table?.dom.table.querySelectorAll('th');
          tableHeaderCells.forEach(th => {
            if (th.classList.contains('is-sortable')) {
              const dataKey = th.getAttribute('data-key');
              th.classList.remove('asc');
              th.classList.remove('desc');
              Object.keys(this.filterSortColumns).find(field => {
                return field === dataKey && this.filterSortColumns[field].sortingOrder != '';
              }) && th.classList.add(this.filterSortColumns[dataKey].sortingOrder);
            }
          })
        },
        onChangedSettings: (settings: ColumnsProps[]): void => {
          const tableSettingsStorageKey = this.tableSettingsStorageKey();
          if (tableSettingsStorageKey) localStorage.setItem(tableSettingsStorageKey, JSON.stringify(settings));
        },
      }, tableOptions));
      table.init();

      TableUtils.overwriteEDSTableFeatureTableInfo(table, this);
      this.pagination = table['pagination'];
      if (this.pagination) {
        const paginationDom = this.pagination['dom'].paginationGroup;
        this.pagination.update(this.totalRecords);
        paginationDom.addEventListener('paginationChangePage', this.paginationChange, false);
        paginationDom.addEventListener('paginationChangeSelect', this.paginationChange, false);
      }
      table['pagination'] = undefined;

      this.table = table;

      if (tableOptions.selectable) {
        if (tableOptions.onSelectRow) {
          tableDOM.addEventListener('selectRow', tableOptions.onSelectRow);
        }

        if (tableOptions.onUnSelectRow) {
          tableDOM.addEventListener('unselectRow', tableOptions.onUnSelectRow);
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private addClassSortToHead = (event: CustomEvent): void => {
    const target: HTMLElement = event.target as HTMLElement
    const key = target.getAttribute('data-key');
    if (target.classList.contains('asc')) {
      target.classList.remove('asc');
      target.classList.add('desc');
      this.filterSortColumns[key].sortingOrder = 'desc';
    } else if (target.classList.contains('desc')) {
      target.classList.add('asc');
      target.classList.remove('desc');
      this.filterSortColumns[key].sortingOrder = 'asc';
    } else {
      let sibling = target.parentNode.firstElementChild;
      while (sibling) {
        if (sibling.nodeType === 1 && sibling !== event.target) {
          const datKey = sibling.getAttribute('data-key');

          if (datKey != null) {
            this.filterSortColumns[datKey].sortingOrder = '';
            sibling.classList.remove('asc');
            sibling.classList.remove('desc');
          }
        }
        sibling = sibling.nextElementSibling;
      }
      target.classList.add('asc');
      this.filterSortColumns[key].sortingOrder = 'asc';
    }
    this.fetchData();
  };

  paginationChange = (event): void => {
    const setOffsetLimit = {
      offset: (event.detail.state.currentPage * event.detail.state.numPerPage) - event.detail.state.numPerPage,
      limit: event.detail.state.numPerPage,
    };
    if (this.limit !== setOffsetLimit.limit || this.offset !== setOffsetLimit.offset) {
      if (this.limit !== setOffsetLimit.limit) {
        localStorage.setItem(this.tableLimitStorageKey, setOffsetLimit.limit);
      }
      this.limit = setOffsetLimit.limit;
      this.offset = setOffsetLimit.offset;
      this.fetchData(true);
    }
  };

  /**
   * Clears the input of all filter criteria
   */
  public clearAllFilters(): void {
    Object.keys(this.filterSortColumns).forEach(filterKey => (this.filterSortColumns[filterKey].searchText = ''));
    const attrKey = 'data-key';
    this.table?.dom.table
      .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach(filterCell => {
        filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
      });
    this.isFilter.set(false);
    this.appliedFilterSortColumns.set({ ...this.filterSortColumns });
    this.fetchData();
  }

  /**
   * Clears the input of one filter criterion.
   * @param currentFilter name of the filter criterion to be cleared
   */
  public clearSelectedFilter(currentFilter: string): void {
    this.filterSortColumns[currentFilter].searchText = '';
    this.appliedFilterSortColumns.set({ ...this.filterSortColumns });
    const showPill = Object.values(this.appliedFilterSortColumns()).find(filter => filter.searchText != '')
    this.isFilter.set(!!showPill);
    const attrKey = 'data-key';
    this.table?.dom.table
      .querySelectorAll(`thead>tr.filters>td[${attrKey}="${currentFilter}"]:not([${attrKey}=""])`)
      .forEach(filterCell => {
        filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
      });
    this.fetchData();
  }

  public fetchData(notifyDataLoaded: boolean = false): void {
    try {
      this.loadingTableData.set(true);
      if (this.table) updateNoDataRowInTable(this.table, 'Loading...');
      const fetchPageHandler = this.fetchPageHandler()(this.limit, this.offset, this.filterSortColumns);
      if (fetchPageHandler) this.subscription.add(fetchPageHandler.pipe(
        tap((page: PageInfo & { results: any[] }) => {
          this.totalRecords = page.totalRecords;
          this.data = page.results;
          if (this.table) this.table.update(this.tableElements);
          if (this.pagination) this.pagination.update(this.totalRecords);
          this.loadingTableData.set(false);
          if (page.totalRecords === 0) {
            updateNoDataRowInTable(this.table, 'No data found.');
          }
          if (notifyDataLoaded) this.isDataLoaded.next(true);
        }),
        catchError((error: HttpErrorResponse) => {
          this.loadingTableData.set(false);
          let errorMessage = '';
          if (error.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // server-side error
            errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
          }
          this.clearTable();
          updateNoDataRowInTable(this.table, 'No data found.');
          return throwError(() => {
            return errorMessage;
          });
        })
      ).subscribe());
    } catch (err) {
      this.loadingTableData.set(false);
      updateNoDataRowInTable(this.table, '');
    }
  }

  public filterTableData(filterOpr: (value: Object, index: number) => boolean): void {
    if (this.table && this.tableElements) {
      this.table.update(this.tableElements.filter(filterOpr));
    }
  }

  public resetTableData(): void {
    if (this.table && this.tableElements) {
      this.table.update(this.tableElements);
    }
  }

  public clearTable(): void {
    if (this.table) {
      this.data = [];
      this.table.update(this.data);
      this.offset = 0;
      this.totalRecords = 0;
      this.pagination.update(this.totalRecords);
    }
  }

  public setFilterForColumn(columnKey: string, value: string): void {
    const id = `table-filter-input-text-${columnKey}`;
    const inputElement = document.getElementById(id);

    if (inputElement) {
      (inputElement as HTMLInputElement).value = value;
      this.filterSortColumns[columnKey].searchText = value;
      this.appliedFilterSortColumns.set({ ...this.filterSortColumns });

      Object.keys(this.filterSortColumns).forEach(filterKey => {
        if (this.filterSortColumns[filterKey].searchText != '') {
          this.isFilter.set(true);
        }
      });

      this.fetchData();
    }
  }
}
