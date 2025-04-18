import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FileUploadButtonComponent } from '../../../../shared/file-upload-button/file-upload-button.component';
import { ProjectsService } from 'src/app/projects/projects.service';
import { TemplateStatus } from '../certificate-template-list/certificate-template-list.component';
import { Subscription } from 'rxjs';
import { HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CertificateTemplate } from 'src/app/projects/projects.interface';
import { asyncCheckDuplicateName } from '../certificate-template-utilities';

interface CertificateTemplateForm {
  name: FormControl<string>;
  signatureType: FormControl<SignatureType.Digital | SignatureType.Electronic>;
  template: FormControl<File>;
  isDefault: FormControl<boolean>;
}

enum SignatureType {
  Electronic = 'Electronic',
  Digital = 'Digital',
}

@Component({
  selector: 'app-certificate-template-form',
  standalone: true,
  templateUrl: './certificate-template-form.component.html',
  styleUrl: './certificate-template-form.component.less',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FileUploadButtonComponent,
  ]
})
export class CertificateTemplateFormComponent implements OnInit, OnDestroy {
  @Input() projectId: string;
  @Input() cancelElement: HTMLElement;
  @Input() certificateTemplate?: CertificateTemplate;
  @Input() isEdit: boolean = false;
  @Output() submitForm = new EventEmitter<boolean>();

  private subscription: Subscription = new Subscription();
  SignatureType = SignatureType;
  saving = signal(false);
  loadingInitialTemplateFile = signal(false);
  fileChanged: boolean;
  public certificateTemplateForm = this.formBuilder.nonNullable.group<CertificateTemplateForm>({
    name: this.formBuilder.control('', [Validators.required, Validators.maxLength(255)]),
    signatureType: this.formBuilder.control(SignatureType.Electronic, [Validators.required]),
    template: this.formBuilder.control(null, [Validators.required, this.checkFileType, this.checkFileSize]),
    isDefault: this.formBuilder.control(false),
  });

  checkFileType(control: AbstractControl<File>): { [key: string]: any } | null {
    const file: File = control.value;
    const errors: string[] = [];

    if (file) {
      if (file.type !== 'text/html') {
        errors.push(`${file.name} has an invalid type of ${file.type || 'unknown'}`);
      }

      return errors.length >= 1 ? { invalidType: errors } : null;
    }
    return null;  // no file, can be capture by "Required" validation
  }

  checkFileSize(control: AbstractControl<File>): { [key: string]: any } | null {
    const file: File = control.value;
    const errors: string[] = [];

    if (file) {
      const maxSize = 4 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds the maximum size of 4 MiB.`);
      }

      return errors.length >= 1 ? { invalidSize: errors } : null;
    }
    return null;  // no file, can be capture by "Required" validation
  }

  constructor(
    private formBuilder: FormBuilder,
    private projectService: ProjectsService,
    private notificationService: NotificationService,
  ) {
  }

  ngOnInit(): void {
    if (this.isEdit && this.certificateTemplate) {
      this.name.setAsyncValidators([]);
      this.certificateTemplateForm.patchValue({
        name: this.certificateTemplate.templateName,
        signatureType: SignatureType[this.certificateTemplate.signatureType as keyof typeof SignatureType],
      });
      this.name.disable();
      this.loadingInitialTemplateFile.set(true);
      this.subscription.add(this.projectService.downloadCertificateTemplate(this.projectId, this.certificateTemplate.templateId).subscribe({
        next: (response: HttpResponse<any>) => {
          const contentDisposition = response.headers.get('content-disposition');
          const filename: string = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replace('"', '') // replacing one " character
            .replace('"', ''); // replacing second " character
          const blob = new Blob([response.body], { type: 'text/html' });
          const file = new File([blob], filename || 'template.html', { type: 'text/html' });
          this.template.patchValue(file);
          this.loadingInitialTemplateFile.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.template.setErrors({ initLoadingFailed: true });
          this.loadingInitialTemplateFile.set(false);
        }
      }));
    } else {
      this.name.setAsyncValidators([asyncCheckDuplicateName(this.projectService, this.projectId)]);
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  get name(): FormControl<string> {
    return this.certificateTemplateForm.controls.name;
  }

  get signatureType(): FormControl<string> {
    return this.certificateTemplateForm.controls.signatureType;
  }

  get template(): FormControl<File> {
    return this.certificateTemplateForm.controls.template;
  }

  get isDefault(): FormControl<boolean> {
    return this.certificateTemplateForm.controls.isDefault;
  }

  onFileChange(event: Event): void {
    const target = (event.target instanceof HTMLInputElement) ? event.target : undefined;
    if (target?.files && target.files.length > 0) {
      const file = target.files[0];
      this.certificateTemplateForm.controls.template.patchValue(file);
      this.fileChanged = true;
    }
  }

  onIsDefaultChange(event): void {
    this.certificateTemplateForm.controls.isDefault.patchValue(event.target.checked);
  }

  onSubmit(): void {
    if (this.certificateTemplateForm.valid) {
      if (!this.isEdit) this.createCertificateTemplate();
      else this.updateCertificateTemplate();
    }
  }

  private createCertificateTemplate(): void {
    this.saving.set(true);
    const certificateTemplate = {
      templateName: this.name.value.trim(),
      signatureType: this.signatureType.value,
      status: this.isDefault.value ? TemplateStatus.Default : TemplateStatus.Active,
    };
    this.subscription.add(
      this.projectService.saveCertificateTemplate(this.projectId, certificateTemplate, this.template.value).subscribe({
        next: () => {
          this.saving.set(false);
          this.submitForm.emit(true);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            this.notificationService.showNotification({
              title: 'Error when creating certificate template!',
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            }, true);
          } else {
            this.notificationService.showNotification({
              title: err.error.responseMessage || 'Error when creating certificate template!',
              description: err.error.responseMessageDescription || 'Click to open the FAQ doc for further steps.'
            }, true);
          }
        }
      })
    );
  }

  private updateCertificateTemplate(): void {
    this.saving.set(true);
    const certificateTemplate = {
      signatureType: this.signatureType.value,
    };
    const template = this.fileChanged ? this.template.value : null;
    this.subscription.add(
      this.projectService.updateCertificateTemplate(this.projectId, this.certificateTemplate.templateId, certificateTemplate, template).subscribe({
        next: () => {
          this.saving.set(false);
          this.submitForm.emit(true);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            this.notificationService.showNotification({
              title: 'Error when updating certificate template!',
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            }, true);
          } else {
            this.notificationService.showNotification({
              title: err.error.responseMessage || 'Error when updating certificate template!',
              description: err.error.responseMessageDescription || 'Click to open the FAQ doc for further steps.'
            }, true);
          }
        }
      })
    );
  }

  onCancel(): void {
    this.cancelElement?.click();
  }
}
