import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy, effect, input } from '@angular/core';
import { GroupUser, GroupUsers, UpdateGroupPayload } from '../group-management-interfaces';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { Table } from '@eds/vanilla';
import { Subscription } from 'rxjs';
import { OPSUser } from 'src/app/user-management/user-management.interface';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { WarningDialogComponent } from 'src/app/warning-dialog/warning-dialog.component';
import { GroupManagementService } from '../group-management.service';
import { ActivatedRoute } from '@angular/router';
import { SelectMultiInputComponent } from 'src/app/shared/select-multi-input/select-multi-input.component';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { UserSession } from 'src/app/projects/projects.interface';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.less']
})
export class GroupDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('adminSelect') readonly adminSelectRef: SelectMultiInputComponent;
  @Input() isEditable: boolean;
  @Input() selectedGroup: GroupUsers;
  @Input() userList: OPSUser[];
  @Input() adminListOption: OptionWithValue[];
  @Output() updateUsers = new EventEmitter<GroupUser[]>();

  @ViewChild('groupUser') readonly groupUserTableElementRef: ElementRef<HTMLElement>

  isSoftDeletedGroup = input<boolean>()
  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();
  private eventAbortController = new AbortController();
  loader: boolean = false;

  table: Table;
  groupUserList: GroupUser[];
  oldGroupUserList: GroupUser[];
  selectedAdmins: string;
  warningDialog: WarningDialogComponent;
  groupId: string;
  isEditVisible: boolean = false;
  isSaveVisible: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private groupManagementService: GroupManagementService,
    private route: ActivatedRoute,
    private sessionStorage: SessionStorageService,
  ) {
    effect(() => {
      if (this.isSoftDeletedGroup() === undefined) return;
      this.groupUserList = this.groupUserList.filter(elem => elem.userRole === 'Project Admin').map(user => ({ ...user, isSoftDeleted: this.isSoftDeletedGroup() }));
      if (this.table) this.table.update(this.groupUserList);
    });
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
          tr.querySelector('.switch input').addEventListener('click', (event: Event) => {
            const inputElement = event.target as HTMLInputElement;
            if (inputElement.checked === false
              && this.groupUserList.filter(item => item.isSoftDeleted === true).length + 1 === this.groupUserList.length) {
              if (event) {
                event.preventDefault();
              }
              this.openDialogOnWarning();
            } else {
              const decision = !(event.target as HTMLInputElement).checked;
              this.makeStatusChange(decision, rowData);
            }
          }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
        }
      });
      table.init();
      this.table = table;
      this.scripts.push(this.table);
    }
  }

  ngOnInit(): void {
    const currentUser = this.sessionStorage.get<UserSession>(CacheKey.userSession).signum;
    this.groupUserList = this.selectedGroup.groupUsers.filter(elem => elem.userRole === 'Project Admin').sort((a, b) => a.userEmail.localeCompare(b.userEmail));
    this.groupId = this.route.snapshot.paramMap.get('id');
    this.isEditVisible = this.groupUserList.find(usr => usr.userId.toLocaleLowerCase() === currentUser.toLocaleLowerCase()) ? true : false
    this.isEditVisible = this.isEditVisible && this.isEditable
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.warningDialog) {
      this.warningDialog.dialog.hide();
      this.warningDialog.dialog.destroy();
    }

    this.eventAbortController.abort();
  }

  public onSelectAdmin(event: CustomEvent): void {
    this.selectedAdmins = event?.detail?.value;
  }

  public addUserToGroup(): void {
    if (this.selectedAdmins) {
      let areNewUsersAvailable = false;
      const detailsSelectedUsers = this.userList.filter(user => this.selectedAdmins.includes(user.userId));

      if (detailsSelectedUsers && detailsSelectedUsers.length > 0) {
        const selectedUsersToAdd: GroupUser[] = detailsSelectedUsers.map(
          elem => {
            const selectedUserToAdd = this.groupUserList.find(user => user.userId === elem.userId && user.userRole === 'Project Admin')

            const groupListAdd = {
              userId: elem.userId,
              userName: elem.userFirstName + ' ' + elem.userLastName,
              userEmail: elem.userEmail,
              userRole: 'Project Admin',
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

    // save the decision to groupUser component const as well
    // save to local table variable and table about the status change
    const currentGroupUserIndex = this.groupUserList.findIndex(elem => elem.userId === user.userId)
    if (currentGroupUserIndex != -1) {
      this.groupUserList[currentGroupUserIndex].isSoftDeleted = decision;
      this.table.update(this.groupUserList);
    }
  }

  public openDialogOnWarning(dialogData?: { title: string, message: string, disableRefresh?: boolean, actionOn?: string }): void {
    const data = dialogData || {
      title: 'Invalid',
      message: 'Each user group must have at least one group admin user',
      disableRefresh: true,
      enableClose: true,
    };
    const dialogComponentRef = this.dialogService.createDialog(WarningDialogComponent, data);
    this.warningDialog = dialogComponentRef.instance;
  }

  public onEditGroupAdmin(): void {
    this.isSaveVisible = true
    this.oldGroupUserList = JSON.parse(JSON.stringify(this.groupUserList)) //Deep copy old list for cancel handling
    this.table.dom.table.querySelectorAll('.switch input').forEach(switchElement => {
      (switchElement as HTMLInputElement).disabled = false;
    });
  }

  public onUpdateGroupAdmin(): void {
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
