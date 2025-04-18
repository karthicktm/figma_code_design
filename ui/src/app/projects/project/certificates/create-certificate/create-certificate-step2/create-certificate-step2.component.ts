import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { CertificateForm } from '../create-certificate.component';
import { CertificateTemplate, UserModel } from 'src/app/projects/projects.interface';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { SelectWithInputComponent } from 'src/app/shared/select-with-input/select-with-input.component';
import { TemplateStatus } from '../../../certificate-templates/certificate-template-list/certificate-template-list.component';
import { CertificateRequestDocumentComponent } from '../../certificate-request-document/certificate-request-document.component';
import CertificateUtils from '../../certificate-utilities';

interface UserOptionWithValue extends OptionWithValue {
  roleType: string[];
}

enum SignatoryType {
  Ericsson = 'Ericsson',
  Customer = 'Customer',
}

@Component({
  selector: 'app-create-certificate-step2',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    CertificateRequestDocumentComponent,
  ],
  templateUrl: './create-certificate-step2.component.html',
  styleUrl: './create-certificate-step2.component.less',
})
export class CreateCertificateStep2Component implements OnInit {
  componentName = CertificateUtils.createCertificateWizardStep2
  @ViewChildren('eSignatory') readonly ericssonSignatoryElements: QueryList<SelectWithInputComponent>;
  @ViewChildren('cSignatory') readonly customerSignatoryElements: QueryList<SelectWithInputComponent>;

  @Input() certificateForm: FormGroup<CertificateForm>;
  @Input() projectId: string;

  SignatoryType = SignatoryType;
  generalDetailsForm: FormGroup<{
    requestNameInput: FormControl<string>;
    certificateScopeInput: FormControl<string>;
    templateSelectInput: FormControl<string>;
    additionalInformationInput?: FormControl<string>;
    [key: string]: AbstractControl<any>;
  }>;
  ericssonSignatoryForm: FormGroup<{
    eSignatory: FormArray<FormControl<UserModel>>;
  }>;
  customerSignatoryForm: FormGroup<{
    cSignatory: FormArray<FormControl<UserModel>>;
  }>;
  templateOptions: Observable<OptionWithValue[]>;
  templates: CertificateTemplate[];
  selectedTemplate: CertificateTemplate;
  maxLengthAdditionalInformation = 255;

  allUsers: UserOptionWithValue[];
  ericssonSignatoryObservable: Observable<UserOptionWithValue[]>;
  customerSignatoryObservable: Observable<UserOptionWithValue[]>;

  constructor(
    private projectService: ProjectsService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const step2FormGroup = this.certificateForm.controls.step2;
    this.generalDetailsForm = this.certificateForm.controls.step2.controls.generalDetails;
    this.ericssonSignatoryForm = step2FormGroup.controls.ericssonSignatory;
    this.customerSignatoryForm = step2FormGroup.controls.customerSignatory;
    this.fetchCertificateTemplates();
    const signatoryObservable = this.getAllProjectUsers().pipe(
      shareReplay(),
    )

    this.ericssonSignatoryObservable = signatoryObservable.pipe(
      map(users => users.filter(user => user.roleType.includes(RoleType.EricssonContributor) || user.roleType.includes(RoleType.ProjectAdmin))),
      map(users => users.filter((value, index, array) => array.findIndex(element => value.optionValue === element.optionValue) === index)),
    );

    this.customerSignatoryObservable = signatoryObservable.pipe(
      map(users => users.filter(user => user.roleType.includes(RoleType.CustomerApprover) || user.roleType.includes(RoleType.CustomerObserver))),
      map(users => users.filter((value, index, array) => array.findIndex(element => value.optionValue === element.optionValue) === index)),
    );
    step2FormGroup.controls.selectedTemplate.valueChanges.subscribe((template) => {
      this.selectedTemplate = template;

      if (this.selectedTemplate.isAddlInfoContainer) {
        this.generalDetailsForm.addControl('additionalInformationInput', new FormControl<string>('', [Validators.minLength(1), Validators.maxLength(this.maxLengthAdditionalInformation)]));
      } else if (this.generalDetailsForm.controls.additionalInformationInput) {
        this.generalDetailsForm.removeControl('additionalInformationInput');
      }

      const numberEricssonSignatory = this.selectedTemplate.ericssonSignatoryCount;
      if (numberEricssonSignatory >= 1) {
        // init first ericsson signatory
        this.ericssonSignatoryArray.push(new FormControl(undefined, [Validators.required, Validators.minLength(1)]));
        this.ericssonSignatoryArray.addValidators([Validators.required, Validators.minLength(1)])
        this.updateSignatoryArray(numberEricssonSignatory, this.ericssonSignatoryArray);
      }

      const numberCustomerSignatory = this.selectedTemplate.customerSignatoryCount;
      if (numberCustomerSignatory >= 1) {
        // init first customer signatory
        this.customerSignatoryArray.push(new FormControl(undefined, [Validators.required, Validators.minLength(1)]));
        this.customerSignatoryArray.addValidators([Validators.required, Validators.minLength(1)])
        this.updateSignatoryArray(numberCustomerSignatory, this.customerSignatoryArray);
      }
      this.customerSignatoryArray.push(new FormControl(undefined, [Validators.required, Validators.minLength(1)]));

      this.customerSignatoryArray.push(new FormControl(undefined, [Validators.required, Validators.minLength(1)]));
      this.customerSignatoryArray.addValidators([Validators.required, Validators.minLength(1)])
      this.updateSignatoryArray(2, this.customerSignatoryArray);


    });
  }

  get requestNameInput(): FormControl<string> {
    return this.generalDetailsForm.controls.requestNameInput;
  }

  get certificateScopeInput(): FormControl<string> {
    return this.generalDetailsForm.controls.certificateScopeInput;
  }

  get templateSelectInput(): FormControl<string> {
    return this.generalDetailsForm.controls.templateSelectInput;
  }

  get additionalInformationInput(): FormControl<string> {
    return this.generalDetailsForm.controls.additionalInformationInput;
  }

  get ericssonSignatoryArray(): FormArray<FormControl<UserModel>> {
    return this.ericssonSignatoryForm.controls.eSignatory as FormArray;
  }

  get customerSignatoryArray(): FormArray<FormControl<UserModel>> {
    return this.customerSignatoryForm.controls.cSignatory as FormArray;
  }

  onNextClick(): void {
    const signatoryObservable = this.getAllProjectUsers().pipe(
      shareReplay(),
    )

    this.ericssonSignatoryObservable = signatoryObservable.pipe(
      map(users => users.filter(user => user.roleType.includes(RoleType.EricssonContributor) || user.roleType.includes(RoleType.ProjectAdmin))),
      map(users => users.filter((value, index, array) => array.findIndex(element => value.optionValue === element.optionValue) === index)),
    );

    this.customerSignatoryObservable = signatoryObservable.pipe(
      map(users => users.filter(user => user.roleType.includes(RoleType.CustomerApprover) || user.roleType.includes(RoleType.CustomerObserver))),
      map(users => users.filter((value, index, array) => array.findIndex(element => value.optionValue === element.optionValue) === index)),
    );

    this.selectedTemplate = this.certificateForm.get('step2.selectedTemplate')?.value;

    const numberEricssonSignatory = this.selectedTemplate.ericssonSignatoryCount;
    if (numberEricssonSignatory >= 1) {
      // init first ericsson signatory
      this.ericssonSignatoryArray.push(new FormControl(undefined, [Validators.required, Validators.minLength(1)]));
      this.ericssonSignatoryArray.addValidators([Validators.required, Validators.minLength(1)])
      this.updateSignatoryArray(numberEricssonSignatory, this.ericssonSignatoryArray);
    }

    const numberCustomerSignatory = this.selectedTemplate.customerSignatoryCount;
    if (numberCustomerSignatory >= 1) {
      // init first customer signatory
      this.customerSignatoryArray.push(new FormControl(undefined, [Validators.required, Validators.minLength(1)]));
      this.customerSignatoryArray.addValidators([Validators.required, Validators.minLength(1)])
      this.updateSignatoryArray(numberCustomerSignatory, this.customerSignatoryArray);
    }
  }

  onSelectSignatory(selectedId: string, level: number, signatoryType: string): void {
    let signatoryElements: SelectWithInputComponent[];
    let signatoryArray: FormArray<FormControl<UserModel>>;
    let idPrefix: string;

    if (signatoryType === SignatoryType.Ericsson) {
      signatoryElements = this.ericssonSignatoryElements.toArray();
      signatoryArray = this.ericssonSignatoryArray;
      idPrefix = 'eSignatory_';
    } else {
      signatoryElements = this.customerSignatoryElements.toArray();
      signatoryArray = this.customerSignatoryArray;
      idPrefix = 'cSignatory_';
    }

    if (signatoryElements && signatoryElements.length > 0 && signatoryArray) {
      const userOption = signatoryElements.find(() => true).optionsWithValue.find(option => selectedId === option.optionValue);

      // Ensure that the user is not already added to another level
      const userAlreadyAdded = signatoryArray.value
        .find(user => userOption.optionValue === user?.id);

      if (userAlreadyAdded) {
        this.notificationService.showNotification(
          {
            title: `Signatory Already added`,
            description: `User '${userOption.option}' has already been used in another signatory level.`,
          }
        );

        // Reset input if already added
        signatoryElements.find(select => select.selectId === (idPrefix + level))?.resetInput();
      } else {
        signatoryArray.controls[level].setValue({ name: userOption.option, id: userOption.optionValue });

        // Update form array validity
        signatoryArray.updateValueAndValidity();
      }
    }
  }

  onSignatoryDelete(selectedId: string, level: number, signatoryType: string): void {
    let signatoryArray: FormArray<FormControl<UserModel>>;
    if (signatoryType === SignatoryType.Ericsson) {
      signatoryArray = this.ericssonSignatoryArray;
    } else {
      signatoryArray = this.customerSignatoryArray;
    }
    signatoryArray.controls[level].setValue(null)
  }

  private fetchCertificateTemplates(): void {
    this.templateOptions = this.projectService.getAllCertificateTemplates(this.projectId, [{ key: 'templateStatus', value: TemplateStatus.Active }]).pipe(
      tap(templates => this.templates = templates),
      map(templates => templates.map(template => ({ option: template.templateName, optionValue: template.templateId }))),
      catchError((error) => {
        this.notificationService.showNotification({
          title: `Error while fetching templates!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
        return of([]);
      }),
    );
  }

  private getAllProjectUsers(): Observable<UserOptionWithValue[]> {
    return this.projectService.getAllProjectUsersAndGroups(this.projectId).pipe(
      map(data => data.filter(user => user.userType === 'User')),
      map(data =>
        data.flatMap(user => ({
          optionValue: user.userId,
          option: user.name,
          roleType: user.roleType,
        }))
      ),
      shareReplay(1),
      catchError((error) => {
        this.notificationService.showNotification({
          title: `Error while fetching project users!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
        return of([]);
      }),
    );
  }

  private updateSignatoryArray(numberSignatory: number, signatoryArray: FormArray): void {
    if (signatoryArray.length < numberSignatory) {
      const addLength = numberSignatory - signatoryArray.length;
      for (let index = 0; index < addLength; index++) {
        signatoryArray.push(new FormControl(undefined, [Validators.required, Validators.minLength(1)]));
      }
    } else if (signatoryArray.length > numberSignatory) {
      const removeLength = signatoryArray.length - numberSignatory;
      for (let index = 0; index < removeLength; index++) {
        signatoryArray.removeAt(signatoryArray.length - 1);
      }
    }

    signatoryArray.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  updateCertificateRequestDocumentArray(updatedArray: any[]): void {
    this.certificateForm.controls.step2.controls.certificateRequestDocumentIds.patchValue(updatedArray)
  }

}
