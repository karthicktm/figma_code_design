import { AfterViewInit, Component, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectOnboardingService } from '../project-onboarding.service';
import { CustomerService } from 'src/app/customer-onboarding/customer.service';
import { map, Observable, Subscription, tap } from 'rxjs';
import { CustomerShort } from 'src/app/customer-onboarding/customer-onboarding.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { ApprovalRuleOption, ImportProjectsRequest, Project } from 'src/app/projects/projects.interface';
import { SelectComponent } from 'src/app/shared/select/select.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-import',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
  ],
  templateUrl: './project-import.component.html',
  styleUrl: './project-import.component.less'
})
export class ProjectImportComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('customerIdSelect') readonly customerIdSelectElementRef: SelectComponent;
  customers: CustomerShort[];
  projects: Project[];
  projectImportForm: FormGroup<{
    customerId: FormControl<string>,
    projectId: FormControl<string>,
    projectName: FormControl<string>,
    country: FormControl<string>,
    approvalRule: FormControl<ApprovalRuleOption>,
    workflowId: FormControl<string>,
    rulesetId: FormControl<string>,
    multiLevelType: FormControl<string>,
    reworkType: FormControl<string>,
  }>
  subscriptions = new Subscription();
  getAllCustomers: Observable<CustomerShort[]>;
  getProjectsBy: Observable<Project[]>;

  approvalRuleList: OptionWithValue[] = [
    { option: ApprovalRuleOption.ON, optionValue: ApprovalRuleOption.ON },
    { option: ApprovalRuleOption.OFF, optionValue: ApprovalRuleOption.OFF },
  ];

  multiLevelTypeList: OptionWithValue[] = [
    { option: 'Multi-level serial', optionValue: 'Serial' },
    { option: 'Multi-level parallel', optionValue: 'Parallel' },
  ];
  defaultMultiLevelType = this.multiLevelTypeList[0].optionValue;

  reworkTypeListSerial: OptionWithValue[] = [
    { option: 'Rework from 1st level', optionValue: 'RestartFromBeginning' },
    { option: 'Rework from rejected level', optionValue: 'RestartFromRejected' },
  ];
  reworkTypeListParallel: OptionWithValue[] = [
    { option: 'Rework from all levels', optionValue: 'RestartFromBeginning' },
    { option: 'Rework from rejected levels', optionValue: 'RestartFromRejected' },
  ];
  defaultReworkType = 'RestartFromRejected';

  workflows: Observable<OptionWithValue[]>;
  defaultWorkflow = signal('');

  acceptancePackageRules: Observable<OptionWithValue[]>;
  defaultAcceptancePackageRule = signal('');

  submitting = signal(false);

  get customerOptions(): OptionWithValue[] | undefined {
    return this.customers
      ? this.customers.map(customer => {
        return {
          option: `${customer.customerId} - ${customer.customerName}`,
          optionValue: customer.customerId,
        };
      })
      : undefined;
  }

  get projectOptions(): OptionWithValue[] | undefined {
    return this.projects
      ? this.projects.map(project => {
        return {
          option: `${project.projectId} - ${project.projectName}`,
          optionValue: project.projectId,
        };
      })
      : undefined;
  }

  get multiLevelType(): FormControl<string> {
    return this.projectImportForm.controls.multiLevelType;
  }

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private projectOnboardingService: ProjectOnboardingService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.projectImportForm = this.fb.group({
      customerId: this.fb.nonNullable.control('', { validators: [Validators.required] }),
      projectId: this.fb.nonNullable.control({ value: '', disabled: true }, { validators: [Validators.required] }),
      projectName: this.fb.control({ value: '', disabled: true }),
      country: this.fb.control({ value: '', disabled: true }),
      approvalRule: this.fb.nonNullable.control(undefined, { validators: [Validators.required] }),
      workflowId: this.fb.nonNullable.control('', { validators: [Validators.required] }),
      rulesetId: this.fb.nonNullable.control('', { validators: [Validators.required] }),
      multiLevelType: this.fb.nonNullable.control('', { validators: [Validators.required] }),
      reworkType: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    });
  }

  ngOnInit(): void {
    this.getAllCustomers = this.customerService.getAllCustomers().pipe(
      tap(customers => this.customers = customers),
    );
    const customerIdValueChanges = this.projectImportForm.controls.customerId.valueChanges.subscribe({
      next: customerId => {
        if (customerId && customerId.length > 0) this.getProjectsBy = this.projectOnboardingService.getProjectsByCustomerId({ customerId }).pipe(
          tap(projects => this.projects = projects),
          tap(() => this.projectImportForm.controls.projectId.enable()),
        );
      }
    });

    this.subscriptions.add(customerIdValueChanges);

    const projectIdValueChanges = this.projectImportForm.controls.projectId.valueChanges.subscribe({
      next: projectId => {
        const project = this.projects.find(project => projectId === project.projectId);
        if (project) {
          this.projectImportForm.controls.projectName.patchValue(project.projectName);
          this.projectImportForm.controls.country.patchValue(project.projectExecutionCountry);
        }
      }
    });

    this.subscriptions.add(projectIdValueChanges);

    const multiLevelTypeValueChanges = this.projectImportForm.controls.multiLevelType.valueChanges.subscribe({
      next: multiLevelType => {
        this.projectImportForm.controls.reworkType.setValue(this.defaultReworkType);
      }
    });

    this.subscriptions.add(multiLevelTypeValueChanges);

    this.workflows = this.projectOnboardingService.getAllWorkflows().pipe(
      map(res => res.map(workflow => {
        return {
          optionValue: workflow.workflowId,
          option: workflow.name
        };
      })),
      tap(res => {
        const first = res.find(() => true);
        if (first) {
          this.defaultWorkflow.set(first.optionValue);
          this.projectImportForm.controls.workflowId.setValue(this.defaultWorkflow());
        }
      }),
    );

    this.acceptancePackageRules = this.projectOnboardingService.getAllAcceptancePackageRules().pipe(
      map(res => res.map(rule => ({
        optionValue: rule.rulesetId,
        option: rule.name,
      }))),
      tap(res => {
        const first = res.find(() => true);
        if (first) {
          this.defaultAcceptancePackageRule.set(first.optionValue);
          this.projectImportForm.controls.rulesetId.setValue(this.defaultAcceptancePackageRule());
        }
      }),
    );
  }

  ngAfterViewInit(): void {
    this.projectImportForm.controls.approvalRule.setValue(ApprovalRuleOption.ON);
    this.projectImportForm.controls.multiLevelType.setValue(this.defaultMultiLevelType);
    this.projectImportForm.controls.reworkType.setValue(this.defaultReworkType);
  }

  ngOnDestroy(): void {
    this.subscriptions?.unsubscribe();
  }

  onSubmit(): void {
    this.submitting.set(true);
    const project = this.projectImportForm.getRawValue();
    const requestBody: ImportProjectsRequest = {
      customerId: project.customerId,
      projectId: project.projectId,
      approvalRule: project.approvalRule,
      workflowId: project.workflowId,
      acceptancePackageRuleId: project.rulesetId,
      approvalSequence: project.multiLevelType,
      reworkType: project.reworkType,
    }
    this.projectOnboardingService.importProject(requestBody).subscribe({
      next: () => {
        this.submitting.set(false);
        // clear form on success
        this.onReset();
        // notification for 20s , for user to react better
        // give own action for callback
        this.notificationService.showNotification({
          title: `Project imported successfully.`,
          description: 'Please click here to assign project admin for this project ',
          action: () => {
            this.router.navigate([`/project-onboarding`]).then((result) => {
              const assignProjectAdminDOM = document.querySelector('button#assign-project-admin-selected');
              if (assignProjectAdminDOM && project.projectId) {
                const customEvent = new CustomEvent('invoke', { detail: project.projectId })
                assignProjectAdminDOM.dispatchEvent(customEvent);
              }
            });
          },
          timeout: 20000,
        }, false);
      },
      error: (error => {
        this.submitting.set(false);
        this.notificationService.showNotification({
          title: `Failed to trigger project import.`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
        }, true);
      })
    });
  }

  onReset(): void {
    this.projectImportForm.reset();
    this.projectImportForm.controls.projectId.disable();
    this.customerIdSelectElementRef?.resetInput();
    this.projects = [];
    this.projectImportForm.controls.approvalRule.setValue(ApprovalRuleOption.ON);
    this.projectImportForm.controls.workflowId.setValue(this.defaultWorkflow());
    this.projectImportForm.controls.rulesetId.setValue(this.defaultAcceptancePackageRule());
    this.projectImportForm.controls.multiLevelType.setValue(this.defaultMultiLevelType);
    // reworkType is reset automatically when value of multiLevelType changes
  }
}
