import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, Inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, tap, throwError } from 'rxjs';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { Certificate } from 'src/app/projects/projects.interface';
import { FileUploadButtonComponent } from '../../../../shared/file-upload-button/file-upload-button.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import { CertificateService } from '../certificate.service';

export interface Data {
  projectId: string;
  certificate: Pick<Certificate, 'certificateRequestId'>;
  onSigningCompleted: () => void;
}

@Component({
    selector: 'app-certificate-signing-dialog',
    standalone: true,
    templateUrl: './certificate-signing-dialog.component.html',
    styleUrl: './certificate-signing-dialog.component.less',
    imports: [
        ReactiveFormsModule,
        FileUploadButtonComponent,
    ]
})
export class CertificateSigningDialogComponent extends EDSDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild(FileUploadButtonComponent) readonly firstFocus: FileUploadButtonComponent;
  readonly form: FormGroup<{
    signature: FormControl<File>,
    designation: FormControl<string>,
  }> = new FormGroup({
    signature: new FormControl<File>(undefined, [Validators.required, Validators.nullValidator, this.checkFileType, this.checkFileSize]),
    designation: new FormControl<string>('', [Validators.required, Validators.maxLength(255)]),
  });

  readonly preview = signal<string>(undefined);
  readonly isSubmitting = signal<boolean>(false);

  private readonly urlRefs: string[] = [];

  constructor(
    @Inject(DIALOG_DATA) public inputData: Data,
    private projectService: ProjectsService,
    private certificateService: CertificateService,
    private notificationService: NotificationService,
  ) {
    super();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    const firstFocus = this.firstFocus.fileSelectInput.nativeElement.previousElementSibling;
    if (firstFocus instanceof HTMLButtonElement) {
      firstFocus.focus();
    }
  }

  ngOnDestroy(): void {
    this.urlRefs.forEach(url => window.URL.revokeObjectURL(url));
    super.ngOnDestroy();
  }

  checkFileType(control: AbstractControl<File>): { [key: string]: any } | null {
    const file: File = control.value;
    const errors: string[] = [];

    if (file) {
      if (file.type !== 'image/png') {
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
      const maxSize = 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds the maximum size of 1 MiB.`);
      }

      return errors.length >= 1 ? { invalidSize: errors } : null;
    }
    return null;  // no file, can be capture by "Required" validation
  }

  onSignatureFileChange(event: Event): void {
    this.urlRefs.forEach(url => window.URL.revokeObjectURL(url));
    const target = (event.target instanceof HTMLInputElement) ? event.target : undefined;
    if (target) {
      const file = target.files.item(0);
      if (file) {
        this.form.controls.signature.setValue(file);
        const url = window.URL.createObjectURL(file);
        this.preview.set(url);
        this.urlRefs.push(url);
      }
      else this.preview.set(undefined);
    }
  }

  isSubmissionAllowed(): boolean {
    return !(!this.form?.dirty || this.form?.errors || this.form?.controls.signature?.errors || this.form?.controls.designation?.errors || this.isSubmitting())
  }

  onSubmit(): void {
    if (!this.isSubmissionAllowed()) return;
    this.isSubmitting.set(true);

    const payloadPromise = this.certificateService.generateCertificateActionPayload(this.form.getRawValue(), this.inputData.certificate.certificateRequestId, 'Complete');
    payloadPromise.then(payload => {
      const submissionObservable = this.projectService.doCertificateAction(this.inputData.projectId, payload)
      return submissionObservable.pipe(
        tap(result => {
          this.isSubmitting.set(false);
          if (result.actionResult !== 'Failed') {
            this.dialog.hide();
            if (typeof this.inputData?.onSigningCompleted === 'function') this.inputData.onSigningCompleted();
          }
          else {
            this.notificationService.showNotification({
              title: 'Error while signing!',
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
            }, true);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          let errorMessage = '';
          if (error.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // server-side error
            errorMessage = `Error status: ${error.status}\nMessage: ${error.message}`;
          }
          this.notificationService.showNotification({
            title: `Error while signing!`,
            description: `${errorMessage
              || 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'}`,
          }, true);
          return throwError(() => {
            return errorMessage;
          });
        }),
      ).subscribe();
    })
  }

  onCancel(): void {
    this.dialog.hide();
  } 
}
