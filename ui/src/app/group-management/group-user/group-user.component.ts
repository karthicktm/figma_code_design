import { AfterViewInit, Component, effect, ElementRef, EventEmitter, input, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@eds/vanilla';
import { Subscription } from 'rxjs';
import { OPSUser } from 'src/app/user-management/user-management.interface';
import { GroupUser, GroupUsers, UpdateGroupPayload } from '../group-management-interfaces';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { SelectMultiInputComponent } from 'src/app/shared/select-multi-input/select-multi-input.component';
import { HttpErrorResponse } from '@angular/common/http';
import { GroupManagementService } from '../group-management.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { GroupPkgListDialogComponent } from './group-pkg-list-dialog/group-pkg-list-dialog.component';

@Component({
  selector: 'app-group-user',
  templateUrl: './group-user.component.html',
  styleUrls: ['./group-user.component.less']
})
export class GroupUserComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('userSelect') readonly userSelectRef: SelectMultiInputComponent; 
  @ViewChild('groupUser') readonly groupUserTableElementRef: ElementRef<HTMLElement>
  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();
  private eventAbortController = new AbortController();

  @Input() selectedGroup: GroupUsers;
  @Input() isEditable: boolean;
  @Input() isInitEditing: boolean;
  @Input() userListOption: OptionWithValue[];
  @Input() userList: OPSUser[];
  @Output() updateUsers = new EventEmitter<GroupUser[]>();
  isSoftDeletedGroup = input<boolean>()
  searchText: string;
  groupId: string;
  groupRoleType: string;
  groupUserList: GroupUser[];
  oldGroupUserList: GroupUser[];

  table: Table;

  limit: number = 100;
  offset: number = 0;
  totalRecords: number;
  groupName: string;
  loadingUser: boolean;
  selectedUsers: string[];
  loader: boolean = false;
  loadingUserListToAdd: boolean;
  customerId: string;  
  isSaveVisible: boolean = false;
  pkgListDialog: GroupPkgListDialogComponent;

  constructor(
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private groupManagementService: GroupManagementService,
    private dialogService: DialogService,
  ) {
    effect(() => {
      if (this.isSoftDeletedGroup() === undefined) return;
      this.groupUserList = this.groupUserList.filter(elem => elem.userRole !== 'Project Admin').map(user => ({ ...user, isSoftDeleted: this.isSoftDeletedGroup() }));
      if (this.table) this.table.update(this.groupUserList);      
    });
  }

  ngOnInit(): void {
    this.limit = parseInt(localStorage.getItem('groupUsersDisplayMaxCount') || '100') || 100;
    this.groupId = this.route.snapshot.paramMap.get('id');
    this.groupName = this.selectedGroup.groupName;
    this.groupRoleType = this.selectedGroup.roleType;
    this.groupUserList = this.selectedGroup.groupUsers.filter(elem => elem.userRole !== 'Project Admin').sort((a, b) => a.userEmail.localeCompare(b.userEmail));
    if (this.table) this.table.update(this.groupUserList);
    // for customer user this value be available, else will be null
    this.customerId = this.selectedGroup.customerId; 
  }

  ngAfterViewInit(): void {
    const columnsProperties = [
      {
        key: 'userName',
        title: 'User name'
      },
      {
        key: 'userEmail',
        title: 'E-mail'
      },
      {
        key: 'userRole',
        title: 'Role'
      },
      {
        key: 'isSoftDeleted',
        title: 'Status',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          td.innerHTML = `<label class="switch">
            <input type="checkbox">
            <i class="ball"></i>
            <span data-enabled="Active" data-disabled="Inactive"></span>
          </label>`
          if (!cellData) { td.querySelector('input').checked = true; }
          if (!(this.isEditable && this.isSaveVisible)) { td.querySelector('input').disabled = true; }
        }
      }
    ];

    const groupUserTableDOM = this.groupUserTableElementRef.nativeElement as HTMLElement;
    if (groupUserTableDOM) {
      const table = new Table(groupUserTableDOM, {
        data: this.groupUserList || [],
        columns: columnsProperties,
        onCreatedRow: (tr: HTMLTableRowElement, rowData: GroupUser): void => {
          tr.querySelector('.switch input').addEventListener('click', (event) => {
            const decision = !(event.target as HTMLInputElement).checked;
            this.makeStatusChange(decision, rowData);
          }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
        }
      });
      table.init();
      this.table = table;
      this.scripts.push(this.table);
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.eventAbortController.abort();

    if (this.pkgListDialog) {
      this.pkgListDialog.dialog.hide();
      this.pkgListDialog.dialog.destroy();
    }
  }


  public onSelectUser(event: CustomEvent): void {
    this.selectedUsers = event?.detail?.value;
  }

  public addUserToGroup(): void {
    if (this.selectedUsers) {
      let areNewUsersAvailable = false;
      const detailsSelectedUsers = this.userList.filter(user => this.selectedUsers.includes(user.userId));

      if (detailsSelectedUsers && detailsSelectedUsers.length > 0) {
        const selectedUsersToAdd: GroupUser[] = detailsSelectedUsers.map(
          elem => {
            const selectedUserToAdd = this.groupUserList.find(user => user.userId === elem.userId && user.userRole === this.groupRoleType)

            const groupListAdd = {
              userId: elem.userId,
              userName: elem.userFirstName + ' ' + elem.userLastName,
              userEmail: elem.userEmail,
              userRole: this.groupRoleType,
              isSoftDeleted: false
            }

            if (!selectedUserToAdd) {
              this.groupUserList.push(groupListAdd);
              areNewUsersAvailable = true;
            }

            return groupListAdd;
          }
        )

        if (selectedUsersToAdd && selectedUsersToAdd.length > 0) {
          if (areNewUsersAvailable) {
            this.groupUserList = this.groupUserList.sort((a, b) => a.userEmail.localeCompare(b.userEmail));
            this.table.update(this.groupUserList);
          } else {
            this.notificationService.showNotification({
              title: 'User to be added is present in the list.',
            });
          }
        }
      }
    }
  }

  makeStatusChange(decision: boolean, user: GroupUser): void {
    const updateUser = [{
      userId: user.userId,
      userRole: user.userRole,
      isSoftDeleted: decision
    }];   

    // save to local table variable and table about the status change
    const currentGroupUserIndex = this.groupUserList.findIndex(elem => elem.userId === user.userId)
    if (currentGroupUserIndex != -1) {
      this.groupUserList[currentGroupUserIndex].isSoftDeleted = decision;
      this.table.update(this.groupUserList);
    }
  }

  public onEditGroupUsers(): void {
    this.isSaveVisible = true
    this.oldGroupUserList = JSON.parse(JSON.stringify(this.groupUserList)) //Deep copy old list for cancel handling
    this.table.dom.table.querySelectorAll('.switch input').forEach(switchElement => {
      (switchElement as HTMLInputElement).disabled = false;
    });

  }

  public onUpdateGroupUsers(): void {
    const modifiedOrAddedUsers: GroupUser[] = [];

    this.groupUserList.map(usr => {
      const oldUsr = this.oldGroupUserList.find(old => old.userId === usr.userId && old.userEmail === usr.userEmail)

      if (oldUsr) {
        if (oldUsr.isSoftDeleted !== usr.isSoftDeleted) {
          modifiedOrAddedUsers.push(usr); // Active state is changed
        }
      } else { //New user
        modifiedOrAddedUsers.push(usr);
      }
    });

    const updatePayload: UpdateGroupPayload = { groupUsers: modifiedOrAddedUsers, isSoftDeleted: false }; // Group is still active

    this.subscription.add(this.groupManagementService.updateGroup(this.groupId, updatePayload).subscribe({
      next: () => {
        this.updateUsers.next(modifiedOrAddedUsers);
        this.notificationService.showNotification({
          title: `Updated group successfully!`,
        });

        this.isSaveVisible = false
        this.table.dom.table.querySelectorAll('.switch input').forEach(switchElement => {
          (switchElement as HTMLInputElement).disabled = true;
        });
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.showNotification({
          title: error?.error?.responseMessage || `Error while updating the group!`,
          description: error?.error?.responseMessageDescription || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      }
    }));
  }

  public onCancel(): void {
    this.groupUserList = this.oldGroupUserList //Duplicate old list as current discarding local changes
    if (this.table) this.table.update(this.groupUserList);  
    this.isSaveVisible = false
    this.table.dom.table.querySelectorAll('.switch input').forEach(switchElement => {
      (switchElement as HTMLInputElement).disabled = true;
    });
  }
}
