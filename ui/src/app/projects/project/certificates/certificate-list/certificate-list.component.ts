import { Location } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CertificateTableComponent } from '../certificate-table/certificate-table.component';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CertificatesRequestQueryType, UserSession } from 'src/app/projects/projects.interface';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { TabGroup } from '@eds/vanilla';
import { AuthorizationService, ToolPermission } from 'src/app/auth/authorization.service';


enum TabIdentifier {
  all = 'All',
  requested = 'Requested',
  assigned = 'Assigned',
}

@Component({
  selector: 'app-certificate-list',
  standalone: true,
  templateUrl: './certificate-list.component.html',
  styleUrl: './certificate-list.component.less',
  imports: [
    CommonModule,
    CertificateTableComponent,
  ]
})
export class CertificateListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tabs') private readonly tabsElementRef: ElementRef<HTMLElement>;

  private scripts: Scripts[] = [];

  projectId: Observable<string>;
  targetTab: string;

  tabConfigs: { name: string, id: TabIdentifier }[] = [
    { name: 'All requests', id: TabIdentifier.all },
    { name: 'Requested by me', id: TabIdentifier.requested },
    { name: 'Assigned as signatory', id: TabIdentifier.assigned },
  ];

  TabIdentifier = TabIdentifier;
  ToolPermission = ToolPermission;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sessionStorageService: SessionStorageService,
    private location: Location,
    private authorizationService: AuthorizationService,
  ) { }

  ngOnInit(): void {
    this.projectId = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id')),
    );

    const userSession = this.sessionStorageService.get<UserSession>(CacheKey.userSession);
    if (userSession && !userSession.roleType.includes(RoleType.EricssonContributor)) {
      this.tabConfigs = this.tabConfigs.filter(tab => tab.id !== 'Requested');
    }
    if (userSession && !userSession.roleType.includes(RoleType.ProjectAdmin)) {
      this.tabConfigs = this.tabConfigs.filter(tab => tab.id !== 'All');
    }

    let targetStatus = this.route.snapshot.queryParamMap.get('certificateRequestListTab');
    if (!targetStatus) {
      targetStatus = this.tabConfigs[0].id;
    }
    this.openTab(targetStatus);
  }

  ngAfterViewInit(): void {
    const tabsDom = this.tabsElementRef.nativeElement;
    if (tabsDom) {
      const tabGroup = new TabGroup(tabsDom);
      tabGroup.init();
      this.scripts.push(tabGroup);
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach(script => {
      script.destroy();
    });
  }

  openTab(status: string): void {
    // If the same tab is clicked, no need to refresh the table
    if (status === this.targetTab) {
      return;
    }

    this.targetTab = status;

    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: { certificateRequestListTab: status },
    });
    this.location.replaceState(urlTree.toString());
  }

  onRequest(): void {
    this.router.navigate([`./new`], { relativeTo: this.route });
  }

  getQueryTypeFor(tabId: TabIdentifier): CertificatesRequestQueryType | undefined {
    if (tabId === TabIdentifier.assigned) return CertificatesRequestQueryType.assignedToMe;
    if (tabId === TabIdentifier.requested) return CertificatesRequestQueryType.requestedByMe;
    return undefined;
  }

  protected isUserAuthorized(permission: ToolPermission): Observable<boolean> {
    return this.authorizationService.isUserAuthorized(permission);
  }
}
