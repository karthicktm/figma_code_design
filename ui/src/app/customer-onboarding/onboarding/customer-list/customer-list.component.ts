import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CustomerShort, CustomersShortResponse } from '../../customer-onboarding.interface';
import { CustomerService } from '../../customer.service';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { DialogService } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.less']
})
export class CustomerListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() updatedCustomerDetails: Object;
  @Output() selectedValue = new EventEmitter<CustomerShort>();
  private subscription: Subscription = new Subscription();
  private eventAbortController = new AbortController();
  @ViewChild(TableServerSidePaginationComponent) private readonly customerTableRef!: TableServerSidePaginationComponent;
  filterSortColumns = {
    customerName: { columnName: 'Customer Name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerId: { columnName: 'Customer ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedBy: { columnName: 'Last modified by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };
  columnsProperties = [
    {
      key: 'customerName',
      title: this.filterSortColumns.customerName.columnName,
      cellClass: 'cell-overflow',
    },
    {
      key: 'customerId',
      title: this.filterSortColumns.customerId.columnName,
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
      cellClass: 'column-date',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    },
  ];
  tableHeightStyleProp = 'calc(100vh - 306px)';
  limit = 25;
  offset = 0;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<CustomersShortResponse>;
  tableOptions: TableOptions = {
    actions: true,
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: CustomerShort): void => {
      const editableActionCell = td;
      editableActionCell.innerHTML = `<button class="btn-icon edit" title="Edit"><i class="icon icon-edit"></i></button>`;
      this.subscription.add(
        editableActionCell.querySelector('button.edit').addEventListener('click', (evt) => {
          this.selectedValue.next(rowData);
        })
      );
    },
  };

  constructor(
    private customerService: CustomerService,
    private datePipe: NullStringDatePipe,
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.fetchPageHandler = (limit, offset, filterSortConfig): Observable<CustomersShortResponse> => {
      return this.customerService.searchCustomers(limit, offset, filterSortConfig);
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.updatedCustomerDetails.currentValue !== changes.updatedCustomerDetails.previousValue) {
      this.customerTableRef.fetchData();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.eventAbortController.abort();
  }
}
