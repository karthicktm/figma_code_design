import { HttpStatusCode } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '@eds/vanilla';
import { Observable, PartialObserver, of } from 'rxjs';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import { AttachedEvidence, NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CountriesWithCustomer, EvidenceParentType, ExternalActivity, ToolContext } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { APICallStatus } from 'src/app/shared/dialog-data.interface';
import { OptionWithValue } from 'src/app/shared/select/select.interface';

@Component({
  selector: 'app-source-sde-report-wizard',
  templateUrl: './source-sde-report-wizard.component.html',
  styleUrls: ['./source-sde-report-wizard.component.less']
})
export class SourceSdeReportWizardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dialogWizard') readonly dialogWizardElementRef: ElementRef<HTMLElement>;

  @Input() readonly inputData: {
    projectId: string,
    parentId: string,
    parentType: EvidenceParentType,
    parentEvidenceId?: string,
    context?: ToolContext,
  };
  @Output() readonly submissionResult: EventEmitter<AttachedEvidence[] | string> = new EventEmitter();
  private scripts: Scripts[] = [];
  private wizard: Wizard;
  private eventAbortController = new AbortController();

  dialogForm = new FormGroup({
    step1: new FormGroup({
      countryInput: new FormControl('', [Validators.required]),
      customerNameInput: new FormControl('', [Validators.required])
    }),
    step2: new FormGroup({
      projectInput: new FormControl('', [Validators.required]),
      siteInput: new FormControl('', [Validators.required])
    }),
    step3: new FormGroup({
      activities: new FormControl([], [
        Validators.required,
        Validators.minLength(1)
      ])
    }),
  });

  currentStep: number;
  loading = false;
  fetchingSite = false;
  fetchingCountry = false;
  fetchingCountryError = false;

  parentId: string;
  parentType: EvidenceParentType;
  projectId: string;
  parentEvidenceId: string;
  countryList: OptionWithValue[];
  projectList: OptionWithValue[];
  siteList: OptionWithValue[];
  activityList: ExternalActivity[] = [];
  public statusMessage: string;
  public show: APICallStatus;
  public referenceDocType: string;
  public referenceDocText: string;
  public textBefore: string;
  public textAfter: string;
  public customerList: string[];
  public countriesWithCustomer: CountriesWithCustomer[];

  constructor(
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
    private networkRollOutService: NetworkRollOutService
  ) {
    this.currentStep = 1;
  }

  ngOnInit(): void {
    this.projectId = this.inputData.projectId;
    this.parentId = this.inputData.parentId;
    this.parentType = this.inputData.parentType;
    if (!!this.inputData.parentEvidenceId) {
      this.parentEvidenceId = this.inputData.parentEvidenceId;
    }
    this.fetchDataForCurrentStep();
  }

  ngAfterViewInit(): void {
    const wizardDom = this.dialogWizardElementRef.nativeElement;
    this.wizard = new Wizard(wizardDom);
    this.wizard.init();
    this.scripts.push(this.wizard);

    wizardDom.addEventListener('wizardState', (event: CustomEvent) => {
      const currentStep = event.detail && event.detail.state && event.detail.state.currentStep + 1; // wizard steps are 0-based

      if (this.currentStep !== currentStep) {
        this.currentStep = currentStep;
        this.fetchDataForCurrentStep();
      }
    }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
  }

  private fetchDataForCurrentStep(): void {
    switch (this.currentStep) {
      case 1:
          this.fetchCountry();
        break;
      case 2:
        if (!this.projectList) {
          this.fetchProject();
        }
        break;
      case 3:
        if (!this.activityList) {
          this.fetchActivity();
        }
        break;
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
    this.eventAbortController.abort();

  }

  quitSubmitResult(): void {
    this.show = undefined;
  }

  get selectedTool(): string {
    return 'SDE';
  }

  get selectedCountry(): string {
    return this.dialogForm.get('step1.countryInput').value;
  }

  get selectedCustomer(): string {
    return this.dialogForm.get('step1.customerNameInput').value;
  }

  get selectedProjectId(): string {
    return this.dialogForm.get('step2.projectInput').value;
  }

  get selectedSiteId(): string {
    return this.dialogForm.get('step2.siteInput').value;
  }

  get selectedActivityIds(): string[] {
    return this.dialogForm.get('step3.activities').value;
  }

  public fetchCountry(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.fetchingCountry = true;
        this.fetchingCountryError = false;
      })
    );

    const countries:Observable<CountriesWithCustomer[]> = this.networkRollOutService.getCountries().pipe(map((countryList) => countryList),
      tap(() => {
        this.fetchingCountry = false;
        this.fetchingCountryError = false;
      }),
      catchError((err) => {
        this.fetchingCountry = false;
        this.fetchingCountryError = true;
        console.error(err);
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: `Error getting list of countries`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else {
          this.notificationService.showNotification({
            title: `Error getting list of countries`,
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
        return [];
      }),
    );

    loadingStartFlagging.pipe(
      exhaustMap(() => countries),
    ).subscribe(countries => {
      this.countriesWithCustomer = countries;
      this.countryList = countries.map(country => {
        return { option: `${country.countryName} (${country.countryCode})`, optionValue: country.countryCode };
      });
    });
  }

  public onSelectCountry(countryCode: string): void {
    if (countryCode && this.selectedCountry !== countryCode) {
      this.customerList = this.countriesWithCustomer?.find(c => c.countryCode === countryCode).customers;
      this.dialogForm.get('step1.countryInput').setValue(countryCode);
      this.resetProjects();
    }
  }

  public onSelectCustomer(customer: string): void {
    if (this.selectedCustomer !== customer) {

      this.dialogForm.get('step1.customerNameInput').setValue(customer);
    }
  }

  public fetchProject(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loading = true;
      })
    );

    const countryCode = this.selectedCountry;
    const projects = this.networkRollOutService.getExternalProjects(this.selectedTool, countryCode, this.selectedCustomer).pipe(map((projectList: any[]) => {
      return projectList.map(project => {
        return {
          optionValue: project.projectId,
          option: project.projectName
        };
      });
    }),
      tap(() => {
        this.loading = false;
      }),
      catchError((err) => {
        this.loading = false;
        console.error(err);
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: `Error getting projects from ${this.selectedTool}`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else {
          this.notificationService.showNotification({
            title: `Error getting projects from ${this.selectedTool}`,
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
        return [];
      }),
    );

    loadingStartFlagging.pipe(
      exhaustMap(() => projects),
    ).subscribe(projects => this.projectList = projects);
  }

  public onSelectProject(project: string): void {
    if (this.selectedProjectId !== project) {
      this.dialogForm.get('step2.projectInput').setValue(project);
      this.resetSites();
      this.fetchSite();
    }
  }

  private resetProjects(): void {
    this.dialogForm.get('step2.projectInput').reset();
    this.projectList = undefined;
    this.resetSites();
  }

  public fetchSite(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.fetchingSite = true;
      })
    );

    const sites = this.networkRollOutService.getExternalSites(this.selectedTool, this.selectedProjectId).pipe(map((sites: any[]) => {
      return sites.map(site => {
        return {
          optionValue: site.siteId,
          option: site.siteName
        };
      });
    }),
      tap(() => {
        this.fetchingSite = false;
        this.loading = false;
      }),
      catchError((err) => {
        this.fetchingSite = false;
        console.error(err);
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: `Error getting sites of project ${this.selectedProjectId}`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else {
          this.notificationService.showNotification({
            title: `Error getting sites of project ${this.selectedProjectId}`,
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
        return [];
      }),
    );

    loadingStartFlagging.pipe(
      exhaustMap(() => sites),
    ).subscribe(sites => this.siteList = sites);
  }

  public onSelectSite(site: string): void {
    this.dialogForm.get('step2.siteInput').setValue(site);
  }

  private resetSites(): void {
    this.dialogForm.get('step2.siteInput').reset();
    this.siteList = undefined;
    this.resetActivities();
  }

  public fetchActivity(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loading = true;
      })
    );

    const selectedSiteName = this.siteList.find(site => site.optionValue === this.selectedSiteId).option;
    const activities = this.networkRollOutService.getExternalActivities(this.selectedTool, this.selectedProjectId, selectedSiteName).pipe(
      tap(() => {
        this.loading = false;
      }),
      catchError((err) => {
        this.loading = false;
        console.error(err);
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: `Error getting activities in site ${this.selectedSiteId} of project ${this.selectedProjectId}`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else {
          this.notificationService.showNotification({
            title: `Error getting activities in site ${this.selectedSiteId} of project ${this.selectedProjectId}`,
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
        return [];
      }),
    );

    loadingStartFlagging.pipe(
      exhaustMap(() => activities),
    ).subscribe(activities => this.activityList = activities);
  }

  public onActivityCheckboxChange(event): void {
    if (event.target.checked) {
      this.dialogForm.get('step3.activities').setValue([...this.selectedActivityIds, event.target.value])
    } else {
      this.dialogForm.get('step3.activities').setValue(this.selectedActivityIds.filter((id => id !== event.target.value)));
    }
  }

  public onCheckAllActivities(event): void {
    if (event.target.checked) {
      this.dialogForm.get('step3.activities').setValue(this.activityList.map(activity => activity.activityId));
    } else {
      this.dialogForm.get('step3.activities').setValue([]);
    }
  }

  private resetActivities(): void {
    this.dialogForm.get('step3.activities').setValue([]);
    this.activityList = undefined;
  }

  public onSubmitAddReport(): void {
    const selectedSiteName = this.siteList.find(site => site.optionValue === this.selectedSiteId).option;
    // Map selected IDs to list of activities
    const selectedActivities = this.selectedActivityIds.map(id => this.activityList.find(activity => activity.activityId === id));

    this.show = APICallStatus.Loading;

    const source = {
      networkRolloutTool: this.selectedTool,
      siteId: this.selectedSiteId,
      siteName: selectedSiteName,
      activities: selectedActivities
    };

    const parentType = this.parentType || 'Project'
    const parentId = parentType === 'Project' ? undefined : this.parentId;

    const target = {
      parentId,
      parentType,
      projectId: this.projectId,
      parentEvidenceId: this.parentEvidenceId,
    };
    const observer: PartialObserver<AttachedEvidence[] | string> = {
      next: (result) => {
        this.loading = false;
        this.show = APICallStatus.Success;
        this.statusMessage = 'Adding report successfully!';

        // goto wizard-finished
        this.wizard.goToStep(this.wizard.steps.state.numSteps);
        this.submissionResult.emit(result);
      },
      error: (err) => {
        this.loading = false;
        this.show = APICallStatus.Error;
        let additionalMessage = '';
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: 'Error when adding report!',
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);

          additionalMessage = `\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.`;
        } else {
          this.notificationService.showNotification({
            title: 'Error when adding report!',
            description: 'Click to open the FAQ doc for further steps.'
          }, true);

          additionalMessage = `\n Please follow the FAQ doc for further steps.`;
        }
        this.statusMessage = 'Error when adding report!' + additionalMessage;
        const index = this.statusMessage.indexOf('FAQ');
        if (index !== -1) {
          this.textBefore = this.statusMessage.substring(0, index);
          this.textAfter = this.statusMessage.substring(index + 3);
          this.referenceDocType = 'FAQ';
          this.referenceDocText = 'FAQ';
        }
      },
    };
    if (this.inputData.context && this.inputData.context === ToolContext.nro) {
      this.networkRollOutService.addExternalProjectReport(
        source,
        target,
      ).subscribe(observer);
    } else {
      this.projectsService.addExternalProjectReport(
        source,
        target,
      ).subscribe(observer);
    }
  }

  onCancel(): void {
    this.submissionResult.emit(undefined);
  }
}
