import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PackageGroup, PackageMemberAction, PackageUserGroup } from 'src/app/projects/projects.interface';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { UserGroupInfoDialogComponent } from '../user-group-info-dialog/user-group-info-dialog.component';
import { AcceptancePackageService, RoleInPackage } from '../../../acceptance-package.service';
import { CustomerAcceptanceStatus } from 'src/app/projects/projects.interface';
@Component({
  selector: 'app-package-users',
  templateUrl: './package-users.component.html',
  styleUrls: ['./package-users.component.less']
})

export class PackageUsersComponent implements OnInit {
  @Input() packageName: string;
  @Input() packageStatus: string;
  userGroups: PackageUserGroup[];
  contributors: PackageUserGroup;
  approvers: PackageUserGroup;
  observers: PackageUserGroup;
  approverIconMap: Map<string, string>;
  showAwaitingLegend: boolean
  @Output() public approvalStatus = new EventEmitter();

  packageMemberAction = PackageMemberAction;

  constructor(
    private packageService: AcceptancePackageService,
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.approverIconMap = new Map([
      [PackageMemberAction.APPROVED, 'icon-check'],
      [PackageMemberAction.PENDING, 'icon-time'],
      [PackageMemberAction.REJECTED, 'icon-cross'],
      [PackageMemberAction.UNASSIGNED, 'icon-eye']
    ]);
    this.fetchPackageUsers();
  }

  /**
   * Fetch users details for active package.
   */
  fetchPackageUsers(): void {
    this.packageService.currentPackageUserGroups.subscribe({
      next: (packageUserGroups: PackageUserGroup[]) => {
        const actions = this.findAllByKey(packageUserGroups, 'userAction');        
        this.userGroups = packageUserGroups;
        this.contributors = this.userGroups.find(user => user.userRole === RoleInPackage.EricssonContributor);
        const approverList = this.userGroups.find(user => user.userRole === RoleInPackage.CustomerApprover);
        approverList.levels.sort((levelA, levelB) => levelA.levelId - levelB.levelId);
        this.approvers = approverList;
        this.observers = this.userGroups.find(user => user.userRole === RoleInPackage.CustomerObserver);

        const showApprovedLegend = actions.includes(PackageMemberAction.APPROVED);
        const showRejectedLegend = actions.includes(PackageMemberAction.REJECTED);
        const showPendingLegend = actions.includes(PackageMemberAction.PENDING);
        this.showAwaitingLegend = this.approvers.levels.find(lvl => lvl.userList && lvl.userList.length > 0 && !lvl.userList[0].userAction) !== undefined;
        const showAwaitingLegend = this.showAwaitingLegend;

        this.approvalStatus.emit({
          showApprovedLegend,
          showRejectedLegend,
          showPendingLegend,
          showAwaitingLegend,
        });

        // for Approver case, need make status icon based on this levelAggAction inside approver level
        this.updateLevelAggAction(this.packageStatus);
      },
      error: (error) => {
        console.error(error);
        // Do something to handle error
      },
    });

  }
  copyInputMessage(inputElement): void {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
  }

  viewUserGroup(group: PackageGroup): void {
    this.dialogService.createDialog(
      UserGroupInfoDialogComponent,
      { group }
    );
  }

  private findAllByKey(obj, keyToFind): any {
    return Object.entries(obj)
      .reduce((acc, [key, value]) => (key === keyToFind)
        ? (acc.concat(value))
        : (typeof value === 'object' && value)
          ? acc.concat(this.findAllByKey(value, keyToFind))
          : acc
        , []);
  }

  private updateLevelAggAction(packageStatus): any {
    try {
      // only when it Approved and Rejected , proceed to userAction / groupAction
      if (packageStatus === CustomerAcceptanceStatus.CustomerApproved || CustomerAcceptanceStatus.CustomerRejected) {
        // approver in loop , need to have levelAggAction, to know the level approval status
        if (this.approvers && this.approvers.levels) {
          let levelAggDetail = '';
          let levelAggAction = PackageMemberAction.UNASSIGNED;
          for (const approver of this.approvers.levels) {
            if (approver.userList) {
              const userWithAction = approver.userList.filter(elem => elem.userAction);
              if (userWithAction.length > 0) {
                // assumption : only one user will approve, so which ever have this field , consider that action value
                levelAggAction = userWithAction[0].userAction;
                levelAggDetail = 'Last status changed by: ' + userWithAction[0].name;
              }
            }
            if (approver.groupList) {
              const groupWithAction = approver.groupList.filter(elem => elem.groupAction);
              if (groupWithAction.length > 0) {
                // assumption : only one group will approve, so which ever have this field , consider that action value
                levelAggAction = groupWithAction[0].groupAction;
                levelAggDetail = 'Last status changed by: ' + groupWithAction[0].name;
              }
            }
            approver.levelAggAction = levelAggAction;
            approver.levelAggDetail = levelAggDetail;
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}
