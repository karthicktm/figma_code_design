import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { Observable, Subscription, catchError, distinctUntilChanged, exhaustMap, map, of, tap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { AssignProjectUsersAndGroups, ProjectOnboardingService } from 'src/app/project-onboarding/project-onboarding.service';
import { GroupManagementService } from 'src/app/group-management/group-management.service';
import { ProjectsService } from '../../projects.service';
import { GroupsEndpoint, UsersEndpoint } from 'src/app/endpoint.interface';

interface ControlModel {
  role: FormControl<RoleType>;
  users: FormControl<string[]>;
  groups: FormControl<string[]>;
}

@Component({
  selector: 'app-onboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
  ],
  templateUrl: './onboard.component.html',
  styleUrl: './onboard.component.less'
})
export class OnboardComponent extends EDSDialogComponent {
  form: FormGroup<ControlModel>;
  roles = [
    RoleType.EricssonContributor,
    RoleType.ProjectAdmin,
    RoleType.CustomerApprover,
    RoleType.CustomerObserver,
  ];
  errorOnLoadingUsers: boolean;
  loadingUsers: boolean;
  errorOnLoadingGroups: boolean;
  loadingGroups: boolean;
  users: Observable<OptionWithValue[]>;
  groups: Observable<OptionWithValue[]>;
  customerId: string;
  private subscription: Subscription = new Subscription();
  userCount: number = 0;
  groupCount: number = 0;

  constructor(
    @Inject(DIALOG_DATA) public data: {
      submit: (onboard: AssignProjectUsersAndGroups) => {},
      projectId: string
    },
    private fb: FormBuilder,
    private projectOnboardingService: ProjectOnboardingService,
    private groupManagementService: GroupManagementService,
    private projectsService: ProjectsService
  ) {
    super();

    this.form = this.fb.group<ControlModel>({
      role: this.fb.control(undefined, { validators: [Validators.required] }),
      users: this.fb.control<string[]>(undefined),
      groups: this.fb.control<string[]>(undefined),
    }, { validators: [this.memberSelectionValidator] });

    this.form.controls.role.valueChanges.pipe(distinctUntilChanged(),
      tap(role => {
        this.generateUsersObservable(role, this.customerId);
        this.generateGroupsObservable(role, this.customerId);
      })
    ).subscribe();

    if (this.data.projectId) {
      this.subscription.add(this.projectsService.getProjectDetails(this.data.projectId).subscribe(project => {
        if (project !== undefined) {
          this.customerId = project.customerId;
        }
      }));
    }
  }

  private memberSelectionValidator: ValidatorFn = (control: FormGroup<ControlModel>): ValidationErrors | null => {
    const users = control.controls.users.value;
    const groups = control.controls.groups.value
    return (users === null || users.length === 0) && (groups === null || groups.length === 0) ? { users, groups } : null;
  };

  private generateGroupsObservable(roleType: RoleType, customerId: string): void {
    const projectId = this.data.projectId
    const userFilter = { roleType, customerId, projectId }

    const groups: Observable<OptionWithValue[]> = this.groupManagementService.getAllGroups(userFilter, GroupsEndpoint.groupsToOnboard).pipe(
      map(groups => groups.filter(
        item => item.isSoftDeleted === false
      ).map(group => {
        return { option: `${group.groupName} <${group.groupId}>`, optionValue: group.groupId };
      }))
    );

    const loadingGroupsStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loadingGroups = true;
        this.errorOnLoadingGroups = false;
      })
    );

    const groupsObservable = groups.pipe(
      tap(() => {
        this.loadingGroups = false;
        this.errorOnLoadingGroups = false;
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingGroups = false;
        this.errorOnLoadingGroups = true;
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      })
    );

    this.groups = loadingGroupsStartFlagging.pipe(
      exhaustMap(() => groupsObservable)
    );
  }

  private generateUsersObservable(roleType: RoleType, customerId : string): void {
    // since BE supports customerId filter, send query param to BE
    let userFilter = undefined
    const projectId = this.data.projectId
    if ((roleType === RoleType.CustomerApprover || roleType === RoleType.CustomerObserver) && customerId) {
      userFilter = { roleType, customerId, projectId }
    } else {
      userFilter = { roleType, projectId }
    }

    const users: Observable<OptionWithValue[]> = this.projectOnboardingService.getAllOPSUsers(userFilter, UsersEndpoint.usersToOnboard).pipe(
      map(users => users.map(user => {
          return { option: `${user.userFirstName} ${user.userLastName} <${user.userEmail || user.userId}>`, optionValue: user.userId };
        }))
    );

    const loadingUsersStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loadingUsers = true;
        this.errorOnLoadingUsers = false;
      })
    );

    const usersObservable = users.pipe(
      tap(() => {
        this.loadingUsers = false;
        this.errorOnLoadingUsers = false;
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingUsers = false;
        this.errorOnLoadingUsers = true;
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      })
    );

    this.users = loadingUsersStartFlagging.pipe(
      exhaustMap(() => usersObservable)
    );
  }

  retryLoading(): void {
    if (this.errorOnLoadingUsers) this.reloadUsers();
    if (this.errorOnLoadingGroups) this.reloadGroups();
  }

  private reloadUsers(): void {
    const users = this.users;
    this.loadingUsers = true;
    this.errorOnLoadingUsers = false;
    // Assign a new observable to cause async pipe to resubscribe.
    this.users = users.pipe(
      // To get a new observable from the original.
      tap(() => { })
    );
  }

  private reloadGroups(): void {
    const groups = this.groups;
    this.loadingGroups = true;
    this.errorOnLoadingGroups = false;
    // Assign a new observable to cause async pipe to resubscribe.
    this.groups = groups.pipe(
      // To get a new observable from the original.
      tap(() => { })
    );
  }

  onSubmit(): void {
    const result = this.form.getRawValue();
    const mappedPayload: AssignProjectUsersAndGroups = {
      usersAndGroups: [{
        roleType: result.role,
        userIds: result.users || [],
      }],
      groupIds: result.groups || [],
    }
    this.data.submit(mappedPayload);
    this.dialog.hide();
    this.subscription.unsubscribe();
  }

  public onSelectUser(event: CustomEvent): void {
    this.userCount = event?.detail?.value.length
    this.setDisableRoleSelection();
  }

  public onSelectGroup(event: CustomEvent): void {
    this.groupCount = event?.detail?.value.length
    this.setDisableRoleSelection();
  }

  private setDisableRoleSelection(): void {
    if (this.userCount || this.groupCount > 0) {
      this.form.controls.role.disable()
    } else {
      this.form.controls.role.enable();
    }
  }
}
