import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { UserModel } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { SelectWithInputComponent } from 'src/app/shared/select-with-input/select-with-input.component';
import { OptionWithValue } from 'src/app/shared/select/select.interface';

interface UserOptionWithValue extends OptionWithValue {
  roleType: string[];
  /** Mapped userId if user type is User or groupId if user type is Group */
  id: string;
}

@Component({
  selector: 'app-user-section-form',
  templateUrl: './user-section-form.component.html',
  styleUrls: ['./user-section-form.component.less'],
})
export class UserSectionFormComponent implements OnInit {
  @ViewChild('contributors') readonly contributorsElement: SelectWithInputComponent;
  @ViewChildren('customerApprovers') readonly customerApproversElements: SelectWithInputComponent[];
  @ViewChild('customerObservers') readonly customerObserversElement: SelectWithInputComponent;

  @Input() packageForm?: FormGroup;
  @Input() detailsUsersForm?: FormGroup;
  @Input() isEdit: boolean;
  @Input() isAddUserInPackage: boolean;

  readonly MAX_APPROVER_LEVELS = 4;
  projectId: string;

  usersForm: FormGroup<{
    contributors: FormControl<UserModel[]>,
    multiLevelApprovals: FormControl<boolean>,
    customerApprovers: FormArray<FormControl<UserModel[]>>,
    customerObservers: FormControl<UserModel[]>,
  }>;
  originalUsers: {
    contributors: UserModel[],
    customerApprovers: UserModel[],
    customerObservers: UserModel[],
  };

  allUsers: UserOptionWithValue[];
  contributorsObservable: Observable<UserOptionWithValue[]>;
  customerApproversObservable: Observable<UserOptionWithValue[]>;
  customerObserversObservable: Observable<UserOptionWithValue[]>;

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.isEdit || this.isAddUserInPackage
      ? this.projectId = this.route.snapshot.parent.paramMap.get('id')
      : this.projectId = this.route.snapshot.paramMap.get('id');

    if (this.packageForm) {
      const step1FormGroup = this.packageForm.controls.step1 as FormGroup;
      this.usersForm = step1FormGroup.controls.users as FormGroup;
    }
    if (this.detailsUsersForm) {
      this.usersForm = this.detailsUsersForm;
      const originalUsers = this.detailsUsersForm.getRawValue();
      this.originalUsers = { ...originalUsers, customerApprovers: originalUsers.customerApprovers.flat() };
    }

    this.getAllProjectUsers()
      .pipe(
        tap(users => {
          this.allUsers = users;
          this.contributorsObservable = of(
            this.allUsers.filter(user => user.roleType.includes(RoleType.EricssonContributor))
          );
          this.customerApproversObservable = of(
            this.allUsers.filter(user => user.roleType.includes(RoleType.CustomerApprover))
          );
          this.customerObserversObservable = of(
            this.allUsers.filter(user => user.roleType.includes(RoleType.CustomerObserver))
          );
        })
      )
      .subscribe();
  }

  /**
   * Getter for the customer approvers form array
   */
  get approversFormArray(): FormArray<FormControl<UserModel[]>> {
    return this.usersForm.controls.customerApprovers;
  }

  /**
   *  Check if can add new level to the customer approvers form array
   * @param level
   * @returns
   */
  private canAddNewLevel(level: number): boolean {
    return (
      !this.isAddUserInPackage &&
      this.multiLevelApprovalsInput.value &&
      this.approversFormArray.controls[level].value &&
      this.approversFormArray.controls.length <= level + 1 &&
      this.approversFormArray.controls.length < this.MAX_APPROVER_LEVELS
    );
  }

  /**
   *  Check if can remove last level from the customer approvers form array
   * @returns
   */
  private canRemoveLastLevel(): boolean {
    // check if lats two levels are empty
    return (
      this.multiLevelApprovalsInput.value &&
      this.approversFormArray.controls[this.approversFormArray.length - 1]?.value?.length === 0 &&
      this.approversFormArray.controls[this.approversFormArray.length - 2]?.value?.length === 0
    );
  }

  /**
   * Get all project users.
   */
  private getAllProjectUsers(): Observable<UserOptionWithValue[]> {
    return this.projectsService.getAllProjectUsersAndGroups(this.projectId, [{ key: 'status', value: `${false}` }]).pipe(
      map(data =>
        // Filter active members only in addition to API filter attribute
        data.filter(member => member.status === false).flatMap(user => ({
          optionValue: user.internalId,
          option: user.name,
          roleType: user.roleType,
          id: user.userType === 'User' ? user.userId : user.groupId
        }))
      ),
      catchError((error: HttpErrorResponse) => {
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
      }),
    );
  }

  get contributorsInput(): FormControl<UserModel[]> {
    return this.usersForm.controls.contributors;
  }

  get multiLevelApprovalsInput(): FormControl<boolean> {
    return this.usersForm.controls.multiLevelApprovals;
  }

  get customerApproversInput(): FormArray<FormControl<UserModel[]>> {
    return this.usersForm.controls.customerApprovers;
  }

  get customerObserversInput(): FormControl<UserModel[]> {
    return this.usersForm.controls.customerObservers;
  }

  public onSelectContributor(selectedId: string): void {
    const userOption = this.contributorsElement.optionsWithValue.find(option => selectedId === option.optionValue);
    if (!this.usersForm.controls.contributors.value.find(entry => userOption.id === entry.id)) {
      const newEntry = { name: userOption.option, id: userOption.id };
      this.usersForm.controls.contributors.setValue([...this.usersForm.controls.contributors.value, newEntry]);
    }
    this.contributorsElement.resetInput();
  }

  public onSelectCustomerApprover(selectedId: string, level: number): void {
    const userOption = this.customerApproversElements.find(() => true).optionsWithValue.find(option => selectedId === option.optionValue);
    const userAlreadyAdded = this.approversFormArray.controls
      .find(control => control.value.find(entry => userOption.id === entry.id));

    const userAlreadyInObserver = this.usersForm.controls.customerObservers.value.find(entry => userOption.id === entry.id)

    // check if user already exists in other levels
    if (userAlreadyAdded) {
      this.notificationService.showNotification(
        {
          title: `Already added to package`,
          description: `User '${userOption.option}' has already been used in another approval level.`,
        },
        true
      );
    } else if (userAlreadyInObserver) {
      this.notificationService.showNotification(
        {
          title: `Already added to package`,
          description: `User '${userOption.option}' has already been added as observer.`,
        },
        true
      );
    } else {
      const newEntry = { name: userOption.option, id: userOption.id };
      this.approversFormArray.controls[level].setValue([
        ...this.approversFormArray.controls[level].value,
        newEntry,
      ]);

      // add new level if needed
      if (this.canAddNewLevel(level)) {
        this.approversFormArray.push(new FormControl([]));
      }
    }

    // reset input
    this.customerApproversElements.forEach(element => element.resetInput());

    // update form array validity
    this.approversFormArray.updateValueAndValidity();
  }

  public onSelectCustomerObserver(userId: string): void {
    const userOption = this.customerObserversElement.optionsWithValue.find(option => userId === option.optionValue);
    if (!this.usersForm.controls.customerObservers.value.find(entry => userOption.id === entry.id)) {
      if (this.approversFormArray.controls
        .find(control => control.value.find(entry => userOption.id === entry.id))) {
        this.notificationService.showNotification(
          {
            title: `Already added to package`,
            description: `User '${userOption.option}' has already been added as approver.`,
          },
          true
        );
      } else {
        const newEntry = { name: userOption.option, id: userOption.id };
        this.usersForm.controls.customerObservers.setValue([
          ...this.usersForm.controls.customerObservers.value,
          newEntry,
        ]);
      }
    }
    this.customerObserversElement.resetInput();
  }

  public onDeleteContributor(user: UserModel): void {
    const data = this.usersForm.controls.contributors.value;
    if (data.length > 1) {
      data.splice(this.usersForm.controls.contributors.value.findIndex(entry => user.id === entry.id), 1);
      this.usersForm.controls.contributors.setValue(data);
    }
  }

  public onDeleteCustomerApprover(user: UserModel, level: number): void {
    const data = this.approversFormArray.controls[level].value;
    data.splice(this.approversFormArray.controls[level].value.findIndex(entry => user.id === entry.id), 1);
    this.approversFormArray.controls[level].setValue(data);

    // push new level if needed
    if (this.canAddNewLevel(level)) {
      this.approversFormArray.push(new FormControl([]));
    }

    // if last 2 elements are empty, delete last one
    if (this.canRemoveLastLevel()) {
      this.approversFormArray.removeAt(this.approversFormArray.length - 1);
    }

    // update form array validity
    this.approversFormArray.updateValueAndValidity();
  }

  public onDeleteCustomerObserver(user: UserModel): void {
    const data = this.usersForm.controls.customerObservers.value;
    data.splice(this.usersForm.controls.customerObservers.value.findIndex(entry => user.id === entry.id), 1);
    this.usersForm.controls.customerObservers.setValue(data);
  }

  /**
   * Toggle multi level approvals
   */
  public toggleMultiLevelApprovals(): void {
    // toggle value
    this.usersForm.controls.multiLevelApprovals.setValue(!this.multiLevelApprovalsInput.value);

    // if multi level approvals is enabled, add new level
    if (this.multiLevelApprovalsInput.value && this.approversFormArray.controls[0].value.length > 0) {
      this.approversFormArray.push(new FormControl([]));
    }

    // if multi level approvals is disabled, clear all levels except the first one and keep the first one
    if (!this.multiLevelApprovalsInput.value) {
      // remove all levels except the first one
      while (this.approversFormArray.controls.length > 1) {
        this.approversFormArray.removeAt(1);
      }
    }
  }

  /**
   *  Check if the multilevel approvals checkbox should be disabled
   * @returns
   */
  public shouldDisableToggleMultiLevelApprovals(): boolean {
    return this.usersForm.controls.multiLevelApprovals.disabled || (this.approversFormArray.controls.length > 1 && this.approversFormArray.controls[1].value.length > 0);
  }

  /**
   *  Check if user can be deleted
   * @param index - index of the level
   * @returns
   */
  public canDelete(role: string, userToBeDeleted: UserModel, index?: number): boolean {
    if (this.originalUsers && this.originalUsers[role].find(user => user.id === userToBeDeleted.id)) return false;

    if (role === 'contributors') {
      return this.usersForm.controls.contributors.value.length > 1;
    }

    if (role === 'customerApprovers') {
      // if next level exists and not empty
      if (this.approversFormArray.controls[index + 1]?.value?.length > 0) {
        // allow delete if current level has at least one approver
        return this.approversFormArray.controls[index].value.length > 1;
      }
    }

    return true;
  }
}
