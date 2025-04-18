import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import TableUtils from '../project/acceptance-package-details/table-utilities';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { SharedModule } from 'src/app/shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../projects.service';
import { Observable, catchError, firstValueFrom, map, tap, throwError } from 'rxjs';
import { GetProjectUsersAndGroups, ProjectMember, ProjectRoleNames } from '../projects.interface';
import { AssignProjectUsersAndGroups, FilterSortAttr, ProjectOnboardingService } from 'src/app/project-onboarding/project-onboarding.service';
import { FilterSortConfiguration, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { OnboardComponent } from './onboard/onboard.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { GroupManagementModule } from 'src/app/group-management/group-management.module';
import { HttpErrorResponse } from '@angular/common/http';
import RoleTitleMapping from 'src/app/auth/role-mapping.utils';
import { GroupManagementService } from 'src/app/group-management/group-management.service';
import { GroupUsersDialogComponent } from 'src/app/group-management/group-users-dialog/group-users-dialog.component';
import { AuthorizationService, ToolPermission } from 'src/app/auth/authorization.service';
import { GroupAssociatedPackage, RoleType } from 'src/app/group-management/group-management-interfaces';
import { GroupPkgListDialogComponent } from 'src/app/group-management/group-user/group-pkg-list-dialog/group-pkg-list-dialog.component';


/**
 * Map that defines the mapping between presented text of a
 * user status to the model field name `status`.
 */
const userStatusViewModelToDataModel = {
  'ACTIVE': false,
  'INACTIVE': true,
};

const soleUserValidationMessage = 'Invalid attempt. User is a sole user in one or more acceptance packages';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    GroupManagementModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.less'
})
export class UsersComponent implements OnInit, OnDestroy {
  filterSortColumns = {
    name: { columnName: 'User/group name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    userId: { columnName: 'Signum', searchText: '', sortingIndex: 0, sortingOrder: '' },
    email: { columnName: 'Email', searchText: '', sortingIndex: 0, sortingOrder: '' },
    onboardedBy: { columnName: 'On-boarded by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    onboardDate: { columnName: 'Onboarding date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
    roleType: { columnName: 'Role type', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.values(ProjectRoleNames).filter((v) => isNaN(Number(v))) },
    status: { columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '', options: ['Active', 'Inactive'] },
  };
  readonly tableLimitStorageKey = 'project-users-table-limit';
  limit = 10;
  offset = 0;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  pkgListDialog: GroupPkgListDialogComponent;
  columnsProperties = [
    {
      key: 'name',
      title: this.filterSortColumns.name.columnName,
    },
    {
      key: 'userId',
      title: this.filterSortColumns.userId.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string, i: number): void => {
        const rowData = this.tableComponent.table.data.at(i) as ProjectMember;
        if (rowData.userType === 'Group') {
          this.formatGroupInfo(td, rowData);
        }
        else TableUtils.formatCellContentWithoutCellDataDoubleDash(td, cellData);
      }
    },
    {
      key: 'email',
      title: this.filterSortColumns.email.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string, i: number): void => {
        const rowData = this.tableComponent.table.data.at(i) as ProjectMember;
        if (rowData.userType === 'Group') {
          this.formatGroupInfo(td, rowData);
        }
        else TableUtils.formatCellContentWithoutCellDataDoubleDash(td, cellData);
      }
    },
    {
      key: 'roleType',
      title: this.filterSortColumns.roleType.columnName,
      onCreatedCell : (td : HTMLTableCellElement, cellData: any): void => {
        RoleTitleMapping.assignTitleForGivenRole(cellData, td)
      }
    },
    {
      key: 'status',
      title: this.filterSortColumns.status.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: boolean, i: number): void => {
        const switchElement = document.createElement('label');
        switchElement.classList.add('switch');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = cellData === false;
        const ball = document.createElement('i');
        ball.classList.add('ball');
        const statusSpan = document.createElement('span');
        statusSpan.setAttribute('data-enabled', 'Active')
        statusSpan.setAttribute('data-disabled', 'Inactive')
        switchElement.append(checkbox, ball, statusSpan);
        const wrappingElement = document.createElement('div');
        wrappingElement.replaceChildren(switchElement);
        td.replaceChildren(wrappingElement);
        firstValueFrom(this.isAuthorized(ToolPermission.ViewProjectMenuUserOnboarding)).then(isAuthorized => {
          if (isAuthorized) {
            checkbox.addEventListener('change', (event: Event) => {
              const rowData = this.tableComponent.table.data.at(i) as ProjectMember;
              if (event.target instanceof HTMLInputElement) {
                const vSwitch = event.target as HTMLInputElement;
                const userType = rowData?.userType;
                if (userType === 'Group') {
                  //Validate if group is sole actor in any of the packages and show data accordingly
                  this.projectsService.getGroupAssociatedPackageList(this.projectId, rowData.internalId).subscribe({
                    next: (pkgList: GroupAssociatedPackage[]) => {
                      if (!vSwitch.checked && pkgList.length > 0) { // Allow group not to be inactivated
                        vSwitch.checked = !vSwitch.checked;
                        const dialogComponentRef = this.dialogService.createDialog(GroupPkgListDialogComponent, {
                          pkgListData: pkgList, groupId: null, groupInternalId: rowData.internalId, projectId: this.projectId, userType: userType
                        });
                        this.pkgListDialog = dialogComponentRef.instance;
                      } else { //Allow group to be activated or inactivated
                        vSwitch.disabled = true;
                        this.projectsService.patchProjectMember(this.projectId, rowData.internalId, { userType: rowData.userType, status: !vSwitch.checked }).pipe(
                          tap(() => {
                            vSwitch.disabled = false;
                          }),
                          catchError((error: HttpErrorResponse) => {
                            vSwitch.checked = !vSwitch.checked;
                            vSwitch.disabled = false;

                            let errorMessage = '';
                            if (error.error instanceof ErrorEvent) {
                              // client-side error
                              errorMessage = `Error: ${error.error.message}`;
                            } else {
                              // server-side error
                              errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
                            }
                            this.notificationService.showNotification({
                              title: `Error while changing the activation status of the project ${rowData.userType.toLocaleLowerCase()} ${rowData.name}!`,
                              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
                            }, true);
                            return throwError(() => {
                              return errorMessage;
                            });
                          }),
                        ).subscribe();
                      }
                    },
                    error: (error: HttpErrorResponse) => {
                      vSwitch.checked = !vSwitch.checked;
                      this.notificationService.showNotification({
                        title: error?.error?.responseMessage || `Error while editing the group!`,
                        description: error?.error?.responseMessageDescription || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
                      }, true);
                    }
                  });  
                }
                else if (userType === 'User') {
                  // Validate if user is a sole member in one or more acceptance packages
                  this.projectsService.getListOfAcceptancePackagesWhereUserIsASoleUser(this.projectId, rowData.internalId).subscribe({
                    next: (packageList: GroupAssociatedPackage[]) => {
                      if (packageList.length > 0) { // Do not allow to change the status of a user
                        vSwitch.checked = !vSwitch.checked;
                        const dialogComponentRef = this.dialogService.createDialog(GroupPkgListDialogComponent, {
                          pkgListData: packageList, groupId: null, groupInternalId: rowData.internalId, projectId: this.projectId, userType: userType
                        });
                        this.pkgListDialog = dialogComponentRef.instance;
                      }
                      else {
                        // Allow to change the status of a user
                        vSwitch.disabled = true;
                        this.projectsService.patchProjectMember(this.projectId, rowData.internalId, { userType: rowData.userType, status: !vSwitch.checked }).pipe(
                          tap(() => {
                            vSwitch.disabled = false;
                          }),
                          catchError((error: HttpErrorResponse) => {
                            vSwitch.checked = !vSwitch.checked;
                            vSwitch.disabled = false;

                            let errorMessage = '';
                            if (error.error instanceof ErrorEvent) {
                              // client-side error
                              errorMessage = `Error: ${error.error.message}`;
                            } else {
                              // server-side error
                              errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
                            }
                            this.notificationService.showNotification({
                              title: `Error while changing the activation status of the project ${rowData.userType.toLocaleLowerCase()} ${rowData.name}!`,
                              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
                            }, true);
                            return throwError(() => {
                              return errorMessage;
                            });
                          }),
                        ).subscribe();
                      }
                    },
                    error: (error: HttpErrorResponse) => {
                      vSwitch.checked = !vSwitch.checked;
                      this.notificationService.showNotification({
                        title: error?.error?.responseMessage || `Error while editing the group!`,
                        description: error?.error?.responseMessageDescription || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
                      }, true);
                    }
                  });
                }              
              }
            });
          }
          else checkbox.disabled = true;
        })
      },
    },
    {
      key: 'onboardedBy',
      title: this.filterSortColumns.onboardedBy.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string, i: number): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
      }
    },
    {
      key: 'onboardDate',
      title: this.filterSortColumns.onboardDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    },
  ];
  tableHeightStyleProp = 'calc(100vh - 290px - 32px)';
  projectId: string;
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetProjectUsersAndGroups>;
  @ViewChild(TableServerSidePaginationComponent)
  private tableComponent!: TableServerSidePaginationComponent;
  customerId: string;

  ToolPermission = ToolPermission;

  private eventAbortController = new AbortController();

  constructor(
    private activeRoute: ActivatedRoute,
    private datePipe: NullStringDatePipe,
    private projectsService: ProjectsService,
    private projectOnboardingService: ProjectOnboardingService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private groupManagementService: GroupManagementService,
    private authorizationService: AuthorizationService,
  ) { }

  ngOnInit(): void {
    this.projectId = this.activeRoute.snapshot.paramMap.get('id');
    this.fetchPageHandler = (limit, offset, filterSortConfig): Observable<GetProjectUsersAndGroups> => {
      const filterSortAttr: FilterSortAttr[] = [];
      Object.keys(filterSortConfig).forEach(filterKey => {
        if (filterSortConfig[filterKey].searchText !== '') {
          if (filterKey === 'status') {
            const statusKey = filterSortConfig[filterKey].searchText.trim().toUpperCase();
            const mapKeys = Object.keys(userStatusViewModelToDataModel);
            let statusVal = undefined;

            for (const key of mapKeys) {
              if (key.startsWith(statusKey)) {
                statusVal = userStatusViewModelToDataModel[key];
                break;
              }
            }

            if (undefined !== statusVal) {
              filterSortAttr.push({
                key: filterKey,
                value: statusVal
              });
            }
          }
          else {
            filterSortAttr.push({
              key: filterKey,
              value: filterSortConfig[filterKey].searchText
            });
          }
        }
        if (filterSortConfig[filterKey].sortingOrder !== '') {
          const sortAttr = {
            key: 'sort',
            value: `${filterSortConfig[filterKey].sortingOrder}(${filterKey})`
          };
          filterSortAttr.push(sortAttr);
        }
      });
      return this.projectsService.getProjectUsersAndGroups(this.projectId, limit, offset, filterSortAttr);
    }
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();

    if (this.pkgListDialog) {
      this.pkgListDialog.dialog.hide();
      this.pkgListDialog.dialog.destroy();
    }
  }

  onClickOnboard(): void {
    const submit = (onboard: AssignProjectUsersAndGroups): void => {
      this.projectOnboardingService.assignUsers(this.projectId, onboard).pipe(
        tap(() => {
          this.tableComponent?.fetchData();
        }),
      ).subscribe({
        error: (err => {
          this.notificationService.showNotification({
            title: err?.error.responseMessage || 'Error while onboarding users to the project!',
            description: err?.error.responseMessageDescription || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
          }, true);
        })
      });
    };

    const onboardComponentInputData = {
      submit: submit,
      projectId: this.projectId
    };

    const dialog = this.dialogService.createDialog(OnboardComponent, onboardComponentInputData);
  }

  private formatGroupInfo(td: HTMLTableCellElement, rowData: ProjectMember): void {
    const openGroupInfoDialog = (data: ProjectMember): void => {
      const groupUsers = this.groupManagementService.getGroupUserList(data.groupId).pipe(
        map(groupUsers => groupUsers.groupUsers
          .filter(user => user.isSoftDeleted === false)
          .filter(user => user.userRole !== RoleType.ProjectAdmin)
        ),
      );
      const componentRef = this.dialogService.createDialog(GroupUsersDialogComponent);
      componentRef.setInput('groupName', data.name);
      componentRef.setInput('groupUsers', groupUsers);
    };
    td.replaceChildren(TableUtils.createInfoIconElement(rowData, openGroupInfoDialog, this.eventAbortController));
    td.appendChild(document.createTextNode('Group users'));
  }

  isAuthorized(permission: ToolPermission): Observable<boolean> {
    return this.authorizationService.isUserAuthorized(permission);
  }
}
