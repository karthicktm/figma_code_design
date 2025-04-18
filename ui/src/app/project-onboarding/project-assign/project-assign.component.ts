import { Component, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectOnboardingService } from '../project-onboarding.service';
import { GetProjectsResponse, Project } from 'src/app/projects/projects.interface';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { Subscription } from 'rxjs';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { ProjectStatus } from '../project-onboarding.interface';
import { DialogService } from 'src/app/portal/services/dialog.service';


@Component({
  selector: 'app-project-assign',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
  ],
  templateUrl: './project-assign.component.html',
  styleUrl: './project-assign.component.less'
})
export class ProjectAssignComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  private eventAbortController = new AbortController();
  readonly isAssignmentDisplay = signal<boolean>(false);
  userOptions: Observable<OptionWithValue[]>;
  user = new FormControl<string>('', [Validators.required]);
  @ViewChild(TableServerSidePaginationComponent) private readonly projectTableRef!: TableServerSidePaginationComponent;
  selectedProjectId: string;
  columnsProperties = [
    {
      key: 'customerId',
      title: 'Customer ID',
    },
    {
      key: 'projectId',
      title: 'Project ID',
    },
    {
      key: 'projectName',
      title: 'Project name',
    },
    {
      key: 'projectAdmins',
      title: 'Project Admin(s)',
    },
    {
      key: 'status',
      title: 'Project status',
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        if (cellData === 'Draft') {
          td.innerHTML = `<kbd class="tag big blue">Draft</kbd>`;
        }
        else if (cellData === 'New') {
          td.innerHTML = `<kbd class="tag big blue">New</kbd>`;
        }
        else if (cellData === 'AcceptancePackagesReceived') {
          td.innerHTML = `<kbd class="tag big purple">Received</kbd>`;
        }
        else if (cellData === 'AcceptanceInProgress') {
          td.innerHTML = `<kbd class="tag big purple">Pending</kbd>`;
        }
        else if (cellData === 'Complete') {
          td.innerHTML = `<kbd class="tag big green">Completed</kbd>`;
        }
      },
    },
    {
      key: 'lastModifiedBy',
      title: 'Last modified by',
      cellClass: 'column-created-by',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
      },
    },
    {
      key: 'lastModifiedDate',
      title: 'Last modified date & time',
      cellClass: 'column-date',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    },
  ];

  filterSortColumns = {
    customerId: { columnName: 'customerId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    projectId: { columnName: 'projectId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    projectName: { columnName: 'projectName', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: { columnName: 'status', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.values(ProjectStatus) },
    lastModifiedBy: { columnName: 'lastModifiedBy', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'lastModifiedDate', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };
  limit = 25;
  offset = 0;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  tableHeightStyleProp = 'calc(100vh - 302px)';
  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetProjectsResponse>;
  currentProjectData: Project[] = [];
  tableOptions: TableOptions = {
    actions: true,
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: Project): void => {
      const assignButton = document.createElement('button');
      assignButton.classList.add('btn-icon');
      assignButton.setAttribute('title', 'Assign project admin');
      const iconAssign = document.createElement('i');
      iconAssign.classList.add('icon', 'icon-avatar');
      assignButton.appendChild(iconAssign);
      td.appendChild(assignButton);
      this.subscription.add(assignButton.addEventListener('click', () => {
        this.selectedProjectId = rowData.projectId;
        this.onAssignProjectAdmin();
      }));
    },
  };

  constructor(
    private projectOnboardingService: ProjectOnboardingService,
    private notificationService: NotificationService,
    private datePipe: NullStringDatePipe,
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.fetchPageHandler = (limit, offset, filterSortConfig): Observable<GetProjectsResponse> => {
      let sortValue = '';
      const filterBody = {};

      if (filterSortConfig) {
        Object.keys(filterSortConfig).forEach(key => {
          if (filterSortConfig[key].sortingOrder !== '') {
            sortValue = `${filterSortConfig[key].sortingOrder}(${filterSortConfig[key].columnName})`;
          }

          if (!filterSortConfig[key].searchText || filterSortConfig[key].searchText.trim() === '') {
            return;
          }

          if (key === 'lastModifiedDate') {
            const startDate = new Date(filterSortConfig[key].searchText);
            const endDate = new Date(filterSortConfig[key].searchText);

            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);

            endDate.setHours(23);
            endDate.setMinutes(59);
            endDate.setSeconds(59);

            filterBody['minCreatedDate'] = startDate.toISOString();
            filterBody['maxCreatedDate'] = endDate.toISOString();
          } else if (key === 'status') {
            let result = filterSortConfig[key].searchText;
            const lowerVal = result.toLowerCase();

            //Enum mapping with search text
            if ('completed'.includes(lowerVal)) {
              result = 'Complete'
            } else if ('new'.includes(lowerVal)) {
              result = 'New';
            } else if ('received'.includes(lowerVal)) {
              result = 'AcceptancePackagesReceived';
            } else if ('pending'.includes(lowerVal)) {
              result = 'AcceptanceInProgress';
            } else if ('draft'.includes(lowerVal)) {
              result = 'Draft';
            }

            filterBody[key] = result;
          } else {
            filterBody[key] = filterSortConfig[key].searchText;
          }
        });
      }

      return this.projectOnboardingService.searchProjects(limit, offset, sortValue, filterBody).pipe(
        map((data: GetProjectsResponse) => {
          this.currentProjectData = data.results ? data.results : [];
          return data;
        })
      );
    };
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.eventAbortController.abort();
  }

  onAssignProjectAdmin(): void {
    this.userOptions = this.projectOnboardingService.getAllOPSUsers().pipe(
      map(users => users.map(user => {
        return { option: `${user.userFirstName} ${user.userLastName} <${user.userEmail || user.userId}>`, optionValue: user.userId };
      }))
    );
    this.isAssignmentDisplay.set(true);
  }

  onAssignProjectAdminGivenProjectId($event): void {
    if ($event?.detail) {
      // set the project id for assign to be chosen by user
      this.selectedProjectId = $event?.detail;
    }
    this.onAssignProjectAdmin();
  }

  onSubmitAssignment(): void {
    const body = {
      usersAndGroups: [
        {
          userIds: [this.user.value],
          roleType: RoleType.ProjectAdmin,
        }
      ],
      groupIds: [],
    };

    this.projectOnboardingService.assignUsers(this.selectedProjectId, body).pipe(
      tap(() => {
        if (this.projectTableRef) {
          this.projectTableRef?.fetchData();
        }
        this.isAssignmentDisplay.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showLogNotification({
          title: `Error on user assignment for project ${this.selectedProjectId}!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        })
        return throwError(() => {
          return errorMessage;
        });
      }),
    ).subscribe({
      next: () => {
        this.notificationService.showNotification({
          title: `Assigned Project Admin successfully!`,
        });
      },
      error: (error => {
        this.notificationService.showNotification({
          title: `Error assigning the Project Admin!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
        }, true);
      })
    });
  }

  onBackFromAssignment(): void {
    // when back to grid from AssignmentDisplay, there will be no selection, so making it undefined
    this.selectedProjectId = undefined;
    this.isAssignmentDisplay.set(false);
  }
}
