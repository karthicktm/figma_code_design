import { Component, effect, ElementRef, OnDestroy, signal, viewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { TabGroup } from '@eds/vanilla';
import { MetricCardComponent, UrlConfig } from './metric-card/metric-card.component';
import { CardConfig, MetricCardsComponent } from './metric-cards/metric-cards.component';
import { SharedModule } from '../shared/shared.module';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { OptionWithValue } from '../shared/select/select.interface';
import { ProjectsService } from '../projects/projects.service';
import { FilterSortConfiguration } from '../shared/table-server-side-pagination/table-server-side-pagination.component';
import { DashboardService } from './dashboard.service';
import { CertificatesCount, PackagesCount } from './dashboard.interface';
import { UserSession } from '../user-management/user-management.interface';
import { CacheKey, SessionStorageService } from '../portal/services/session-storage.service';
import { RoleType } from '../group-management/group-management-interfaces';

enum TabIdentifier {
  packageApprover = 'As package approver',
  packageObserver = 'As package observer',
  certificateSignatory = 'As certificate signatory',
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    MetricCardsComponent,
    SharedModule,
    RouterOutlet,
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.less',
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  private readonly tabsElementRef = viewChild.required<ElementRef<HTMLElement>>('tabs');
  private readonly tabQueryParameterKey = 'dashboardTab';
  private tabGroup: TabGroup;
  protected readonly tabConfigs = Object.entries(TabIdentifier).map(identifier => {
    const [tab, name] = identifier;
    return { tab, name };
  });
  protected targetTab: string;
  protected tabContents: { [key in keyof typeof TabIdentifier]: CardConfig[] } = {
    packageApprover: [
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Pending packages - SLA not over yet',
          icon: 'icon-warning-circle color-orange',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'packages',
            queryParams: {
              dashboardTab: 'packageApprover',
              status: `CustomerNewPendingApproval,CustomerReworkedPendingApproval,NoSlaOverdue`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'acceptance-packages',
            queryParams: { acceptancePackagesTab: 'InProgress' },
          },
        },
      },
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Pending packages - SLA overdue',
          icon: 'icon-severity-indeterminate color-gray',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'packages',
            queryParams: {
              dashboardTab: 'packageApprover',
              status: `CustomerNewPendingApproval,CustomerReworkedPendingApproval,SlaOverdue`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'acceptance-packages',
            queryParams: { acceptancePackagesTab: 'InProgress' },
          },
        },
      },
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Rejected packages',
          icon: 'icon-failed color-red',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'packages',
            queryParams: {
              dashboardTab: 'packageApprover',
              status: `CustomerRejected,CustomerRejectedNoAction`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'acceptance-packages',
            queryParams: { acceptancePackagesTab: 'InProgress' },
          },
        },
      },
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Approved packages',
          icon: 'icon-success color-green',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'packages',
            queryParams: {
              dashboardTab: 'packageApprover',
              status: `CustomerApproved,DeemedApproved,AcceptanceDocumentInitiate,AcceptanceDocumentReady,AcceptanceDocumentSent,AcceptanceDocumentSentFailed`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'acceptance-packages',
            queryParams: { acceptancePackagesTab: 'Completed' },
          },
        },
      },
    ],
    packageObserver: [
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Pending packages - SLA not over yet',
          icon: 'icon-warning-circle color-orange',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'packages',
            queryParams: {
              dashboardTab: 'packageObserver',
              status: `CustomerNewPendingApproval,CustomerReworkedPendingApproval,NoSlaOverdue`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'acceptance-packages',
            queryParams: { acceptancePackagesTab: 'InProgress' },
          },
        },
      },
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Pending packages - SLA overdue',
          icon: 'icon-severity-indeterminate color-gray',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'packages',
            queryParams: {
              dashboardTab: 'packageObserver',
              status: `CustomerNewPendingApproval,CustomerReworkedPendingApproval,SlaOverdue`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'acceptance-packages',
            queryParams: { acceptancePackagesTab: 'InProgress' },
          },
        },
      },
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Rejected packages',
          icon: 'icon-failed color-red',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'packages',
            queryParams: {
              dashboardTab: 'packageObserver',
              status: `CustomerRejected,CustomerRejectedNoAction`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'acceptance-packages',
            queryParams: { acceptancePackagesTab: 'InProgress' },
          },
        },
      },
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Approved packages',
          icon: 'icon-success color-green',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'packages',
            queryParams: {
              dashboardTab: 'packageObserver',
              status: `CustomerApproved,DeemedApproved,AcceptanceDocumentInitiate,AcceptanceDocumentReady,AcceptanceDocumentSent,AcceptanceDocumentSentFailed`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'acceptance-packages',
            queryParams: { acceptancePackagesTab: 'Completed' },
          },
        },
      },
    ],
    certificateSignatory: [
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Pending certificates',
          icon: 'icon-warning-circle color-orange',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'certificates',
            queryParams: {
              dashboardTab: 'certificateSignatory',
              status: `Ready`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'certificates',
            queryParams: { acceptancePackagesTab: 'Assigned' },
          },
        },
      },
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Rejected certificates',
          icon: 'icon-failed color-red',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'certificates',
            queryParams: {
              dashboardTab: 'certificateSignatory',
              status: `Rejected`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'certificates',
            queryParams: { acceptancePackagesTab: 'Assigned' },
          },
        },
      },
      {
        component: MetricCardComponent,
        inputs: {
          label: 'Signed certificates',
          icon: 'icon-success color-green',
          value: signal<number>(undefined),
          urlConfig: {
            path: 'certificates',
            queryParams: {
              dashboardTab: 'certificateSignatory',
              status: `Complete`,
            },
            queryParamsHandling: 'merge',
          },
          externalUrlConfig: {
            path: 'certificates',
            queryParams: { acceptancePackagesTab: 'Assigned' },
          },
        },
      },
    ]
  }
  protected readonly TabIdentifier = TabIdentifier;

  loadingProject = signal(true);
  projectObservable: Observable<OptionWithValue[]>;
  selectedProject = signal('');
  protected certificatesCount: Observable<CertificatesCount>;
  protected approverPackagesCount: Observable<PackagesCount>;
  protected observerPackagesCount: Observable<PackagesCount>;
  protected readonly myRoles = signal<(string | RoleType)[]>(undefined);
  protected readonly RoleType = RoleType;
  protected readonly hintText = 'This is not an overall project dashboard; it is a dashboard specific to the user. Metrics reflect the status that are applicable to the user and corresponding approval level.';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private dashboardService: DashboardService,
    private sessionStorage: SessionStorageService,
  ) {
    effect(() => {
      this.targetTab = this.route.snapshot.queryParamMap.get(this.tabQueryParameterKey) || this.tabConfigs[0].tab;
      if (!this.tabGroup) {
        const tabsDom = this.tabsElementRef().nativeElement;
        if (tabsDom) {
          this.tabGroup = new TabGroup(tabsDom);
          this.tabGroup.init();
        }
      }
      this.openTab(this.targetTab);
    });

    effect(() => {
      const selectedProject = this.selectedProject();
      if (selectedProject) {
        if (route.snapshot.paramMap.get('id') !== selectedProject) {
          const getTabConfig = (): { urlConfig: UrlConfig, tab: keyof typeof TabIdentifier } => {
            const myRoles = this.sessionStorage.get<UserSession>(CacheKey.userSession).roleType;
            if (myRoles?.includes(RoleType.CustomerApprover))
              return { urlConfig: this.tabContents.packageApprover[0].inputs?.urlConfig, tab: 'packageApprover' };
            else if (myRoles?.includes(RoleType.CustomerObserver))
              return { urlConfig: this.tabContents.packageObserver[0].inputs?.urlConfig, tab: 'packageObserver' };
            else
              return { urlConfig: this.tabContents.certificateSignatory[0].inputs?.urlConfig, tab: 'certificateSignatory' };
          }
          const { urlConfig, tab } = getTabConfig();
          const { queryParams, queryParamsHandling } = urlConfig;
          this.openTab(tab);
          this.router.navigate(['dashboard', selectedProject, 'packages'], { queryParams, queryParamsHandling, });
        }
        this.approverPackagesCount = this.dashboardService.getPackagesCount(selectedProject, 'CustomerApprover').pipe(
          tap(count => {
            const tabContent = this.tabContents.packageApprover;
            tabContent[0].inputs.value.set(count.pendingNoSLAOverdue);
            tabContent[1].inputs.value.set(count.pendingSLAOverdue);
            tabContent[2].inputs.value.set(count.rejected);
            tabContent[3].inputs.value.set(count.approved);
          }),
        );
        this.observerPackagesCount = this.dashboardService.getPackagesCount(selectedProject, 'CustomerObserver').pipe(
          tap(count => {
            const tabContent = this.tabContents.packageObserver;
            tabContent[0].inputs.value.set(count.pendingNoSLAOverdue);
            tabContent[1].inputs.value.set(count.pendingSLAOverdue);
            tabContent[2].inputs.value.set(count.rejected);
            tabContent[3].inputs.value.set(count.approved);
          }),
        );
        this.certificatesCount = this.dashboardService.getCertificatesCount(selectedProject).pipe(
          tap(certificatesCount => {
            const tabContent = this.tabContents.certificateSignatory;
            tabContent[0].inputs.value.set(certificatesCount.pending);
            tabContent[1].inputs.value.set(certificatesCount.rejected);
            tabContent[2].inputs.value.set(certificatesCount.signed);
          }),
        );
      }
    })
  }

  ngOnInit(): void {
    const myRoles = this.sessionStorage.get<UserSession>(CacheKey.userSession).roleType;
    this.myRoles.set(myRoles);

    const filterSort = { lastModifiedDate: { columnName: '', searchText: '', sortingIndex: 0, sortingOrder: 'desc' } } as FilterSortConfiguration;
    this.projectObservable = this.projectsService.getAllProjectsShort(filterSort).pipe(
      map(res => res.map(project => {
        return {
          optionValue: project.projectId,
          option: project.projectName
        };
      })),
      tap(res => {
        const activeProjectedId = this.route.snapshot.paramMap.get('id')
        const first = activeProjectedId ? res.find(option => option.optionValue === activeProjectedId) : res.find(() => true);
        if (first) {
          this.selectedProject.set(first.optionValue);
        }
        this.loadingProject.set(false);
      }),
      catchError(() => {
        this.loadingProject.set(false);
        return of(undefined);
      })
    );
  }

  ngOnDestroy(): void {
    this.tabGroup?.destroy();
  }

  onSelectProject(selectedProject: string): void {
    this.selectedProject.set(selectedProject);
  }

  openTab(tab: string): void {
    if (tab === this.targetTab) {
      return;
    }

    this.targetTab = tab;
    const { path, queryParams } = this.tabContents[tab].at(0).inputs.urlConfig;
    this.router.navigate([path], { queryParams, relativeTo: this.route });
  }
}
