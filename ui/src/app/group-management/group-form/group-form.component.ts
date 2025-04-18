import { SelectComponent } from 'src/app/shared/select/select.component';
import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ReplaySubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomerService } from 'src/app/customer-onboarding/customer.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { AddGroupPayload, GroupManagementRoleType } from '../group-management-interfaces';
import { GroupManagementService } from '../group-management.service';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

@Component({
  selector: 'app-group-form',
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.less']
})
export class GroupFormComponent implements OnInit, OnDestroy {
  @Output() formClose: EventEmitter<string> = new EventEmitter();

  @ViewChild('groupStatus') readonly groupStatusElement: SelectComponent;
  @ViewChild('groupRoleType') readonly groupRoleTypeElement: SelectComponent;
  @ViewChild('customer') readonly customerElement: SelectComponent;

  groupForm: FormGroup;
  isEditGroupForm: boolean;
  selectedStatus: string;
  selectedRoleType: string;
  selectedCustomer: string;
  groupName: string;
  groupStatusOption: string[];
  groupRoleTypes: string[];
  customers: ReplaySubject<OptionWithValue[]> = new ReplaySubject(1);
  customerMap: { [key: string]: string };
  groupId: string;
  loader: boolean;

  private subscription: Subscription = new Subscription();

  constructor(
    private customerService: CustomerService,
    private groupManagementService: GroupManagementService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
  ) {
    this.groupForm = this.fb.group({
      groupRoleTypeSelect: ['', [Validators.required]],
      customerSelect: ['', [Validators.required]],
      groupnameInput: ['', [Validators.required, this.whiteSpaceValidator.bind(this)]],
    });
    this.groupStatusOption = ['Active', 'Inactive'];
    this.groupRoleTypes = Object.values(GroupManagementRoleType);
  }

  ngOnInit(): void {
    this.retrieveAllCustomers();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  public onSelectCustomer(selectedId: string): void {
    const userOption = this.customerElement.optionsWithValue.find(option => selectedId === option.optionValue);
    if (!this.groupForm.controls.customer.value.find(entry => userOption.id === entry.id)) {
      const newEntry = { name: userOption.option, id: userOption.id };
      this.groupForm.controls.contributors.setValue([...this.groupForm.controls.customer.value, newEntry]);
    }
    this.customerElement.resetInput();
  }

  public onAddUserGroup(): void {
    this.loader = true;
    const newAddGroup: AddGroupPayload = {
      groupName: this.groupname.value + ' - ' + this.customerMap[this.customerSelect.value],
      roleType: this.roleTypeSelect.value,
      customerId : this.customerSelect.value
    };

    this.groupManagementService.addGroup(newAddGroup).subscribe({
      next: (res) => {
        this.loader = false;
        this.notificationService.showNotification({
          title: 'Added group successfully!',
        });
        // clear all inputs only when new group is added successfully
        this.clearForm();
        this.formClose.emit(res.groupId);
      },
      error: (err: HttpErrorResponse) => {
        this.loader = false;
        if (err.status === HttpStatusCode.Conflict) {
          this.groupname.setErrors({ duplicate: true });
        }
        else {
          this.notificationService.showNotification({
            title: 'Error when adding group!',
            description: 'Please try again.'
          });
        }
      }
    })
  }

  onCancel(): void {
    this.formClose.emit(undefined);
  }

  retrieveAllCustomers(): void {
    this.customerService.getAllCustomers().pipe(
      tap(res => {
        this.customers.next(
          res.map(customer => {
            return {
              optionValue: customer.customerId,
              option: customer.customerName
            };
          })
        );
        this.customerMap = {};
        res.map(customer => this.customerMap[customer.customerId] = customer.customerName);
      }),
    ).subscribe();
  }

  get groupname(): FormControl<string> {
    return this.groupForm.get('groupnameInput') as FormControl<string>;
  }

  get customerSelect(): FormControl<string> {
    return this.groupForm.get('customerSelect') as FormControl<string>;
  }

  get roleTypeSelect(): FormControl<string> {
    return this.groupForm.get('groupRoleTypeSelect') as FormControl<string>;
  }

  private removeWhiteSpaceIssues(value: string): string {
    return value.trim().replace(/\s{2,}/, ' ');
  }

  correctGroupNameInput(): void {
    const value = this.groupname.value;
    if (typeof (value) === 'string') {
      this.groupname.setValue(this.removeWhiteSpaceIssues(value));
    };
  }

  private whiteSpaceValidator(control: AbstractControl): ValidationErrors | null {
    if (typeof (control.value) === 'string' && control.value.match(/^\s|\s{2}|\s$/g)) {
      return { whiteSpaceIssue: true };
    }
    return null;
  }

  private clearForm(): void {
    this.groupForm.reset();
    if (this.customerElement) {
      this.customerElement.resetInput();
    }
    if (this.groupRoleTypeElement) {
      this.groupRoleTypeElement.resetInput();
    }
    if (this.groupStatusElement) {
      this.groupStatusElement.resetInput();
    }
  }
}


