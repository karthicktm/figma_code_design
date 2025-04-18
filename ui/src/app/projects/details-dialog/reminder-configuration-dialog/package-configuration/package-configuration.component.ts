import { CommonModule } from '@angular/common';
import { Component, signal, OnDestroy, OnInit, input, effect } from '@angular/core';
import { FormControl, Validators, ValidatorFn, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AuthorizationService, ToolPermission } from 'src/app/auth/authorization.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { PackageConfiguration, SLAType } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';

interface ConfigurationForm {
  sla: FormControl<number>;
  slaType: FormControl<SLAType>;
  acceptanceReminder: FormControl<boolean>;
  daysReminder: FormControl<number>;
  additionalEmails: FormControl<string>;
  deemedAcceptance: FormControl<boolean>;
  reuseEvidences: FormControl<boolean>;
}

@Component({
  selector: 'app-package-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './package-configuration.component.html',
  styleUrl: './package-configuration.component.less'
})
export class PackageConfigurationComponent implements OnInit, OnDestroy {
  protected readonly projectId = input<string>();
  protected readonly fetchingConfigurationError = input<boolean>();
  protected readonly configuration = input<PackageConfiguration>();
  private subscription: Subscription = new Subscription();

  protected readonly infoText = 'There is no default SLA (Service level agreement). User must select the number of SLA days while customizing the configuration.';
  SLAType = SLAType;
  ToolPermission = ToolPermission;
  public isEdit: boolean = false;

  // min and max SLA constants
  readonly MIN_SLA_DAYS = 1;
  readonly MAX_SLA_DAYS = 180;

  public configForm = this.formBuilder.group<ConfigurationForm>({
    sla: this.formBuilder.control(null, [Validators.min(this.MIN_SLA_DAYS), Validators.max(this.MAX_SLA_DAYS)]),
    slaType: this.formBuilder.control({ value: null, disabled: true }),
    acceptanceReminder: this.formBuilder.control({ value: null, disabled: true }),
    daysReminder: this.formBuilder.control({ value: null, disabled: true }, [Validators.min(this.MIN_SLA_DAYS)]),
    additionalEmails: this.formBuilder.control({ value: null, disabled: true }),
    deemedAcceptance: this.formBuilder.control({ value: null, disabled: true }),
    reuseEvidences: this.formBuilder.control(false),
  });

  private maxValidator: ValidatorFn;
  saving = signal(false);

  constructor(
    private formBuilder: FormBuilder,
    private projectService: ProjectsService,
    private notificationService: NotificationService,
    private authorizationService: AuthorizationService,
  ) {
    effect(() => {
      const configuration = this.configuration();
      const reuseEvidences = configuration.reuseEvidences;
      if (reuseEvidences) this.reuseEvidences.disable();
      this.configForm.patchValue({
        sla: configuration.sla,
        slaType: configuration.slaType,
        acceptanceReminder: configuration.acceptanceReminder,
        daysReminder: configuration.daysReminder,
        additionalEmails: configuration.additionalEmails,
        deemedAcceptance: configuration.deemedAcceptance,
        reuseEvidences,
      });
    });
  }

  ngOnInit(): void {
    const slaValueChanges = this.sla.valueChanges.subscribe(sla => {
      // acceptanceReminder and further 2 options are allowed if SLA days are more than 1
      if (sla !== null && sla > 1) {
        this.slaType.enable();
        if (this.slaType.value === null) {
          this.slaType.setValue(SLAType.LevelSLA);
          this.slaType.addValidators(Validators.required);
          this.slaType.updateValueAndValidity();
        }

        this.acceptanceReminder.enable();
        this.acceptanceReminder.addValidators(Validators.required);
        this.acceptanceReminder.updateValueAndValidity();

        if (this.maxValidator) {
          this.daysReminder.removeValidators(this.maxValidator);
          this.maxValidator = undefined;
        }
        this.maxValidator = Validators.max(this.sla.value - 1);
        this.daysReminder.addValidators(this.maxValidator);
        this.daysReminder.updateValueAndValidity();
      } else {
        this.slaType.setValue(null);
        this.slaType.disable();

        this.acceptanceReminder.setValue(null);
        this.acceptanceReminder.disable();

        this.daysReminder.setValue(null);
        this.daysReminder.disable();

        this.additionalEmails.setValue(null);
        this.additionalEmails.disable();

        if (this.maxValidator) {
          this.daysReminder.removeValidators(this.maxValidator);
          this.daysReminder.updateValueAndValidity();
          this.maxValidator = undefined;
        }
      }

      // deemedAcceptance is enabled if SLA days are more than 0
      if (sla !== null && sla > 0) {
        this.deemedAcceptance.enable();
      } else {
        this.deemedAcceptance.setValue(null);
        this.deemedAcceptance.disable();
      }
    });
    this.subscription.add(slaValueChanges);

    const acceptanceReminderValueChanges = this.acceptanceReminder.valueChanges.subscribe(allowReminder => {
      if (allowReminder !== null && allowReminder) {
        this.daysReminder.enable();
        this.daysReminder.addValidators(Validators.required);
        this.daysReminder.updateValueAndValidity();

        this.additionalEmails.enable();
      } else {
        this.daysReminder.setValue(null);
        this.daysReminder.disable();

        this.additionalEmails.setValue(null);
        this.additionalEmails.disable();
      }
    });
    this.subscription.add(acceptanceReminderValueChanges);

    // this.fetchConfiguration();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  get sla(): FormControl<number> {
    return this.configForm.controls.sla;
  }

  get slaType(): FormControl<SLAType> {
    return this.configForm.controls.slaType;
  }

  get acceptanceReminder(): FormControl<boolean> {
    return this.configForm.controls.acceptanceReminder;
  }

  get daysReminder(): FormControl<number> {
    return this.configForm.controls.daysReminder;
  }

  get additionalEmails(): FormControl<string> {
    return this.configForm.controls.additionalEmails;
  }

  get deemedAcceptance(): FormControl<boolean> {
    return this.configForm.controls.deemedAcceptance;
  }

  get reuseEvidences(): FormControl<boolean> {
    return this.configForm.controls.reuseEvidences;
  }

  resetDefaults(): void {
    this.configForm.patchValue({
      sla: null,
      slaType: null,
      acceptanceReminder: null,
      daysReminder: null,
      additionalEmails: null,
      deemedAcceptance: null,
    });
    if (!this.reuseEvidences.disabled) this.reuseEvidences.setValue(false);
  }

  saveConfiguration(): void {
    this.saving.set(true);
    this.subscription.add(this.projectService.savePackageConfiguration(this.projectId(), this.configForm.getRawValue()).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.result !== 'Failed') {
          this.notificationService.showNotification({
            title: 'Acceptance package configuration saved successfully!',
          });
          this.isEdit = false;
        }
        else {
          this.notificationService.showNotification({
            title: `Error while saving acceptance package configuration!`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
          }, true);
        }

      },
      error: (error) => {
        this.saving.set(false);
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error status: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showNotification({
          title: `Error while saving acceptance package configuration!`,
          description: `${errorMessage
            || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'}`,
        }, true);
      }
    }));
  }

  getSLATypeDescription(type: SLAType): string {
    switch (type) {
      case SLAType.LevelSLA: return 'SLA applicable for each level';
      case SLAType.PackageSLA: return 'SLA applicable for overall package';
    }
  }

  updateSLAType(value: boolean): void {
    this.slaType.setValue(value ? SLAType.LevelSLA : SLAType.PackageSLA);
  }

  isUserAuthorized(permission: string): Observable<boolean> {
    return this.authorizationService.isUserAuthorized(permission);
  }
}
