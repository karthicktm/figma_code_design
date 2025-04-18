import { HttpStatusCode } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, computed, effect, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Wizard } from '@eds/vanilla';
import { ReplaySubject, Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/confirmation-dialog/confirmation-dialog.component';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { NavigationService } from 'src/app/shared/navigation.service';
import { ProjectsService } from '../../projects.service';
import { ComposeAcceptancePackageLevelUserRequest, ComposeAcceptancePackageRequest, ComposeAcceptancePackageUserRequest, Evidence, PackageDetails, PackageLineItem, PackageNetworkElement, PackageTaxonomy, PackageWorkItem, SubmitAcceptancePackagesRequest, UserModel, UserSession } from '../../projects.interface';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { CreateSubmitDialogMessageComponent } from './create-submit-dialog-message/create-submit-dialog-message.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppConfigKey } from 'src/app/app.component';
import { SelectOptions } from './acceptance-package-form-step5/acceptance-package-form-step5.component';

export interface Model {
  isMilestoneAcceptance: FormControl<boolean>;
  step1: FormGroup<{
    packageDetails: FormGroup<{
      nameInput: FormControl<string>;
      scopeInput: FormControl<string>;
      slaDaysInput: FormControl<string>;
      descriptionInput: FormControl<string>;
      integrateToB2B: FormControl<boolean>;
    }>;
    users: FormGroup<{
      contributors: FormControl<UserModel[]>;
      multiLevelApprovals: FormControl<boolean>;
      customerApprovers: FormArray<FormControl<UserModel[]>>;
      customerObservers: FormControl<UserModel[]>;
    }>;
  }>;
  step2: FormGroup<{
    multiSelectOption: FormControl<string>;
    multiSites: FormControl<string[]>;
    multiWorkplans: FormControl<string[]>;
    milestoneIds: FormControl<string[]>;
  }>;
  step3: FormGroup<{ lineItemIds: FormControl<string[]>; networkElements: FormControl<PackageNetworkElement[]>; workplans: FormControl<PackageWorkItem[]>; }>;
  step4: FormGroup<{ evidences: FormGroup<{ file: FormControl<any[]>; }>; }>;
}

@Component({
  selector: 'app-acceptance-package-new',
  templateUrl: './acceptance-package-new.component.html',
  styleUrls: ['./acceptance-package-new.component.less'],
})
export class AcceptancePackageNewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('newPackageWizard')
  readonly newPackageWizardElementRef: ElementRef<HTMLElement>;
  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();
  private wizard: Wizard;
  processing: boolean;
  projectId: string;
  packageId: string;
  isCreateDone: boolean;
  isCreateSubmitDone: boolean;
  doLITableReset: ReplaySubject<boolean> = new ReplaySubject(1);

  @Input() currentPackage: {
    details: PackageDetails,
    taxonomy: PackageTaxonomy,
    lineItems: PackageLineItem[],
  };
  @Input() isEdit: boolean;
  @Input() evidences: Evidence[];

  packageForm: FormGroup<Model> = new FormGroup({
    isMilestoneAcceptance: new FormControl(false),
    step1: new FormGroup({
      packageDetails: new FormGroup({
        nameInput: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]),
        scopeInput: new FormControl('', [Validators.minLength(1), Validators.maxLength(255)]),
        slaDaysInput: new FormControl('', [Validators.required, Validators.min(1)]),
        descriptionInput: new FormControl('', [Validators.minLength(1), Validators.maxLength(1024)]),
        integrateToB2B: new FormControl<boolean>(false),
      }),
      users: new FormGroup({
        contributors: new FormControl<UserModel[]>([], [Validators.required]),
        multiLevelApprovals: new FormControl(false),
        customerApprovers: new FormArray(
          [
            new FormControl<UserModel[]>([], [Validators.required]), // init first approver
          ],
          [Validators.required, Validators.minLength(1), Validators.maxLength(6)]
        ),
        customerObservers: new FormControl<UserModel[]>([]),
      }),
    }),
    step2: new FormGroup({
      multiSelectOption: new FormControl(''),
      multiSites: new FormControl<string[]>([]),
      multiWorkplans: new FormControl<string[]>([]),
      milestoneIds: new FormControl<string[]>([]),
    }),
    step3: new FormGroup({
      lineItemIds: new FormControl<string[]>([]),
      networkElements: new FormControl<PackageNetworkElement[]>([]),
      workplans: new FormControl<PackageWorkItem[]>([]),
    }),
    step4: new FormGroup({
      evidences: new FormGroup({
        file: new FormControl([]),
      }),
    }),
  });
  wizardIsLoaded = false;

  private projectsShortObservable = this.projectService.getAllProjectsShort({ projectId: { columnName: this.route.parent.snapshot.params.id, searchText: this.route.parent.snapshot.params.id, sortingIndex: 0, sortingOrder: '' } });
  private projects = toSignal(this.projectsShortObservable);
  protected isTransferEnabledCustomer = computed(() => {
    const projects = this.projects();
    if (projects === undefined) return false;
    const project = projects?.find(entry => entry.projectId === this.projectId);
    const transferEnabledCustomers = localStorage.getItem(AppConfigKey.transferEnabledCustomers).split(',').map(item => item.trim());
    return transferEnabledCustomers?.includes(project?.customerId);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService,
    private navigationService: NavigationService,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
    private sessionStorage: SessionStorageService,
    private projectService: ProjectsService,
  ) {
    // Ensure the integrateToB2B control is disabled by default
    this.packageForm.controls.step1.controls.packageDetails.controls.integrateToB2B.disable();
    effect(() => {
      const isTransferEnabledCustomer = this.isTransferEnabledCustomer();
      if (isTransferEnabledCustomer) this.packageForm.controls.step1.controls.packageDetails.controls.integrateToB2B.enable();
      else this.packageForm.controls.step1.controls.packageDetails.controls.integrateToB2B.disable();
    });
  }

  ngOnInit(): void {
    let isInitializing = true;
    if (this.isEdit) {
      this.route.parent.paramMap.subscribe((params: ParamMap) => (this.projectId = params.get('id')));
      this.route.paramMap.subscribe((params: ParamMap) => (this.packageId = params.get('id')));

      const lineItems = this.currentPackage.lineItems;
      const lineItemIds = lineItems.map(lineItem => lineItem.internalId);
      const contributors = this.currentPackage.details.users
        .filter(user => user.userRole === RoleType.EricssonContributor)
        .flatMap(users => [...users.userList || [], ...users.groupList || []])
        .map(user => ({ name: user.name, id: user['userId'] || user['groupId'] }));
      const customerApprovers = this.currentPackage.details.users
        .filter(user => user.userRole === RoleType.CustomerApprover)
        .flatMap(users => users.levels)
        .sort((levelA, levelB) => levelA.levelId - levelB.levelId)
        .map(users => [...users.userList || [], ...users.groupList || []])
        .map(users => users.map(user => ({ name: user.name, id: user['userId'] || user['groupId'] })));
      const customerObservers = this.currentPackage.details.users
        .filter(user => user.userRole === RoleType.CustomerObserver)
        .flatMap(users => [...users.userList || [], ...users.groupList || []])
        .map(user => ({ name: user.name, id: user['userId'] || user['groupId'] }));

      if (customerApprovers.length > 1) {
        for (let index = 0; index < customerApprovers.length - 1; index++) {
          this.packageForm.controls.step1.controls.users.controls.customerApprovers.push(new FormControl([]));
        }
      }
      const multiLevelApprovals = this.currentPackage.details.isMultiLevelAcceptance;

      let milestoneIds: string[];
      if (this.currentPackage.details.isMilestoneAcceptance) {
        const milestoneIdAttr = this.currentPackage.details.extendedAttributes?.find(attr => attr.attributeName === 'milestoneInternalIds');
        if (milestoneIdAttr) milestoneIds = milestoneIdAttr.attributeValue.split(',');
      }

      const isWorkplanBased = this.currentPackage.details.isWorkplanBased;
      this.packageForm.patchValue({
        isMilestoneAcceptance: this.currentPackage.details.isMilestoneAcceptance,
        step1: {
          packageDetails: {
            nameInput: this.currentPackage.details.name,
            scopeInput: this.currentPackage.details.packageType,
            slaDaysInput: this.currentPackage.details.sla,
            descriptionInput: this.currentPackage.details.description,
            integrateToB2B: this.currentPackage.details.integrateToB2B,
          },
          users: {
            multiLevelApprovals,
            contributors,
            customerApprovers,
            customerObservers,
          }
        },
        step2: {
          multiSelectOption: isWorkplanBased ? SelectOptions.WORKPLAN : SelectOptions.SITE,
          multiSites: isWorkplanBased ? [] : this.currentPackage.taxonomy?.networkElements.map(data => data.networkElementId),
          multiWorkplans: isWorkplanBased ? this.currentPackage.taxonomy?.workplans.map(data => data.workItemId) : [],
          milestoneIds: milestoneIds
        },
        step3: {
          lineItemIds,
          networkElements: isWorkplanBased ? [] : this.currentPackage.taxonomy.networkElements,
          workplans: isWorkplanBased ? this.currentPackage.taxonomy.workplans : [],
        },
        step4: {
          evidences: {
            file: this.evidences.map(evidence => evidence.internalId),
          }
        },
      });

      this.packageForm.controls.step2.controls.multiSelectOption.disable();
      isInitializing = false;
    } else {
      this.route.paramMap.subscribe((params: ParamMap) => (this.projectId = params.get('id')));
      this.route.queryParamMap.subscribe((params: ParamMap) => {
        const type = params.get('type');
        if (type && type === 'milestones') {
          this.packageForm.patchValue({
            isMilestoneAcceptance: true
          });
          this.router.navigate([], { queryParams: null, replaceUrl: true }); //To remove the query param so it's not preserved
        }
      });

      const userSession = this.sessionStorage.get<UserSession>(CacheKey.userSession);
      this.packageForm.patchValue({
        step1: {
          users: {
            contributors: [{ name: `${userSession.firstName} ${userSession.lastName}`, id: userSession.signum }]
          }
        }
      });
    }

    if (this.isMilestoneAcceptance) {
      this.packageForm.controls.step2.controls.milestoneIds.addValidators([Validators.required]);
      this.packageForm.controls.step2.controls.milestoneIds.updateValueAndValidity();
    } else {
      this.packageForm.controls.step3.controls.lineItemIds.addValidators([Validators.required]);
      this.packageForm.controls.step3.controls.lineItemIds.updateValueAndValidity();
    }

    const multiSelectOptionValueChanges = this.packageForm.controls.step2.controls.multiSelectOption.valueChanges.subscribe((option) => {
      if (!this.isEdit) {
        if (option === SelectOptions.SITE) {
          this.packageForm.controls.step3.controls.lineItemIds.patchValue([]);
          this.packageForm.controls.step2.controls.multiWorkplans.patchValue([]);
          this.packageForm.controls.step2.controls.multiWorkplans.removeValidators(Validators.required);
          this.packageForm.controls.step2.controls.multiWorkplans.updateValueAndValidity();
          this.packageForm.controls.step2.controls.multiSites.addValidators([Validators.required]);
          this.packageForm.controls.step2.controls.multiSites.updateValueAndValidity();
        } else if (option === SelectOptions.WORKPLAN) {
          this.packageForm.controls.step3.controls.lineItemIds.patchValue([]);
          this.packageForm.controls.step2.controls.multiSites.patchValue([]);
          this.packageForm.controls.step2.controls.multiSites.removeValidators(Validators.required);
          this.packageForm.controls.step2.controls.multiSites.updateValueAndValidity();
          this.packageForm.controls.step2.controls.multiWorkplans.addValidators([Validators.required]);
          this.packageForm.controls.step2.controls.multiWorkplans.updateValueAndValidity();
        } else {
          console.error('Selected option not allowed', option);
          setTimeout(() => {
            this.packageForm.controls.step2.setErrors({ 'invalid': true });
          });
        }
        this.doLITableReset.next(true);
      } else if (isInitializing) {
        if (option === SelectOptions.SITE) {
          this.packageForm.controls.step2.controls.multiSites.addValidators([Validators.required]);
          this.packageForm.controls.step2.controls.multiSites.updateValueAndValidity();
        } else if (option === SelectOptions.WORKPLAN) {
          this.packageForm.controls.step2.controls.multiWorkplans.addValidators([Validators.required]);
          this.packageForm.controls.step2.controls.multiWorkplans.updateValueAndValidity();
        } else {
          console.error('Selected option not allowed', option);
          setTimeout(() => {
            this.packageForm.controls.step2.setErrors({ 'invalid': true });
          });
        }
      }
    });
    this.subscription.add(multiSelectOptionValueChanges);
  }

  ngAfterViewInit(): void {
    // init eds wizard
    this.wizard = new Wizard(this.newPackageWizardElementRef.nativeElement);
    this.wizard.init();
    this.scripts.push(this.wizard);
    this.wizardIsLoaded = true;
  }


  public findAllByKey<T>(obj: T | T[], keyToFind: string): T[] {
    return Object.entries(obj)
      .reduce((acc, [key, value]) => (key === keyToFind)
        ? (acc.concat(value))
        : (typeof value === 'object' && value)
          ? acc.concat(this.findAllByKey(value, keyToFind))
          : acc
        , []);
  }

  ngOnDestroy(): void {
    this.scripts.forEach(script => {
      script.destroy();
    });
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  get isMilestoneAcceptance(): boolean {
    return this.packageForm.controls.isMilestoneAcceptance.value;
  }

  /**
   * check if current step is invalid
   * @param step number
   * @returns boolean
   **/
  currentStepIsInvalid(): boolean {
    if (!this.wizardIsLoaded) {
      return false;
    }

    const formGroup = this.packageForm.controls[`step${this.currentStep}`];
    return formGroup.invalid;
  }

  /**
   * Get current step
   */
  get currentStep(): number {
    // wizard steps are 0-based
    return this.wizard.steps.state.currentStep + 1;
  }

  /**
   * Go to next step
   * Validate current step
   * @returns void
   **/
  onNextStep(): void {
    const formGroup = this.packageForm.controls[`step${this.currentStep}`];
    formGroup.markAllAsTouched();
    // validate form group of current step
    if (this.currentStepIsInvalid()) {
      this.notificationService.showNotification(
        {
          title: `This step contains invalid form fields!`,
          description: 'Please review the wizard steps and fix the errors.',
        },
        true
      );
      return;
    }
    this.wizard.goToStep(this.currentStep);
  }

  onCreateAndSubmit(): void {
    // set up callback flow , after click OK in the dialog
    const dialogData: DialogData = { dialogueTitle: 'Create and submit progress', show: APICallStatus.Loading };
    const dialogMessage = this.dialogService.createDialog(CreateSubmitDialogMessageComponent, dialogData);
    dialogMessage.instance.dialogResult.subscribe((dialogFeedbackStatus) => {
      if (dialogFeedbackStatus) {
        // Ok button clicked
        // first option - if create and submit done, then navigate to In progress acceptance list page
        if (this.isCreateSubmitDone) {
          this.router.navigate([`../`], { queryParams: { acceptancePackagesTab: 'InProgress' }, relativeTo: this.route });
        } else if (this.isCreateDone) {
          // second option - if only create done, then navigate to New acceptance list page
          this.router.navigate([`../`], { queryParams: { acceptancePackagesTab: 'Init' }, relativeTo: this.route });
        }
      }
      // Note : on cancel, stay back hiding the dialog
    })

    dialogMessage.instance.show = APICallStatus.Loading;
    dialogMessage.instance.cAdditionalMessage = 'In progress';
    dialogMessage.instance.sAdditionalMessage = 'Pending';

    this.isCreateDone = false;
    this.isCreateSubmitDone = false;

    // map form data to request body
    const payload = this.mapFormDataToRequestPayload();
    this.subscription.add(
      this.networkRollOutService.composeAcceptancePackage(this.projectId, payload).subscribe({
        next: (res) => {
          const status = 'Customer New-Pending Approval';
          dialogMessage.instance.show = APICallStatus.Loading;
          dialogMessage.instance.cAdditionalMessage = 'Success';
          dialogMessage.instance.sAdditionalMessage = 'In progress';

          const payload: SubmitAcceptancePackagesRequest = {
            status,
            packageIds: [res.packageId]
          };

          this.subscription.add(
            this.projectService.submitAcceptancePackages(payload).subscribe({
              next: () => {
                this.processing = false;
                this.isCreateSubmitDone = true;
                dialogMessage.instance.show = APICallStatus.Success;
                dialogMessage.instance.cAdditionalMessage = 'Success';
                dialogMessage.instance.sAdditionalMessage = 'Success';
              },
              error: (error: HttpErrorResponse) => {
                this.processing = false;
                this.isCreateSubmitDone = false;
                // create is done, but submit failed
                this.isCreateDone = true;
                let errorMessage = '';
                let responseMessage = '';
                let responseMessageDescription = '';
                if (error.error instanceof ErrorEvent) {
                  // client-side error
                  errorMessage = `Error: ${error.error.message}`;
                  responseMessage = `Error: ${error.error.message}`
                } else {
                  // server-side error
                  errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
                  responseMessage = `${error.error.responseMessage}`
                  responseMessageDescription = `${error.error.responseMessageDescription}`
                }
                dialogMessage.instance.show = APICallStatus.Error;
                dialogMessage.instance.statusMessage = 'Error in submitting the acceptance package!' + responseMessage + '\n Please follow the FAQ doc for further steps.';
                dialogMessage.instance.errorDetailList = [responseMessageDescription];
                dialogMessage.instance.cAdditionalMessage = 'Success';
                dialogMessage.instance.sAdditionalMessage = 'Failed';
                dialogMessage.instance.referenceType.next('FAQ');
              },
            })
          );
        },
        error: (err: HttpErrorResponse) => {
          this.processing = false;
          this.isCreateSubmitDone = false;
          let errorMessage = '';
          let responseMessage = '';
          let responseMessageDescription = '';
          if (err.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${err.error.message}`;
            responseMessage = `Error: ${err.error.message}`
          } else {
            // server-side error
            errorMessage = `Error Status: ${err.status}\nMessage: ${err.message}`;
            responseMessage = `${err.error.responseMessage}`;
            responseMessageDescription = `${err.error.responseMessageDescription}`;
          }

          dialogMessage.instance.show = APICallStatus.Error;
          dialogMessage.instance.statusMessage = 'Error in submitting the acceptance package! \n' + responseMessage + '\n Please follow the FAQ doc for further steps.';
          dialogMessage.instance.cAdditionalMessage = 'Failed';
          dialogMessage.instance.sAdditionalMessage = 'Pending';
          dialogMessage.instance.referenceType.next('FAQ');
          dialogMessage.instance.errorDetailList = [responseMessageDescription];
        },
      })
    );
  }
  /**
   *  Submit form
   *  @returns void
   **/
  onSubmit(): void {
    this.processing = true;
    // stay in the last step of the wizard so the buttons won't be removed by EDS standard wizard behavior
    this.wizard.goToStep(this.wizard.steps.state.numSteps - 2);

    // check validation
    if (this.packageForm.invalid) {
      this.notificationService.showNotification(
        {
          title: `Form fields invalid!`,
          description: 'Please review the wizard steps and fix the errors.',
        },
        true
      );
    }

    // map form data to request body
    const payload = this.mapFormDataToRequestPayload();
    this.subscription.add(
      this.networkRollOutService.composeAcceptancePackage(this.projectId, payload).subscribe({
        next: () => {
          this.processing = false;
          this.router.navigate([`../`], { queryParams: { acceptancePackagesTab: 'Init' }, relativeTo: this.route });
          this.notificationService.showNotification({
            title: 'Acceptance package created successfully!',
          });
        },
        error: err => {
          this.processing = false;
          const details = err.error ? `Message: ${err.error.responseMessage || ''} - ${err.error.responseMessageDescription || ''}\n` : ''

          if (
            err.status === HttpStatusCode.BadGateway ||
            err.status === HttpStatusCode.ServiceUnavailable ||
            !navigator.onLine
          ) {
            this.notificationService.showNotification(
              {
                title: `Error while creating acceptance package!`,
                description:
                  `${details}Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.`,
              },
              true
            );
          } else {
            this.notificationService.showNotification(
              {
                title: `Error while creating acceptance package!`,
                description: `${details}Click to open the FAQ doc for further steps.`,
              },
              true
            );
          }
        },
      })
    );
  }

  /**
   * Go back to previous page
   * Show confirmation dialog
   *
   * @returns void
   */
  goBack(): void {
    const dialogRef = this.dialogService.createDialog(ConfirmationDialogComponent, {
      title: 'Cancel creating new package?',
      message: 'Are you sure you want to cancel creating a new package? All changes will be lost.',
    });
    dialogRef.instance.dialogResult.subscribe((result: any) => {
      if (result) {
        // go to history back
        const fallbackUrl = `/projects/${this.projectId}/acceptance-packages`;
        this.navigationService.back(fallbackUrl);
      }
    });
  }

  isLastStep(): boolean {
    const currentStep = this.wizard?.steps.state.currentStep + 1;
    return currentStep === this.wizard?.steps.state.numSteps || currentStep === this.wizard?.steps.state.numSteps + 1;
  }

  private mapFormDataToRequestPayload(): ComposeAcceptancePackageRequest {
    const isMultiLevelAcceptance = this.packageForm.controls.step1.controls.users.controls.multiLevelApprovals.value;
    let users: ComposeAcceptancePackageUserRequest[];
    let levels: ComposeAcceptancePackageLevelUserRequest[];
    if (!isMultiLevelAcceptance) {
      users = [];
      levels = null;
      // map users of single level approval to request body
      const contributors: ComposeAcceptancePackageUserRequest = {
        userList: this.packageForm.controls.step1.controls.users.controls.contributors.value?.map(user => user.id),
        userRole: RoleType.EricssonContributor,
      };
      if (contributors.userList.length > 0) {
        users.push(contributors);
      }

      const customerApprovers: ComposeAcceptancePackageUserRequest = {
        userList: this.packageForm.controls.step1.controls.users.controls.customerApprovers.value?.map(level => level.map(user => user.id)),
        userRole: RoleType.CustomerApprover,
      };
      if (customerApprovers.userList.length > 0) {
        users.push(customerApprovers);
      }

      const customerObservers: ComposeAcceptancePackageUserRequest = {
        userList: this.packageForm.controls.step1.controls.users.controls.customerObservers.value?.map(user => user.id),
        userRole: RoleType.CustomerObserver,
      };
      if (customerObservers.userList.length > 0) {
        users.push(customerObservers);
      }
    } else {
      users = null;
      levels = [];
      // map users to level schema in multi level approval
      const contributorLevel: ComposeAcceptancePackageLevelUserRequest = {
        // For Ericsson user levelId should be 0
        levelId: 0,
        userList: this.packageForm.controls.step1.controls.users.controls.contributors.value?.map(user => user.id),
        userRole: RoleType.EricssonContributor,
      };
      if (contributorLevel.userList.length > 0) {
        levels.push(contributorLevel);
      }

      const customerApproverLevels: ComposeAcceptancePackageLevelUserRequest[] = this.packageForm.controls.step1.controls.users.controls.customerApprovers.value?.filter(level => level.length > 0)
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
        userList: this.packageForm.controls.step1.controls.users.controls.customerObservers.value?.map(user => user.id),
        userRole: RoleType.CustomerObserver,
      };
      if (customerObserverLevel.userList.length > 0) {
        levels.push(customerObserverLevel);
      }
    }

    // create request body
    return {
      name: this.packageForm.controls.step1.controls.packageDetails.controls.nameInput.value,
      packageType: this.packageForm.controls.step1.controls.packageDetails.controls.scopeInput.value,
      description: this.packageForm.controls.step1.controls.packageDetails.controls.descriptionInput.value,
      isMultiLevelAcceptance,
      isWorkplanBased: this.packageForm.controls.step2.controls.multiSelectOption.value === SelectOptions.WORKPLAN ? true : false,
      approvalType: 'Both',
      approvalMode: 'Manual',
      extendedAttributes: [],
      packageEvidences: this.packageForm.controls.step4.controls.evidences.controls.file.value || [],
      users,
      levels,
      lineItems: this.packageForm.controls.step3.controls.lineItemIds.value,
      integrateToB2B: this.packageForm.controls.step1.controls.packageDetails.controls.integrateToB2B.value,
      isMilestoneAcceptance: this.isMilestoneAcceptance,
      milestoneIds: this.isMilestoneAcceptance ? this.packageForm.controls.step2.controls.milestoneIds.value : null,
    };
  }

  /**
   * on updating the package
   */
  onUpdate(): void {
    this.processing = true;
    // stay in the last step of the wizard so the buttons won't be removed by EDS standard wizard behavior
    this.wizard.goToStep(this.wizard.steps.state.numSteps - 2);

    // check validation
    if (this.packageForm.invalid) {
      this.notificationService.showNotification(
        {
          title: `Form fields invalid!`,
          description: 'Please review the wizard steps and fix the errors.',
        },
        true
      );
    }

    // map form data to request body
    const payload = this.mapFormDataToRequestPayload();
    if (this.isEdit) {
      payload.status = 'Customer Revision';
    }

    this.subscription.add(
      this.networkRollOutService.updateAcceptancePackage(this.projectId, this.packageId, payload).subscribe({
        next: () => {
          this.processing = false;
          this.router.navigate([`../`], { relativeTo: this.route });
          this.notificationService.showNotification({
            title: 'Acceptance package updated successfully!',
          });
        },
        error: err => {
          this.processing = false;
          if (
            err.status === HttpStatusCode.BadGateway ||
            err.status === HttpStatusCode.ServiceUnavailable ||
            !navigator.onLine
          ) {
            this.notificationService.showNotification(
              {
                title: `Error while updating acceptance package!`,
                description:
                  'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
              },
              true
            );
          } else {
            this.notificationService.showNotification(
              {
                title: `Error while updating acceptance package!`,
                description: 'Click to open the FAQ doc for further steps.',
              },
              true
            );
          }
        },
      })
    );
  }
}
