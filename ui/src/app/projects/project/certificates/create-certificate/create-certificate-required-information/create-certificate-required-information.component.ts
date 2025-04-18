import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { CertificateForm } from '../create-certificate.component';
import { CertificateTemplate } from 'src/app/projects/projects.interface';
import { TemplateStatus } from '../../../certificate-templates/certificate-template-list/certificate-template-list.component';
import CertificateUtils from '../../certificate-utilities';
import { RoleType } from 'src/app/group-management/group-management-interfaces';

interface UserOptionWithValue extends OptionWithValue {
  roleType: string[];
}

@Component({
  selector: 'app-create-certificate-step4',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule
  ],
  templateUrl: './create-certificate-required-information.component.html',
  styleUrls: ['./create-certificate-required-information.component.less'],
})
export class CreateCertificateRequiredInformationComponent implements OnInit {
  componentName = CertificateUtils.createCertificateWizardStep2;

  @Input() certificateForm: FormGroup<CertificateForm>;
  @Input() projectId: string;

  generalDetailsForm: FormGroup<{
    requestNameInput: FormControl<string>;
    certificateScopeInput: FormControl<string>;
    templateSelectInput: FormControl<string>;
    additionalInformationInput?: FormControl<string>;
    [key: string]: AbstractControl<any>;
  }>;
  templateOptions: Observable<OptionWithValue[]>;
  templates: CertificateTemplate[];
  selectedTemplate: CertificateTemplate;
  maxLengthAdditionalInformation = 255;
  dynamicControlNames: string[] = [];

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
    this.generalDetailsForm = step2FormGroup.controls.generalDetails;
    this.fetchCertificateTemplates();
    const signatoryObservable = this.getAllProjectUsers();

    this.ericssonSignatoryObservable = signatoryObservable.pipe(
      map(users => users.filter(user => user.roleType.includes(RoleType.EricssonContributor) || user.roleType.includes(RoleType.ProjectAdmin))),
      map(users => users.filter((value, index, array) => array.findIndex(element => value.optionValue === element.optionValue) === index)),
    );

    this.customerSignatoryObservable = signatoryObservable.pipe(
      map(users => users.filter(user => user.roleType.includes(RoleType.CustomerApprover) || user.roleType.includes(RoleType.CustomerObserver))),
      map(users => users.filter((value, index, array) => array.findIndex(element => value.optionValue === element.optionValue) === index)),
    );

    this.templateSelectInput.valueChanges.subscribe((templateId) => {
      this.selectedTemplate = this.templates.find((template) => template.templateId === templateId);
      this.certificateForm.get('step2.selectedTemplate')?.setValue(this.selectedTemplate);

      if (this.selectedTemplate.isAddlInfoContainer) {
        this.generalDetailsForm.addControl(
          'additionalInformationInput',
          new FormControl<string>('', [Validators.minLength(1), Validators.maxLength(this.maxLengthAdditionalInformation)])
        );
      } else if (this.generalDetailsForm.controls.additionalInformationInput) {
        this.generalDetailsForm.removeControl('additionalInformationInput');
      }
      this.generateWorkplanTable();
    });
    this.cdr.detectChanges();
  }

  get requestNameInput(): FormControl<string> {
    return this.generalDetailsForm.controls.requestNameInput as FormControl<string>;
  }

  get certificateScopeInput(): FormControl<string> {
    return this.generalDetailsForm.controls.certificateScopeInput as FormControl<string>;
  }

  get templateSelectInput(): FormControl<string> {
    return this.generalDetailsForm.controls.templateSelectInput as FormControl<string>;
  }

  get additionalInformationInput(): FormControl<string> {
    return this.generalDetailsForm.controls.additionalInformationInput as FormControl<string>;
  }


  dynamicColumns: string[] = [];
  dbColumns: string[] = [];
  tableHeaders: { columnName: string; key: string; attr: string }[] = [];
  tableData: any[] = [];
  template: string;
  rowCount: number = 1;

  generateWorkplanTable(): void {
    this.template = this.selectedTemplate.templateData;
    this.rowCount = this.certificateForm.get('step1.workplanSites')?.value.length;
    this.extractColumns();
    this.generateTable();
    this.removeAdditionalInfoControls();
    this.addAdditionalInfoControls();

  }

  private extractColumns(): void {
    const regex = /<th[^>]*columnname="(.*?)"[^>]*>(.*?)<\/th>/g;
    let match: RegExpExecArray;
    this.tableHeaders = [];
    while ((match = regex.exec(this.template)) !== null) {
      const columnName = match[1].trim();
      const key = match[2].trim();
      if (key.startsWith('@')) {
        this.tableHeaders.push({ columnName, key: key.replace('@', ''), attr: key });
      } else if (key.startsWith('##')) {
        this.tableHeaders.push({ columnName, key: key.replace(/##/g, ''), attr: key });
        this.dynamicColumns.push(key);
      }
    }
  }

  private generateTable(): void {
    const workplanSites = this.certificateForm.get('step1.workplanSites')?.value;
    this.tableData = [];

    for (let i = 0; i < workplanSites.length; i++) {
      const row: { [key: string]: any } = { formControls: {} };

      this.tableHeaders.forEach((col) => {
        row[col.key] = workplanSites[i]?.[col.key] || '';

        if (this.isDynamicColumn(col.attr)) {
          row.formControls[col.key] = new FormControl(row[col.key], [Validators.maxLength(24)]);
        }
      });

      this.tableData.push(row);
    }
  }

  addAdditionalInfoControls(): void {
    const regex = /<div[^>]*class="additionalInfo"[^>]*><\/div>/g;
    const additionalInfoDivs = this.selectedTemplate.templateData.match(regex);

    if (additionalInfoDivs && additionalInfoDivs.length > 0) {
      // Limit to 3 fields
      const maxAdditionalInfoFields = Math.min(additionalInfoDivs.length, 3);

      for (let i = 0; i < maxAdditionalInfoFields; i++) {
        const inputControlName = `additionalInformationInput_${i}`;
        this.generalDetailsForm.addControl(
          inputControlName,
          new FormControl<string>('', [
            Validators.maxLength(this.maxLengthAdditionalInformation),
          ])
        );
        this.dynamicControlNames.push(inputControlName);
      }
    }
  }

  removeAdditionalInfoControls(): void {
    // Remove all controls starting with 'additionalInformationInput_'
    const additionalInfoControls = this.getAdditionalInfoControlNames();
    additionalInfoControls.forEach((controlName) => {
      this.generalDetailsForm.removeControl(controlName);
    });

    // Clear the dynamic control names list
    this.dynamicControlNames = [];
  }


  isDynamicColumn(columnKey: string): boolean {
    return this.dynamicColumns.includes(columnKey);
  }

  getAdditionalInfoControlNames(): string[] {
    // Find all control names starting with 'additionalInformationInput_' 
    return Object.keys(this.generalDetailsForm.controls).filter(controlName =>
      controlName.startsWith('additionalInformationInput_')
    );
  }


  updateDb(rowIndex: number, columnKey: string): void {
    const control = this.tableData[rowIndex].formControls[columnKey];
    control.setValue(control.value.trim());
    control.markAsTouched();
    control.updateValueAndValidity();
    const workplanSites = this.certificateForm.get('step1.workplanSites')?.value;
    if (workplanSites && workplanSites[rowIndex]) {
      workplanSites[rowIndex][columnKey] = control.value;
      this.certificateForm.get('step1.workplanSites')?.setValue(workplanSites);
    }
  }

  get isFormValid(): boolean {
    return this.certificateForm.valid && this.tableData.every(row =>
      Object.values(row.formControls).every((control: FormControl) => control.valid)
    );
  }

  onNextClick(): void {
    if (this.isFormValid) {
    } else {
      this.notificationService.showNotification({
        title: 'Validation Error',
        description: 'Please ensure all fields are valid before proceeding.',
      });
    }
  }

  private fetchCertificateTemplates(): void {
    this.templateOptions = this.projectService.getAllCertificateTemplates(this.projectId, [
      { key: 'templateStatus', value: TemplateStatus.Active },
    ]).pipe(
      tap(templates => this.templates = templates),
      map(templates => templates.map(template => ({ option: template.templateName, optionValue: template.templateId }))),
      catchError(() => {
        this.notificationService.showNotification({
          title: `Error while fetching templates!`,
          description: 'Try again after few minutes. If issue still persists, please follow the FAQ doc for further steps.',
        }, true);
        return of([]);
      })
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
}
