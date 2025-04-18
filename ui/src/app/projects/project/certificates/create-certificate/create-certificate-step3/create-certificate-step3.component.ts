import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, Subscription, catchError, debounceTime, distinctUntilChanged, map, of, tap } from 'rxjs';
import { CertificateForm } from '../create-certificate.component';
import { ProjectsService } from 'src/app/projects/projects.service';
import { CertificatePreviewRequestBody, SignatoryDetails, SignatoryType, WorkPlanDetails } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-create-certificate-step3',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './create-certificate-step3.component.html',
  styleUrl: './create-certificate-step3.component.less'
})
export class CreateCertificateStep3Component implements OnInit, OnDestroy {
  @Input() certificateForm!: FormGroup<CertificateForm>;
  @Input() projectId!: string;
  loadingPreview = signal(false);
  previewURL: Observable<string | SafeResourceUrl>;

  private subscription: Subscription = new Subscription();

  constructor(
    private projectService: ProjectsService,
    private domSanitizer: DomSanitizer,
  ) {
  }

  ngOnInit(): void {
    const formValueChanges = this.certificateForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => {
        this.fetchPreview();
      }),
    ).subscribe();

    this.subscription.add(formValueChanges);
  }

  public fetchPreview(): void {
  // if (this.certificateForm.valid) {
      this.loadingPreview.set(true);
      const requestBody: CertificatePreviewRequestBody = this.transformToCertificateRequestBody(this.certificateForm);

      this.previewURL = this.projectService.getCertificatePreview(this.projectId, requestBody).pipe(
        map(response => response.certificatePreview),
        map(htmlString => {
          if (htmlString === undefined) throw new Error(`Invalid certificate data.`);
          const blob = new Blob([htmlString], { type: 'text/html' });
          return this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
        }),
        catchError(() => {
          const htmlString = '<!DOCTYPE html><html><body><p>Failed to load the preview. Please try again later.</p></body></html>';
          const blob = new Blob([htmlString], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          return of(this.domSanitizer.bypassSecurityTrustResourceUrl(url));
        }),
        tap(() => this.loadingPreview.set(false)),
      );
    // }
  }

  private transformToCertificateRequestBody(form: FormGroup<CertificateForm>): CertificatePreviewRequestBody {
    const certificateTemplateId = form.controls.step2.controls.generalDetails.controls.templateSelectInput.value;
    const additionalInformation = {
      additionalInfo1: form.controls.step2.controls.generalDetails.controls.additionalInformationInput_0?.value,
      additionalInfo2: form.controls.step2.controls.generalDetails.controls.additionalInformationInput_1?.value,
      additionalInfo3: form.controls.step2.controls.generalDetails.controls.additionalInformationInput_2?.value,
    }
    const cSignatories = form.controls.step2.controls.customerSignatory.getRawValue().cSignatory.map<SignatoryDetails>((signatory, index) => ({ signatoryId: signatory.id, signatoryName: signatory.name, signatoryType: SignatoryType.customer, signatoryLevelId: index + 1 }));
    const eSignatories = form.controls.step2.controls.ericssonSignatory.getRawValue().eSignatory.map<SignatoryDetails>((signatory, index) => ({ signatoryId: signatory.id, signatoryName: signatory.name, signatoryType: SignatoryType.ericsson, signatoryLevelId: index + 1 }));
    const signatoryDetails = [...eSignatories, ...cSignatories];
    const workplanDetails = form.controls.step1.controls.workplanSites.value.map<WorkPlanDetails>(workPlan => {
      const { workplanName, siteName, siteIdByCustomer, siteNameByCustomer, siteType, ...others } = workPlan;
      const filteredOthers = Object.keys(others).reduce((acc, key) => {
        acc[key] = others[key];
        return acc;
      }, {});
      return {
        name: workPlan.workplanName,
        siteName: workPlan.siteName,
        siteIdByCustomer: workPlan.siteIdByCustomer,
        siteNameByCustomer: workPlan.siteNameByCustomer,
        siteType: workPlan.siteType,
        others: filteredOthers
      }
    });
    return {
      certificateTemplateId,
      placeholders: additionalInformation,
      signatoryDetails,
      workplanDetails,
    };
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  retryLoading(): void {
    this.fetchPreview();
  }
}
