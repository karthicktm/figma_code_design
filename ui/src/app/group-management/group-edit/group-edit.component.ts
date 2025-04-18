import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subscription, exhaustMap, expand, map, of, reduce, takeWhile, tap, catchError } from 'rxjs';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { Group, GroupAssociatedPackage, GroupUser, GroupUsers, RoleType, UpdateGroupPayload } from '../group-management-interfaces';
import { GroupManagementService } from '../group-management.service';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { UserSession } from 'src/app/projects/projects.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { ConfirmationDialogComponent } from 'src/app/confirmation-dialog/confirmation-dialog.component';
import { ProjectsService } from 'src/app/projects/projects.service';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { OPSUser } from 'src/app/user-management/user-management.interface';
import { MessageDialogComponent } from 'src/app/projects/details-dialog/message-dialog/message-dialog.component';
import { GroupPkgListDialogComponent } from '../group-user/group-pkg-list-dialog/group-pkg-list-dialog.component';

@Component({
  selector: 'app-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: ['./group-edit.component.less']
})
export class GroupEditComponent implements OnInit, OnDestroy {
  groupList: Group[];
  groupDetails: GroupUsers;
  groupId: string;
  loader: boolean;
  isEditable: boolean;
  // Indicates whether it's the first time group in editing after creation. In initial editing mode user is not allowed to add other project admins into the group.
  isInitEditing = true;
  updatePayload: UpdateGroupPayload;
  isSoftDeletedGroup: boolean;

  loadingUserListToAdd: boolean;
  groupUserList: GroupUser[];
  userList: OPSUser[];
  userListOption: OptionWithValue[];
  adminListOption: OptionWithValue[];
  limit: number = 100;
  offset: number = 0;
  groupRoleType: string;
  customerId: string;
  pkgListDialog: GroupPkgListDialogComponent;


  private subscription: Subscription = new Subscription();

  constructor(
    private groupManagementService: GroupManagementService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private sessionStorage: SessionStorageService,
    private dialogService: DialogService,
    private projectService: ProjectsService
  ) {
  }

  ngOnInit(): void {
    if (this.route.snapshot.url.length > 0) {
      this.groupId = this.route.snapshot.paramMap.get('id');
      this.retrieveGroupDetails();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.pkgListDialog) {
      this.pkgListDialog.dialog.hide();
      this.pkgListDialog.dialog.destroy();
    }
  }

  retrieveGroupDetails(): void {
    const currentUser = this.sessionStorage.get<UserSession>(CacheKey.userSession).signum;
    if (this.groupId) {
      this.subscription.add(this.groupManagementService.getGroupUserList(this.groupId).subscribe(data => {
        this.groupDetails = data;
        if (this.groupDetails.isSoftDeleted) {
          // when its soft deleted , disable the edit feature overall
          this.isEditable = false;
        } else if (data.groupUsers && data.groupUsers.length > 0) {
          if (data.groupUsers.length === 1 && data.groupUsers[0].userRole === 'Project Admin') this.isInitEditing = true;
          else this.isInitEditing = false;
          if (data.groupUsers.find(user => user.userId.toUpperCase() === currentUser.toUpperCase()
            && user.userRole === 'Project Admin')) this.isEditable = true;
        }
        this.groupUserList = this.groupDetails.groupUsers.sort((a, b) => a.userEmail.localeCompare(b.userEmail));

        this.updatePayload = { ...this.updatePayload, groupUsers: this.groupUserList };

        this.groupRoleType = this.groupDetails.roleType;
        // for customer user this value be available, else will be null 
        this.customerId = this.groupDetails.customerId;
        this.retrieveUsers();
      }));
    }
  }

  closeDetails(): void {
    this.router.navigate([`/group-management`]);
  }

  saveDetails(): void {
    if (!this.updatePayload) return;
    if (!Object.keys(this.updatePayload).includes('isSoftDeleted')) this.updatePayload = { ...this.updatePayload, isSoftDeleted: this.groupDetails.isSoftDeleted };
    this.subscription.add(this.groupManagementService.updateGroup(this.groupId, this.updatePayload).subscribe({
      next: () => {
        this.notificationService.showNotification({
          title: `Updated group successfully!`,
        });
        this.router.navigate([`/group-management`]);
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.showNotification({
          title: error?.error?.responseMessage || `Error while updating the group!`,
          description: error?.error?.responseMessageDescription || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      }
    }));
  }


  openStatusChangeConfirmationDialog(event): void {
    if (event) {
      event.preventDefault();
    }

    this.subscription.add(this.groupManagementService.getGroupAssociatedPackageList(this.groupId).subscribe({
      next: (pkgList: GroupAssociatedPackage[]) => {
        if (pkgList.length === 0) { // Package can be deactivated now
          // process only active -> inactive 
          if (!this.isSoftDeletedGroup) {
            const dialogRef = this.dialogService.createDialog(ConfirmationDialogComponent, {
              title: 'Deactivate group?',
              message: 'Once a group is made inactive, it cannot be activated further. Do you want to proceed?',
              confirmLabel: 'Yes',
              cancelLabel: 'No'
            });
            dialogRef.instance.dialogResult.subscribe((result: any) => {
              if (result) {
                const isSoftDeleted = !this.isSoftDeletedGroup;

                // make the soft delete true for all users
                this.updatePayload.groupUsers = this.updatePayload.groupUsers.map(item => {
                  if (item.isSoftDeleted === false) {
                    return { ...item, isSoftDeleted: true };
                  }
                  return item;
                });
                // make the group soft delete true
                this.updatePayload = { ...this.updatePayload, isSoftDeleted };
                this.saveDetails();
                this.isSoftDeletedGroup = isSoftDeleted;
              }
            });
          }
        } else {
          const dialogComponentRef = this.dialogService.createDialog(GroupPkgListDialogComponent, { pkgListData: pkgList, groupId: this.groupId });
          this.pkgListDialog = dialogComponentRef.instance;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.showNotification({
          title: error?.error?.responseMessage || `Error while editing the group!`,
          description: error?.error?.responseMessageDescription || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      }
    }));
  }

  updateUsers(updateUsers: GroupUser[]): void {
    if (this.updatePayload) {
      if (this.updatePayload.groupUsers) {
        this.updatePayload.groupUsers.push(...updateUsers)
      }
    }
  }

  retrieveUsers(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loadingUserListToAdd = true;
      })
    );
    // recursively calls the API to get all group users, initially with 100 result users.
    const users =
      of({
        morePages: true,
        limit: this.limit,
        nextOffset: this.offset,
        results: []
      }).pipe(
        expand(data => {
          if (data.morePages)
            return this.projectService.getOPSUsers(data.limit, data.nextOffset).pipe(
              map(newData => ({ ...newData, limit: data.limit }))
            );
          return EMPTY;
        }),
        takeWhile(data => data !== undefined),
        map(data => data.results),
        reduce((acc, results) => ([...acc, ...results])),
        tap(() => {
          this.loadingUserListToAdd = false;
        }),
        catchError((error) => {
          const data = {
            title: 'Unable to load data',
            message: error.error.responseMessageDescription ? error.error.responseMessageDescription + ' Please try again after some time!' : 'Please try again after some time!',
          };
          const dialogComponentRef = this.dialogService.createDialog(MessageDialogComponent, data);
          return [];
        }),
      );

    this.subscription.add(loadingStartFlagging.pipe(
      exhaustMap(() => users),
    ).subscribe(res => {
      this.userList = res;
      // do this for CustomerApprover and CustomerObserver roles
      // if the customerId is null, it means that, its not tagged to customer user
      // when its available for customer user, match and filter it
      this.userListOption = this.userList
        .filter(user => this.filterUsers(user))
        .map(users => {
          return {
            optionValue: users.userId,
            option: users.userEmail
          };
        });
      this.adminListOption = this.userList
        .filter(user => user.roleType.includes('Project Admin')
          && !user.isSoftDeleted
          && !this.groupUserList.find(usr => usr.userId == user.userId))
        .map(users => {
          return {
            optionValue: users.userId,
            option: users.userEmail
          };
        })
    }));
  }

  private filterUsers(user: OPSUser): boolean {
    if (user.isSoftDeleted) {
      return false;
    }

    const existingUser = this.groupUserList.find(usr => usr.userId == user.userId);

    if (existingUser) {
      return false;
    }

    if (this.groupRoleType === RoleType.CustomerApprover || this.groupRoleType === RoleType.CustomerObserver) {
      return user.roleType.includes(this.groupRoleType) && (user.customerId === this.customerId);
    } else {
      // for other users, make sure the role type is inclusive
      return user.roleType.includes(this.groupRoleType)
    }
  }

}
