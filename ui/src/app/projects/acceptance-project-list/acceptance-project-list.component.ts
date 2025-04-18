import { Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { UserSession, ProjectShort, GetProjectsShortResponse } from '../projects.interface';
import { ProjectsService } from '../projects.service';
import { ProjectEventService } from '../project-event.service';
import { CustomerDetailsDialogComponent } from '../details-dialog/customer-details-dialog/customer-details-dialog.component';
import { ProjectDetailsDialogComponent } from '../details-dialog/project-details-dialog/project-details-dialog.component';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { CacheKey } from 'src/app/portal/services/session-storage.service';
import TableUtils from '../project/acceptance-package-details/table-utilities';
import { ComponentService } from 'src/app/shared/component.service';
import { StoreService } from '../project/store.service';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';


const acceptancePackagesReceived = 'Acceptance Packages Received'
const acceptancePackageSentToCustomer = 'Acceptance Package Sent To Customer'

@Component({
  selector: 'app-acceptance-project-list',
  templateUrl: './acceptance-project-list.component.html',
  styleUrls: ['./acceptance-project-list.component.less']
})

export class AcceptanceProjectListComponent implements OnDestroy {
  userRole: string[];
  @ViewChild(TableServerSidePaginationComponent) private readonly table!: TableServerSidePaginationComponent;
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetProjectsShortResponse>;
  public filterSortColumns = {
    projectName: { columnName: 'Project name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    projectId: { columnName: 'Project ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    sourceTool: { columnName: 'Source tool', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerName: { columnName: 'Customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    projectExecutionCountry: { columnName: 'Execution country', searchText: '', sortingIndex: 0, sortingOrder: '' },
    projectActualStartDate: { columnName: 'Start date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    projectActualEndDate: { columnName: 'End date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdDate: { columnName: 'Created date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
    status: { columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '', options: ['New', 'Pending', 'Completed'] },
  };

  columnsProperties = [
    {
      key: 'projectName',
      title: this.filterSortColumns.projectName.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        td.innerHTML = `<i class="icon icon-info pointer project-info"></i> <ng-container class="project-name">${cellData}</ng-container>`;
      },
    },
    {
      key: 'projectId',
      title: this.filterSortColumns.projectId.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        td.innerHTML = `${cellData}`;
      },
    },
    {
      key: 'sourceTool',
      title: this.filterSortColumns.sourceTool.columnName,
    },
    {
      key: 'customerName',
      title: this.filterSortColumns.customerName.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string, index: number): void => {
        td.innerHTML = `<i class="icon icon-info pointer"></i> ${cellData}`;
        td.querySelector('.icon').addEventListener('click', (event) => {
          const tableData = this.table.table.data as unknown as ProjectShort;
          const customerId = tableData[index]?.customerId;
          if (customerId) this.openCustomerDetails(customerId);
        });
      },
    },
    {
      key: 'projectExecutionCountry',
      title: this.filterSortColumns.projectExecutionCountry.columnName,
    },
    {
      key: 'projectActualStartDate',
      title: this.filterSortColumns.projectActualStartDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    },
    {
      key: 'projectActualEndDate',
      title: this.filterSortColumns.projectActualEndDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    },
    {
      key: 'status',
      title: this.filterSortColumns.status.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
        if (cellData === 'New') {
          td.innerHTML = `<kbd class="tag big blue">New</kbd>`;
        }
        else if (cellData === acceptancePackagesReceived || cellData === acceptancePackageSentToCustomer) {
          td.innerHTML = `<kbd class="tag big purple">Pending</kbd>`;
        }
        else if (cellData === 'Complete') {
          td.innerHTML = `<kbd class="tag big green">Completed</kbd>`;
        } else {
          td.innerHTML = `<kbd class="tag big grey">Unknown</kbd>`;
        }
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
    }
  ];
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 25;
  offset: number = 0;
  customerId: string;
  private subscription: Subscription = new Subscription();
  readonly tableLimitStorageKey = 'projects-table-limit';

  constructor(
    private dialogService: DialogService,
    private projectsService: ProjectsService,
    private projectEventService: ProjectEventService,
    private datePipe: NullStringDatePipe,
    private storeService: StoreService,
    private componentService: ComponentService,
  ) {
    this.projectEventService.userSessionChange.subscribe((userSession: UserSession) => {
      this.userRole = userSession.roleType;
      const isCustomer = this.userRole.find(role => role === 'Customer Approver' || role === 'Customer Observer') ? true : false;

      if (isCustomer) {
        let idx = this.columnsProperties.findIndex(col => col.key === 'customerName');
        if (idx !== -1) {
          this.columnsProperties.splice(idx, 1); // Hide Customer
        }

        idx = this.columnsProperties.findIndex(col => col.key === 'createdDate');
        if (idx !== -1) {
          this.columnsProperties.splice(idx, 1); // Hide Created date
        }
      }
    });

    this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<GetProjectsShortResponse> => {
      return this.projectsService.getListOfProjectShort(limit, offset, filterSort);
    };
  }

  // table height style properties
  tableHeightStyleProp = 'calc(100vh - 290px - 32px)';
  tableOptions: TableOptions = {
    onCreatedRow: (tr: HTMLTableRowElement, rowData: ProjectShort): void => {
      const projectNameElement = tr.querySelector('.project-name');
      const onClick = (): void => this.setCurrentProject(rowData);
      this.componentService.createRouterLink({ text: rowData.projectName, link: ['/projects', rowData.projectId], onClick }, projectNameElement);

      this.subscription.add(
        tr.querySelector('.project-info').addEventListener('click', (event) => {
          this.openProjectDetails(rowData);
        })
      );
    }
  };

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public setCurrentProject(rowData: ProjectShort): void {
    const customerId = rowData.customerId;
    const projectId = rowData.projectId;
    const sourceTool = rowData.sourceTool
    this.storeService.save(CacheKey.currentProject, { projectId, customerId, sourceTool });
  }

  /**
   * open dialog and display the project details
   * @param customerId id of the customer
   * @param projectId id of the project
   */
  public openProjectDetails(rowData: ProjectShort): void {
    const projectId = rowData.projectId;
    const dialogRef = this.dialogService.createDialog(
      ProjectDetailsDialogComponent,
      { projectId }
    );
  }

  /**
   * open dialog and display the customer details
   * @param customerId id of the customer
   */
  public openCustomerDetails(customerId: string): void {
    const dialogRef = this.dialogService.createDialog(
      CustomerDetailsDialogComponent,
      { customerId }
    );
  }
}
