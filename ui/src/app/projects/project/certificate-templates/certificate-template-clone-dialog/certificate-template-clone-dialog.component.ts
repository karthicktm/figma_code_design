import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, Output, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { CertificateTemplate } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { asyncCheckDuplicateName } from '../certificate-template-utilities';
import { Subscription } from 'rxjs';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';

@Component({
  selector: 'app-certificate-template-clone-dialog',
  standalone: true,
  templateUrl: './certificate-template-clone-dialog.component.html',
  styleUrl: './certificate-template-clone-dialog.component.less',
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class CertificateTemplateCloneDialogComponent extends EDSDialogComponent implements OnDestroy {
  @Output() dialogResult: EventEmitter<boolean> = new EventEmitter();

  private subscription: Subscription = new Subscription();
  templateForm = this.formBuilder.nonNullable.group({
    name: this.formBuilder.control('', [Validators.required, Validators.maxLength(255)]),
  });
  saving = signal(false);

  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      projectId: string,
      originalTemplate: CertificateTemplate,
    },
    private formBuilder: FormBuilder,
    private projectService: ProjectsService,
    private notificationService: NotificationService,
  ) {
    super();
    this.name.setAsyncValidators([asyncCheckDuplicateName(this.projectService, this.inputData.projectId)]);
    this.templateForm.controls.name.patchValue(this.inputData.originalTemplate.templateName + ' copy');
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    super.ngOnDestroy();
  }

  get name(): FormControl<string> {
    return this.templateForm.controls.name;
  }

  onSubmit(): void {
    if (this.templateForm.valid) {
      this.saving.set(true);
      this.projectService.cloneCertificateTemplate(this.inputData.projectId, this.inputData.originalTemplate.templateId, this.name.value).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogResult.emit(true);
          this.dialog.hide();
          this.dialog.destroy();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            this.notificationService.showNotification({
              title: 'Error when cloning certificate template!',
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            }, true);
          } else {
            this.notificationService.showNotification({
              title: err.error.responseMessage || 'Error when cloning certificate template!',
              description: err.error.responseMessageDescription || 'Click to open the FAQ doc for further steps.'
            }, true);
          }
        }
      });
    }
  }
}
