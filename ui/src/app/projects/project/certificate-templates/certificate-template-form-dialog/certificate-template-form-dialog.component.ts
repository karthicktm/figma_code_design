import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { CertificateTemplateFormComponent } from '../certificate-template-form/certificate-template-form.component';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-certificate-template-form-dialog',
  standalone: true,
  templateUrl: './certificate-template-form-dialog.component.html',
  styleUrl: './certificate-template-form-dialog.component.less',
  imports: [
    CertificateTemplateFormComponent,
  ],
})

export class CertificateTemplateFormDialogComponent extends EDSDialogComponent {
  @Output() dialogResult: EventEmitter<boolean> = new EventEmitter();

  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      projectId: string,
    },
  ) {
    super();
  }

  onSubmit(): void {
    this.dialogResult.emit(true);
    this.dialog.hide();
    this.dialog.destroy();
  }
}
