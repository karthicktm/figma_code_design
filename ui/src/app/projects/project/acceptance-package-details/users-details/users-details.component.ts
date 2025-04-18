import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, switchMap } from 'rxjs';
import { ComposeAcceptancePackageLevelUserRequest, ComposeAcceptancePackageUserRequest, CustomerAcceptanceStatus, PackageDetails, PackageUserGroup, SLAType, UserModel } from 'src/app/projects/projects.interface';
import { AcceptancePackageService } from '../../acceptance-package.service';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { ProjectsService } from 'src/app/projects/projects.service';
import { ActivatedRoute } from '@angular/router';
import { HttpStatusCode } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { IntegrateToB2B } from '../../package-view.interface';

@Component({
  selector: 'app-users-details',
  templateUrl: './users-details.component.html',
  styleUrls: ['./users-details.component.less']
})
export class UsersDetailsComponent implements OnInit, OnDestroy {
  public showApprovedLegend: boolean;
  public showRejectedLegend: boolean;
  public showPendingLegend: boolean;
  public showAwaitingLegend: boolean;
  @Input() packageDetails: PackageDetails;
  @Input() packageLinearId: string;

  private subscription: Subscription = new Subscription();

  projectId: string;
  usersInEdit: boolean;
  savingUser: boolean;
  AcceptanceStatus = CustomerAcceptanceStatus;
  IntegrateToB2B = IntegrateToB2B;

  usersForm = new FormGroup({
    contributors: new FormControl<UserModel[]>([], [Validators.required]),
    multiLevelApprovals: new FormControl({ value: false, disabled: true }),
    customerApprovers: new FormArray(
      [
        new FormControl<UserModel[]>([], [Validators.required]), // init first approver
      ],
      [Validators.required, Validators.minLength(1), Validators.maxLength(6)]
    ),
    customerObservers: new FormControl<UserModel[]>([]),
  });

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectsService,
    private packageService: AcceptancePackageService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.parent.paramMap.get('id');
    this.mpaUsersToFormData(this.packageDetails.users);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public approvalStatus(event): void {
    this.showApprovedLegend = event.showApprovedLegend;
    this.showRejectedLegend = event.showRejectedLegend;
    this.showPendingLegend = event.showPendingLegend;
    this.showAwaitingLegend = event.showAwaitingLegend;
  }

  public saveUserEdit(): void {
    const isMultiLevelAcceptance = this.packageDetails.isMultiLevelAcceptance;
    let users: ComposeAcceptancePackageUserRequest[];
    let levels: ComposeAcceptancePackageLevelUserRequest[];
    if (!isMultiLevelAcceptance) {
      users = [];
      levels = null;
      // map users of single level approval to request body
      const contributors: ComposeAcceptancePackageUserRequest = {
        userList: this.usersForm.controls.contributors.value?.map(user => user.id),
        userRole: RoleType.EricssonContributor,
      };
      if (contributors.userList.length > 0) {
        users.push(contributors);
      }

      const customerApprovers: ComposeAcceptancePackageUserRequest = {
        userList: this.usersForm.controls.customerApprovers.value?.map(level => level.map(user => user.id)),
        userRole: RoleType.CustomerApprover,
      };
      if (customerApprovers.userList.length > 0) {
        users.push(customerApprovers);
      }

      const customerObservers: ComposeAcceptancePackageUserRequest = {
        userList: this.usersForm.controls.customerObservers.value?.map(user => user.id),
        userRole: RoleType.CustomerObserver,
      };
      if (customerObservers.userList.length > 0) {
        users.push(customerObservers);
      }
    } else {
      users = null;
      levels = [];
      // mpa users to level schema in multi level approval
      const contributorLevel: ComposeAcceptancePackageLevelUserRequest = {
        levelId: 0,
        userList: this.usersForm.controls.contributors.value?.map(user => user.id),
        userRole: RoleType.EricssonContributor,
      };
      if (contributorLevel.userList.length > 0) {
        levels.push(contributorLevel);
      }

      const customerApproverLevels: ComposeAcceptancePackageLevelUserRequest[] = this.usersForm.controls.customerApprovers.value?.filter(level => level.length > 0)
        .map(
          (level, index) => ({
            levelId: index + 1,
            userList: level.map(user => user.id),
            userRole: RoleType.CustomerApprover,
          })
        );
      if (customerApproverLevels.length > 0) {
        levels.push(...customerApproverLevels);
      }

      const customerObserverLevel: ComposeAcceptancePackageLevelUserRequest = {
        levelId: 1,
        userList: this.usersForm.controls.customerObservers.value?.map(user => user.id),
        userRole: RoleType.CustomerObserver,
      };
      if (customerObserverLevel.userList.length > 0) {
        levels.push(customerObserverLevel);
      }
    }

    this.subscription.add(
      this.projectService.patchAcceptancePackageAddUser(this.projectId, this.packageLinearId, { users, levels }).pipe(
        switchMap(() => this.projectService.getAcceptancePackage(this.packageLinearId)),
      )
        .subscribe({
          next: (packageDetails) => {
            this.savingUser = false;
            this.usersInEdit = false;
            this.notificationService.showNotification({
              title: 'New users added successfully!',
            });
            const users = packageDetails.users;
            this.packageService.currentPackageUserGroups.next(users);
            this.mpaUsersToFormData(users);
          },
          error: err => {
            this.savingUser = false;
            if (
              err.status === HttpStatusCode.BadGateway ||
              err.status === HttpStatusCode.ServiceUnavailable ||
              !navigator.onLine
            ) {
              this.notificationService.showNotification(
                {
                  title: `Error while adding user into acceptance package!`,
                  description:
                    err.error.responseMessageDescription || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
                },
                true
              );
            } else {
              this.notificationService.showNotification(
                {
                  title: `Error while adding user into acceptance package!`,
                  description: err.error.responseMessageDescription || 'Click to open the FAQ doc for further steps.',
                },
                true
              );
            }
          },
        })
    );
  }

  getSLATypeDescription(type: string): string {
    switch (type) {
      case SLAType.LevelSLA: return 'SLA applicable for each level';
      case SLAType.PackageSLA: return 'SLA applicable for overall package';
    }
  }

  getReworkTypeDescription(type: string): string {
    switch (type) {
      case 'RestartFromBeginning': return 'Rework from 1st level';
      case 'RestartFromRejected': return 'Rework from rejected level';
      case 'ReworkForAllLevels': return 'Rework for all levels';
      case 'ReworkForRejectedLevels': return 'Rework for rejected levels';
    }
  }

  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  private mpaUsersToFormData(users: PackageUserGroup[]): void {
    const contributors = users
      .filter(user => user.userRole === RoleType.EricssonContributor)
      .flatMap(users => [...users.userList || [], ...users.groupList || []])
      .map(user => ({ name: user.name, id: user['userId'] || user['groupId'] }));
    const customerApprovers = users
      .filter(user => user.userRole === RoleType.CustomerApprover)
      .flatMap(users => users.levels)
      .sort((levelA, levelB) => levelA.levelId - levelB.levelId)
      .map(users => [...users.userList || [], ...users.groupList || []])
      .map(users => users.map(user => ({ name: user.name, id: user['userId'] || user['groupId'] })));
    const customerObservers = users
      .filter(user => user.userRole === RoleType.CustomerObserver)
      .flatMap(users => [...users.userList || [], ...users.groupList || []])
      .map(user => ({ name: user.name, id: user['userId'] || user['groupId'] }));

    if (customerApprovers.length > 1) {
      for (let index = 0; index < customerApprovers.length - 1; index++) {
        this.usersForm.controls.customerApprovers.push(new FormControl([]));
      }
    }
    const multiLevelApprovals = this.packageDetails.isMultiLevelAcceptance;

    this.usersForm.patchValue({
      multiLevelApprovals,
      contributors,
      customerApprovers,
      customerObservers,
    });
  }
}
