import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal, type OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Wizard } from '@eds/vanilla';
import { ConfirmationDialogComponent } from 'src/app/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NavigationService } from 'src/app/shared/navigation.service';
import { CreateCertificateStep2Component } from './create-certificate-step2/create-certificate-step2.component';
import { CertificateRequestBody, SignatoryDetails, SignatoryType, WorkplanSiteData } from 'src/app/projects/projects.interface';
import { CreateCertificateStep1Component } from './create-certificate-step1/create-certificate-step1.component';
import { CreateCertificateStep3Component } from './create-certificate-step3/create-certificate-step3.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import { HttpStatusCode } from '@angular/common/http';
import { CertificateTemplate, WorkPlanDetails } from 'src/app/projects/projects.interface';
import { CreateCertificateRequiredInformationComponent } from './create-certificate-required-information/create-certificate-required-information.component';

export interface CertificateForm {
  step1: FormGroup<{
    workplans: FormControl<string[]>;
    workplanSites: FormControl<WorkplanSiteData[]>;
  }>;
  requiredInformation: FormGroup<{}>;
  step2: FormGroup<{
    generalDetails: FormGroup<{
      requestNameInput: FormControl<string>;
      certificateScopeInput: FormControl<string>;
      templateSelectInput: FormControl<string>;
      additionalInformationInput?: FormControl<string>;
      [key: string]: AbstractControl<any>;
    }>;
    ericssonSignatory: FormGroup<{
      eSignatory: FormArray;
    }>;
    customerSignatory: FormGroup<{
      cSignatory: FormArray;
    }>;
    selectedTemplate: FormControl<CertificateTemplate | null>;
    certificateRequestDocumentIds: FormControl<string[]>
  }>;

}

@Component({
  selector: 'app-create-certificate',
  standalone: true,
  templateUrl: './create-certificate.component.html',
  styleUrl: './create-certificate.component.less',
  imports: [
    CommonModule,
    CreateCertificateStep1Component,
    CreateCertificateStep2Component,
    CreateCertificateStep3Component,
    CreateCertificateRequiredInformationComponent
  ]
})
export class CreateCertificateComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('newCertificateWizard')
  readonly newCertificateWizardElementRef: ElementRef<HTMLElement>;
  private scripts: Scripts[] = [];

  @ViewChild(CreateCertificateRequiredInformationComponent) createCertificateRequiredInformationComponent!: CreateCertificateRequiredInformationComponent;
  @ViewChild(CreateCertificateStep2Component) createCertificateStep2Component!: CreateCertificateStep2Component;
  @ViewChild(CreateCertificateStep3Component) createCertificateStep3Component!: CreateCertificateStep3Component;

  private wizard: Wizard;
  wizardIsLoaded = false;
  projectId: string;
  processing = signal(false);

  certificateForm = this.formBuilder.group<CertificateForm>({
    step1: this.formBuilder.group({
      workplans: this.formBuilder.control([], [Validators.required, Validators.minLength(1)]),
      workplanSites: this.formBuilder.control([], [Validators.required, Validators.minLength(1)]),
    }),
    requiredInformation: this.formBuilder.group({}),
    step2: this.formBuilder.group({
      generalDetails: this.formBuilder.group({
        requestNameInput: this.formBuilder.control('', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]),
        templateSelectInput: this.formBuilder.control('', [Validators.required]),
        certificateScopeInput: this.formBuilder.control('', [Validators.minLength(1), Validators.maxLength(255)]),
      }),
      ericssonSignatory: this.formBuilder.group({
        eSignatory: this.formBuilder.array([]),
      }),
      customerSignatory: this.formBuilder.group({
        cSignatory: this.formBuilder.array([]),
      }),
      selectedTemplate: this.formBuilder.control<CertificateTemplate | null>(null),
      certificateRequestDocumentIds: [],
    }),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService,
    private navigationService: NavigationService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private projectService: ProjectsService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => (this.projectId = params.get('id')));
  }

  ngAfterViewInit(): void {
    // init eds wizard
    const wizardDOM = this.newCertificateWizardElementRef.nativeElement;
    if (wizardDOM) {
      this.wizard = new Wizard(wizardDOM);
      this.wizard.init();
      this.scripts.push(this.wizard);
      this.wizardIsLoaded = true;
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach(script => {
      script.destroy();
    });
  }

  goBack(): void {
    const dialogRef = this.dialogService.createDialog(ConfirmationDialogComponent, {
      title: 'Cancel creating new certificate request?',
      message: 'Are you sure you want to cancel creating a new certificate request? All changes will be lost.',
    });
    dialogRef.instance.dialogResult.subscribe((result: any) => {
      if (result) {
        // go to history back
        const fallbackUrl = `/projects/${this.projectId}/certificates`;
        this.navigationService.back(fallbackUrl);
      }
    });
  }

  get currentStep(): number {
    // wizard steps are 0-based
    return this.wizard.steps.state.currentStep + 1;
  }

  onNextStep(): void {
    const formGroup = this.certificateForm.controls[`step${this.currentStep === 3 ? 2 : this.currentStep}`];
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
    if (this.currentStep === 3) {
      this.createCertificateStep2Component.onNextClick();
    }
    else if (this.currentStep === 4) {
      this.createCertificateStep3Component.fetchPreview();
    }
    else if (this.currentStep === 2) {
      this.createCertificateRequiredInformationComponent.generateWorkplanTable();
    }
    const isLastStep = this.isLastStep();
  }

  isLastStep(): boolean {
    const currentStep = this.wizard?.steps.state.currentStep + 1;
    return currentStep === this.wizard?.steps.state.numSteps || currentStep === this.wizard?.steps.state.numSteps + 1;
  }

  currentStepIsInvalid(): boolean {
    if (!this.wizardIsLoaded) {
      return true;
    }
    if (this.currentStep === 2) {
      // this.certificateForm.controls
      return false;
    }
    else if (this.currentStep === 3) {
      const formGroup = this.certificateForm.controls[`step${this.currentStep - 1}`];
      return formGroup.invalid;
    }
    else {
      const formGroup = this.certificateForm.controls[`step${this.currentStep}`];
      return formGroup.invalid;
    }
  }

  onSubmit(): void {
    // stay in the last step of the wizard so the buttons won't be removed by EDS standard wizard behavior
    this.wizard.goToStep(this.wizard.steps.state.numSteps - 2);

    if (this.certificateForm.invalid) return;

    this.processing.set(true);
    const payload = this.mapFormDataToRequestPayload();
    this.projectService.saveCertificateRequest(this.projectId, payload).subscribe({
      next: () => {
        this.processing.set(false);
        this.router.navigate([`../`], { relativeTo: this.route });
        this.notificationService.showNotification({
          title: 'Certificate request submitted successfully!',
        });
      },
      error: err => {
        this.processing.set(false);
        if (
          err.status === HttpStatusCode.BadGateway ||
          err.status === HttpStatusCode.ServiceUnavailable ||
          !navigator.onLine
        ) {
          this.notificationService.showNotification(
            {
              title: `Error while submitting certificate request!`,
              description:
                'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
            },
            true
          );
        } else {
          this.notificationService.showNotification(
            {
              title: `Error while submitting certificate request!`,
              description: 'Click to open the FAQ doc for further steps.',
            },
            true
          );
        }
      },
    });
  }

  private mapFormDataToRequestPayload(): CertificateRequestBody {
    const requestName = this.certificateForm.controls.step2.controls.generalDetails.controls.requestNameInput.value;
    const certificateScope = this.certificateForm.controls.step2.controls.generalDetails.controls.certificateScopeInput?.value || undefined
    const certificateTemplateId = this.certificateForm.controls.step2.controls.generalDetails.controls.templateSelectInput.value;
    const additionalInfo = {
      additionalInfo1: this.certificateForm.controls.step2.controls.generalDetails.controls.additionalInformationInput_0?.value,
      additionalInfo2: this.certificateForm.controls.step2.controls.generalDetails.controls.additionalInformationInput_1?.value,
      additionalInfo3: this.certificateForm.controls.step2.controls.generalDetails.controls.additionalInformationInput_2?.value,
    }
    const workplans = this.certificateForm.controls.step1.controls.workplanSites.value.map<WorkPlanDetails>(workPlan => {
      const { workplanName, siteName, siteIdByCustomer, siteNameByCustomer, siteType, ...others } = workPlan;
      const filteredOthers = Object.keys(others).reduce((acc, key) => {
        acc[key] = others[key];
        return acc;
      }, {});
      return {
        name: workPlan.workplanName,
        siteName: workPlan.siteName,
        siteIdByCustomer: workPlan.siteIdByCustomer,
        siteNameByCustomer: workPlan.siteNameByCustomer,
        siteType: workPlan.siteType,
        others: filteredOthers
      }
    });
    const eSignatories = this.certificateForm.controls.step2.controls.ericssonSignatory.getRawValue().eSignatory.map<SignatoryDetails>(
      (signatory, index) => ({ signatoryId: signatory.id, signatoryName: signatory.name, signatoryType: SignatoryType.ericsson, level: index + 1 })
    );
    const cSignatories = this.certificateForm.controls.step2.controls.customerSignatory.getRawValue().cSignatory.map<SignatoryDetails>(
      (signatory, index) => ({ signatoryId: signatory.id, signatoryName: signatory.name, signatoryType: SignatoryType.customer, level: index + 1 })
    );
    const signatories = [...eSignatories, ...cSignatories];
    const certificateRequestDocumentIds = this.certificateForm.controls.step2.controls.certificateRequestDocumentIds.value;
    // generate request body
    return {
      requestName,
      certificateScope,
      certificateTemplateId,
      workplans,
      signatories,
      placeholders: additionalInfo,
      certificateRequestDocumentIds
    }
  }
}
