import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { CertificateTemplate } from 'src/app/projects/projects.interface';
import { SharedModule } from '../../../../shared/shared.module';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-preview-certificate-template-dialog',
    standalone: true,
    templateUrl: './preview-certificate-template-dialog.component.html',
    styleUrl: './preview-certificate-template-dialog.component.less',
    imports: [
      SharedModule,
    ]
})
export class PreviewCertificateTemplateDialogComponent extends EDSDialogComponent {
  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      certificateTemplate: CertificateTemplate,
      certificatePreviewURL: Observable<string>,
    },
  ) {
    super();
  }
}
