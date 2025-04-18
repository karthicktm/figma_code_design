import { AsyncPipe, NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { Certificate } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-certificate-preview-dialog',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
  ],
  templateUrl: './certificate-preview-dialog.component.html',
  styleUrl: './certificate-preview-dialog.component.less'
})
export class CertificatePreviewDialogComponent extends EDSDialogComponent {
  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      certificate: Certificate,
      previewURL: Observable<string>,
    },
  ) {
    super();
  }
}
