import { AfterViewInit, Component, effect, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Wizard } from '@eds/vanilla';
import { ConfirmationDialogComponent } from 'src/app/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { NavigationService } from 'src/app/shared/navigation.service';
import { FormGroup } from '@angular/forms';
import { ControlModel, ReworkPackageControlService } from './rework-acceptance-package-control.service';
import { catchError, expand, map, reduce, switchMap, takeWhile, tap } from 'rxjs/operators';
import { CustomerAcceptanceStatus, Evidence, EvidenceDetails, GetEvidenceResponse, GetMilestoneEvidencesResponse, MilestoneEvidenceRow, PackageDetails, PackageLineItemShort, RelatedEvidence, ReworkAcceptancePackageRequest } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';
import { EMPTY, Observable, PartialObserver, Subscription, forkJoin, of } from 'rxjs';
import { DetailsContextualService } from '../acceptance-package-details/details-contextual.service';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';

export interface LineItemTableData {
  lineItemLinearId: string;
  lineItemName: string;
  evidences: Evidence[];
  rejectedFiles: number;
  description: string
  lineItemId: string
}

@Component({
  selector: 'app-rework-acceptance-package',
  templateUrl: './rework-acceptance-package.component.html',
  styleUrls: ['./rework-acceptance-package.component.less'],
  providers: [ReworkPackageControlService, DetailsContextualService]
})
export class ReworkAcceptancePackageComponent implements OnInit, AfterViewInit {
  @ViewChild('reworkPackageWizard')
  readonly reworkPackageWizardElementRef: ElementRef<HTMLElement>;
  projectId: string;
  packageId: string;
  wizardIsLoaded = false;
  wizard: Wizard;
  private scripts: Scripts[] = [];
  currentStep: number = 0;
  get isStatusLegendEnabled(): boolean {
    const stepsWithLegendEnabled = [1, 2];
    return !!stepsWithLegendEnabled.find(step => this.wizard?.steps?.state?.currentStep === step);
  };
  processing: boolean;
  packageForm!: FormGroup<ControlModel>;
  loadingLineItemDetails: boolean;
  loadingPackageEvidences: boolean;
  loadingMilestoneEvidences: boolean;
  limit: number = 50;
  offset: number = 0;
  lineItems: PackageLineItemShort[];
  lineItemTotalRecords: number;
  evidenceTotalRecords: number;
  milestoneEvidenceTotalRecords: number;
  packageDetails: PackageDetails;
  readonly isMilestoneAcceptance = signal<boolean>(undefined);
  packageComponentTable: Observable<LineItemTableData[]>;
  evidenceTable: Observable<Evidence[]>;
  milestoneEvidenceTable: Observable<MilestoneEvidenceRow[]>;
  statuses = [CustomerAcceptanceStatus.CustomerRejected, CustomerAcceptanceStatus.Ready];
  private subscription: Subscription = new Subscription();
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService,
    private navigationService: NavigationService,
    private notificationService: NotificationService,
    private reworkPackageControlService: ReworkPackageControlService,
    private projectService: ProjectsService,
    private networkRollOutService: NetworkRollOutService,
  ) {
    effect(() => {
      const isMilestoneAcceptance = this.isMilestoneAcceptance();
      const observer: PartialObserver<{
        packageComponentTable: LineItemTableData[];
        evidenceTable: Evidence[];
        milestoneEvidenceTable: MilestoneEvidenceRow[];
      }> = {
        next: data => {
          // Assign the Observables
          this.packageComponentTable = of(data.packageComponentTable);
          this.evidenceTotalRecords = data.evidenceTable.length;
          this.evidenceTable = of(data.evidenceTable);
          this.milestoneEvidenceTotalRecords = data.milestoneEvidenceTable.length;
          this.milestoneEvidenceTable = of(data.milestoneEvidenceTable);
        },
      };
      if (isMilestoneAcceptance !== undefined && isMilestoneAcceptance) {
        forkJoin({
          packageComponentTable: this.getLineItemEvidencesByPackageId(),
          evidenceTable: of([]),
          milestoneEvidenceTable: this.getMilestoneEvidencesByPackageId(),
        }).subscribe(observer);
      } else if (isMilestoneAcceptance !== undefined && !isMilestoneAcceptance) {
        forkJoin({
          packageComponentTable: this.getLineItemEvidencesByPackageId(),
          evidenceTable: this.getEvidencesByPackageId(),
          milestoneEvidenceTable: of([]),
        }).subscribe(observer);
      }
    });
  }

  ngOnInit(): void {
    this.projectId = this.route.parent.snapshot.params.id;
    this.packageId = this.route.snapshot.params.id;
    this.fetchPackageDetails(this.packageId);

    this.packageForm = this.reworkPackageControlService.toFormGroup({
      packageComponents: [], // Initialize as an empty array
      packageEvidences: [],
      milestoneEvidences: []
    });
  }

  fetchPackageDetails(projectId): void {
    this.projectService.getAcceptancePackage(projectId).subscribe(data => {
      this.packageDetails = data;
      this.isMilestoneAcceptance.set(data.isMilestoneAcceptance);
    })
  }

  /**
   * Go back to previous page
   * Show confirmation dialog
   *
   * @returns void
   */
  goBack(): void {
    const dialogRef = this.dialogService.createDialog(ConfirmationDialogComponent, {
      title: 'Cancel creating new package?',
      message: 'Are you sure you want to cancel creating a new package? All changes will be lost.',
    });
    dialogRef.instance.dialogResult.subscribe((result: any) => {
      if (result) {
        // go to history back
        const fallbackUrl = `/projects/${this.projectId}/acceptance-packages`;
        this.navigationService.back(fallbackUrl);
      }
    });
  }

  ngAfterViewInit(): void {
    // init eds wizard
    this.wizard = new Wizard(this.reworkPackageWizardElementRef.nativeElement);
    this.wizard.init();
    this.scripts.push(this.wizard);
    this.wizardIsLoaded = true;
  }

  isLastStep(): boolean {
    const currentStep = this.wizard?.steps.state.currentStep + 1;
    return currentStep === this.wizard?.steps.state.numSteps || currentStep === this.wizard?.steps.state.numSteps + 1;
  }

  /**
   * Go to next step
   * Validate current step
   * @returns void
   **/
  onNextStep(): void {
    this.currentStep = this.wizard.steps.state.currentStep + 1;
    if (this.currentStepIsInvalid()) {
      this.notificationService.showNotification(
        {
          title: `This step contains invalid form fields!`,
          description: 'Please review the wizard steps and fix the errors.',
        },
        true
      );
      return;
    }
    this.wizard.goToStep(this.currentStep);
  }

  /**
   * check if current step is invalid
   * @param step number
   * @returns boolean
   **/
  currentStepIsInvalid(): boolean {
    if (!this.wizardIsLoaded) {
      return false;
    }
    if (this.currentStep === 1) {
      return false;
    }
    else if (this.currentStep === 2) {
      const formGroup = this.packageForm.controls.packageComponents;
      return formGroup.invalid;
    }
    else if (this.currentStep === 3) {
      return false;
    }
    else {
      return false;
    }
  }

  getLineItemEvidencesByPackageId(): Observable<LineItemTableData[]> {
    this.loadingLineItemDetails = true;

    const filterPost = {
      lineItemProperties: {
        statuses: [CustomerAcceptanceStatus.CustomerRejected],
      }
    };

    return of({
      morePages: true,
      limit: this.limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.projectService.getLineItemsSearchShort(filterPost, this.limit, data.nextOffset, this.packageId);
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      switchMap(data => {
        this.lineItems = data.results;
        // Workaround to show rejected line items only if BE does not filter the list correctly
        const results = data.results.filter(data => data.status === CustomerAcceptanceStatus.CustomerRejected)

        if (results.length > 0) {
          this.lineItemTotalRecords = results.length;
          const fetchObservables: Observable<Evidence[]>[] = results.map((item) =>
            this.fetchLineItemEvidencesDetails(item.internalId)
          );

          return forkJoin(fetchObservables).pipe(
            map((evidencesArray: Evidence[][]) => {
              const newLineItemEvidence = results.map((item, index) => {
                const evidences = evidencesArray[index];
                return {
                  lineItemLinearId: item.internalId,
                  evidences: evidences,
                  rejectedFiles: evidences.filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected).length,
                  description: item.description,
                  lineItemId: item.id,
                  lineItemName: item.name
                };
              });
              this.packageForm.controls.packageComponents.setValue([...this.packageForm.controls.packageComponents.value, ...newLineItemEvidence]);
              return newLineItemEvidence;
            })
          );
        } else {
          this.lineItemTotalRecords = 0;
          return of([]);
        }
      }),
      reduce((acc, results) => ([...acc, ...results])),
      tap((data) => this.loadingLineItemDetails = false),
      catchError((err) => {
        this.loadingLineItemDetails = false;
        console.error(err);
        return [];
      }),
    );
  }

  fetchLineItemEvidencesDetails(lineItemId: string): Observable<EvidenceDetails[]> {
    const getLineItemEvidencesDetails = this.projectService.getAllLineItemEvidences(this.packageId, lineItemId);

    const packageLineItemEvidences = getLineItemEvidencesDetails.pipe(
      map(evidences => {
        return evidences
          .filter(evidence => {
            return evidence.status === CustomerAcceptanceStatus.CustomerRejected || evidence.status === CustomerAcceptanceStatus.Ready
          })
          .map(rejectedEvidence => ({
            ...rejectedEvidence,
            lineItemId,
          }));
      }),
      catchError((error) => {
        // Handle the error, such as logging or displaying an error message.
        console.error('Error fetching line item details:', error);
        return of([] as EvidenceDetails[]); // Return an empty array in case of an error
      })
    );

    const newProjectLineItemEvidences = this.networkRollOutService.getAllLineItemEvidences(this.projectId, lineItemId).pipe(
      // Only use evidences with required state
      map(projectLineItemEvidences => projectLineItemEvidences.filter(item => item.status === CustomerAcceptanceStatus.Ready)),
      catchError(err => {
        this.notificationService.showNotification({
          title: 'Failed to load line item evidences for current project line item',
        });
        return of([] as EvidenceDetails[]);
      }),
    )
    return forkJoin([packageLineItemEvidences, newProjectLineItemEvidences]).pipe(
      map(results => {
        const mappedPackageLineItemEvidences = results[0].map(evidence => {
          const relatedEvidence = results[1].filter(newEvidence => newEvidence.parentEvidenceId !== undefined && newEvidence.parentEvidenceId === evidence.internalId);
          if (relatedEvidence && relatedEvidence.length > 0) evidence.relatedEvidences = relatedEvidence;
          return evidence;
        });
        return [mappedPackageLineItemEvidences, results[1]];
      }),
      map(results => results.flat()),
    );
  }

  fetchRelatedEvidences(evidenceId: string): Observable<RelatedEvidence[]> {
    return this.networkRollOutService.getRelatedEvidenceList(evidenceId).pipe(
      map(relatedEvidences => relatedEvidences.filter(item => item.status === CustomerAcceptanceStatus.Ready)),
      catchError(err => {
        console.error('Error fetching related evidences:', err);
        this.notificationService.showNotification({
          title: `Failed to load related evidences for evidence ${evidenceId}`,
        });
        return of([] as RelatedEvidence[]); // Return an empty array in case of an error
      }),
    );
  }

  getEvidencesByPackageId(): Observable<Evidence[]> {
    this.loadingPackageEvidences = true;
    return of({
      morePages: true,
      limit: this.limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.projectService.getPackageAdditionalEvidencesBySearch(
            { statuses: this.statuses },
            this.packageId,
            this.limit,
            data.nextOffset,
            null,
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetEvidenceResponse) => {
        data.results.map(data => {
          if (!data.relatedEvidences) { data.relatedEvidences = [] }
          return data;
        });
        return data.results;
      }),
      reduce((acc, results) => ([...acc, ...results])),
      switchMap(data => {
        if (data.length > 0) {
          const fetchObservables: Observable<RelatedEvidence[]>[] = data.map((evidence) => {
            if (evidence.status === CustomerAcceptanceStatus.CustomerRejected) return this.fetchRelatedEvidences(evidence.internalId);
            else return of([]); // Do not retrieve related evidences if parent evidence is not rejected
          });

          return forkJoin(fetchObservables).pipe(
            map((evidencesArray: RelatedEvidence[][]) => {
              const newEvidences = data.map((evidence, index) => {
                const relatedEvidences = evidencesArray[index];
                if (relatedEvidences && relatedEvidences.length > 0) {
                  evidence.relatedEvidences = evidence.relatedEvidences.concat(relatedEvidences);
                }
                return evidence;
              });
              return newEvidences;
            })
          );
        } else {
          return of([]);
        }
      }),
      tap(data => this.packageForm.controls.packageEvidences.setValue(data)),
      tap(() => this.loadingPackageEvidences = false),
      catchError((err) => {
        this.loadingPackageEvidences = false
        console.error(err);
        return [];
      }),
    );
  }

  getMilestoneEvidencesByPackageId(): Observable<MilestoneEvidenceRow[]> {
    this.loadingMilestoneEvidences = true;
    return of({
      morePages: true,
      limit: this.limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.projectService.getPackageMilestoneEvidences(
            this.packageId,
            this.limit,
            data.nextOffset,
            {
              status: {
                searchText: this.statuses.join(),
                columnName: '',
                sortingIndex: 0,
                sortingOrder: ''
              }
            },
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetMilestoneEvidencesResponse) => {
        data.results.map(data => {
          if (!data.relatedEvidences) { data.relatedEvidences = [] }
          return data;
        });
        return data.results;
      }),
      reduce((acc, results) => ([...acc, ...results])),
      switchMap(data => {
        if (data.length > 0) {
          const fetchObservables: Observable<RelatedEvidence[]>[] = data.map((evidence) => {
            if (evidence.status === CustomerAcceptanceStatus.CustomerRejected) return this.fetchRelatedEvidences(evidence.internalId);
            else return of([]); // Do not retrieve related evidences if parent evidence is not rejected
          });

          return forkJoin(fetchObservables).pipe(
            map((evidencesArray: RelatedEvidence[][]) => {
              const newEvidences = data.map((evidence, index) => {
                const relatedEvidences = evidencesArray[index];
                if (relatedEvidences && relatedEvidences.length > 0) {
                  evidence.relatedEvidences = evidence.relatedEvidences.concat(relatedEvidences);
                }
                return evidence;
              });
              return newEvidences;
            })
          );
        } else {
          return of([]);
        }
      }),
      tap(data => this.packageForm.controls.milestoneEvidences.setValue(data)),
      tap(() => this.loadingMilestoneEvidences = false),
      catchError((err) => {
        this.loadingMilestoneEvidences = false
        console.error(err);
        return [];
      }),
    );
  }

  private mapFormDataToRequestPayload(): ReworkAcceptancePackageRequest {
    const lineItems = this.packageForm.controls.packageComponents.value.map(data => data.lineItemLinearId);

    const evidences = this.packageForm.controls.packageEvidences.value.map(data => data.internalId);
    const relatedEvidences = this.packageForm.controls.packageEvidences.value.flatMap(data => {
      return data.relatedEvidences.map(re => re.internalId)
    });
    const packageEvidences = [...evidences, ...relatedEvidences,];

    const milestoneEvidenceData = this.packageForm.controls.milestoneEvidences.value.map(data => data.internalId);
    const milestoneRelatedEvidences = this.packageForm.controls.milestoneEvidences.value.flatMap(data => {
      return data.relatedEvidences.map(re => re.internalId)
    });
    const milestoneEvidences = [...milestoneEvidenceData, ...milestoneRelatedEvidences];

    return {
      lineItems,
      packageEvidences,
      milestoneEvidences
    };
  }

  /**
   * Submit form
   **/
  onSubmit(): void {
    this.processing = true;
    // stay in the last step of the wizard so the buttons won't be removed by EDS standard wizard behavior
    this.wizard.goToStep(this.wizard.steps.state.numSteps - 2);
    // map form data to request body
    const payload = this.mapFormDataToRequestPayload();
    this.subscription.add(
      this.networkRollOutService.updateReworkAcceptancePackage(this.projectId, this.packageId, payload).subscribe({
        next: () => {
          this.processing = false;
          this.notificationService.showNotification({
            title: 'Acceptance package updated successfully!',
          });
          this.router.navigate([`/projects/${this.projectId}/acceptance-packages`]);
        },
        error: err => {
          this.processing = false;
          this.notificationService.showNotification(
            {
              title: `Error while updating acceptance package!`,
              description:
                'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
            },
            true
          );
        },
      })
    );
  }
}
