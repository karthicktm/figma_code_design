import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Output } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { CertificateTemplateFormComponent } from '../certificate-template-form/certificate-template-form.component';
import { CertificateTemplate } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-certificate-template-edit-form-dialog',
  standalone: true,
  imports: [
    CertificateTemplateFormComponent,
  ],
  templateUrl: './certificate-template-edit-form-dialog.component.html',
  styleUrl: './certificate-template-edit-form-dialog.component.less',
})
export class CertificateTemplateEditFormDialogComponent extends EDSDialogComponent {
  @Output() dialogResult: EventEmitter<boolean> = new EventEmitter();

  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      projectId: string,
      template: CertificateTemplate,
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
