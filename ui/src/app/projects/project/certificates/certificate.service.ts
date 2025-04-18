import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { catchError, map, of } from 'rxjs';
import { Certificate, CertificateActionBody } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { CertificatePreviewDialogComponent } from './certificate-preview-dialog/certificate-preview-dialog.component';
import { CertificateSigningDialogComponent, Data as CertificateSigningDialogData } from './certificate-signing-dialog/certificate-signing-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
    constructor(
    private projectService: ProjectsService,
    private domSanitizer: DomSanitizer,
    private dialogService: DialogService
  ) { }

  openPreview(projectId: string, certificate: Pick<Certificate, 'certificateRequestId'>): void {
    const data = {
      certificate,
      previewURL: this.projectService.getCertificatePreview(projectId, { id: certificate.certificateRequestId }).pipe(
        map(response => response.certificatePreview),
        map(htmlString => {
          if (htmlString === undefined) throw new Error(`Invalid preview data.`);
          const blob = new Blob([htmlString], { type: 'text/html' });
          return this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
        }),
        catchError(() => {
          const htmlString = '<!DOCTYPE html><html><body><p>Failed to load the preview. Please try again later.</p></body></html>';
          const blob = new Blob([htmlString], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          return of(this.domSanitizer.bypassSecurityTrustResourceUrl(url));
        }),
      ),
    }
    this.dialogService.createDialog(CertificatePreviewDialogComponent, data);
  }

  openSigningFlow(signingProperties: CertificateSigningDialogData): void {
    this.dialogService.createDialog(CertificateSigningDialogComponent, signingProperties);
  }

  async generateCertificateActionPayload(
    form: { signature: File; designation: string; }, 
    certificateRequestId: string, 
    actionType: 'Complete' | 'Rejected'
  ): Promise<CertificateActionBody> {
    const getBase64DataURLOf = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (): void => resolve(reader.result as string);
        reader.onerror = (error): void => reject(error);
        reader.readAsDataURL(file);
      });
    }
    const signatureImage = await getBase64DataURLOf(form.signature).then(url => url.replace('data:image/png;base64,', ''));
    return {
      actionType,
      certificateRequestId,
      designation: form.designation,
      signatureImage,
    };
  }  
}
