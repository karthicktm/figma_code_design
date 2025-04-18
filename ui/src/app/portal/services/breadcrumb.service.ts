import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Data as BreadcrumbEDS } from '@eds/vanilla/breadcrumb/Breadcrumb';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ProjectsService } from 'src/app/projects/projects.service';
import { ProjectStructure, ChecklistDetail, CertificateRequestDetails, WorkItemInfo } from 'src/app/projects/projects.interface';
import { FilterSortAttr, NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { CacheKey, SessionStorageService } from './session-storage.service';
import { GroupManagementService } from '../../group-management/group-management.service';
import { GroupUsers } from '../../group-management/group-management-interfaces';

interface BreadcrumbData extends BreadcrumbEDS {
  key: string;
  id: string;
  fromCache: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {

  constructor(
    private router: Router,
    private projectService: ProjectsService,
    private networkRollOutService: NetworkRollOutService,
    private sessionStorageService: SessionStorageService,
    private groupManagementService: GroupManagementService,
  ) { }


  generateBreadcrumb(route: ActivatedRouteSnapshot): Observable<BreadcrumbData[]> {
    // generate breadcrumb data
    const breadcrumbData = this.generateBreadcrumbData(route);

    // replace the machine ids with human readable names
    const observablesToReplace = this.observablesToReplaceIdsWithNames(breadcrumbData);
    // return fallback breadcrumb data if no observables to replace
    if (observablesToReplace.length === 0) {
      return of(breadcrumbData);
    }
    return combineLatest(observablesToReplace)
      .pipe(
        map(values => {
          return values?.filter(value => value?.value != null);
        }), // filter out null values
        tap(replacePairs => {
          // replace ids with names
          breadcrumbData.forEach((part, index) => {
            const replacePair = replacePairs.find(pair => pair.key === part.key);
            if (replacePair) {
              breadcrumbData[index].title = replacePair.value;
            }
          });

        }),
        map(() => breadcrumbData),
        catchError(() => of(breadcrumbData)),
      );
  }

  /**
   * Generates the breadcrumb route url
   * @param route
   * @returns
   */
  private generateBreadcrumbRoute(route: ActivatedRouteSnapshot): string {
    let snap = route;
    let breadcrumbRoute = `/${snap.url.join('/')}`;
    while (snap.parent) {
      snap = snap.parent;
      if (snap.url.join('/') !== '') {
        breadcrumbRoute = `/${snap.url.join('/')}${breadcrumbRoute}`;
      }
    }
    return breadcrumbRoute;
  }

  /**
   * Generates the breadcrumb data
   * @param route
   * @returns
   */
  private generateBreadcrumbData(route: ActivatedRouteSnapshot): BreadcrumbData[] {
    const breadCrumbDataArray: BreadcrumbData[] = [];
    let activatedRoute = route;
    while (activatedRoute.parent.url[0]) {
      const breadcrumbPart = this.createBreadcrumbPart(activatedRoute);
      if (breadcrumbPart.title) {
        breadCrumbDataArray.push(breadcrumbPart);
      }
      if (activatedRoute.parent.url[0]) {
        activatedRoute = activatedRoute.parent;
      }
    }
    // add last part
    const lastBreadcrumbPart = this.createBreadcrumbPart(activatedRoute);
    if (lastBreadcrumbPart.title) {
      breadCrumbDataArray.push(lastBreadcrumbPart);
    }
    breadCrumbDataArray.reverse();

    // check if cached breadcrumb parts are available and replace them
    const cachedBreadcrumbParts: string[] = this.sessionStorageService.get(CacheKey.breadcrumb) || [];
    return breadCrumbDataArray.map(part => {
      if (part.key && part.id) {
        const cachedTitle = cachedBreadcrumbParts[(`${part.key}-${part.id}`)];
        if (cachedTitle) {
          return {
            ...part,
            title: cachedTitle,
            fromCache: true // unset to prevent replacing from api call
          }
        }
      }
      return part;
    })
  };

  /**
   * Generates the breadcrumb part with extra id and key for replacing
   * @param route
   * @returns
   */
  private createBreadcrumbPart(route: ActivatedRouteSnapshot): BreadcrumbData {
    const actionUrl = this.generateBreadcrumbRoute(route);
    const title = route.data.title || route.url.toLocaleString();
    let key = '';
    let id = '';

    if (route.data.breadcrumbReplace && route.parent.data.breadcrumbReplace !== route.data.breadcrumbReplace) {
      key = route.data.breadcrumbReplace;
      switch (route.data.breadcrumbReplace) {
        case 'projectId':
        case 'packageId':
        case 'checklistId':
          id = route.params.id;
          break;
        case 'networkSiteId':
        case 'certificateRequestId':
        case 'milestoneId':
        case 'workplanId':
          id = route.params[key];
          break;
        default:
          key = ''; // reset key because it is not supported
          break;
      }
    } else if (route.parent && route.parent.routeConfig
      && route.parent.routeConfig.path === 'group-management'
      && route.params && route.params.id) {
      id = route.params.id;
      key = 'userGroupId';
    }
    return {
      title,
      id,
      key,
      fromCache: false,
      action: () => this.router.navigateByUrl(actionUrl)
    };
  }


  /**
   * Creates observables to replace ids with names
   * @param breadcrumbData
   * @returns
   */
  private observablesToReplaceIdsWithNames(breadcrumbData: BreadcrumbData[]): Observable<{ key: string, value: string } | null>[] {
    const keysToResolve = breadcrumbData.filter(data => data.key && (data.title === data.id || !data.fromCache));
    const cachedBreadcrumbParts = this.sessionStorageService.get(CacheKey.breadcrumb) || {};
    const projectId = breadcrumbData.find(data => data.key === 'projectId')?.id;
    return keysToResolve.map(part => {
      const checklistId = keysToResolve.find(key => key.key === 'checklistId')?.id;
      const cacheKey = `${part.key}-${part.id}`;
      switch (part.key) {
        case 'projectId':
          if (!projectId) return;
          return this.projectService.getProjectDetails(part.id).pipe(
            map((project) => ({
              key: part.key,
              value: project.projectName
            })
            ),
            tap((project) => {
              cachedBreadcrumbParts[cacheKey] = project.value;
              this.sessionStorageService.save(CacheKey.breadcrumb, cachedBreadcrumbParts);
            })
          );
        case 'packageId':
          if (!projectId) return;
          return this.projectService.getAcceptancePackage(part.id).pipe(
            map((pkg) => ({
              key: part.key,
              value: pkg.name
            })
            ),
            tap((pkg) => {
              cachedBreadcrumbParts[cacheKey] = pkg.value;
              this.sessionStorageService.save(CacheKey.breadcrumb, cachedBreadcrumbParts);
            })
          );
        case 'networkSiteId':
          if (!projectId) return;
          const filterAttr: FilterSortAttr[] = [
            { key: 'internalId', value: part.id },
          ];
          return this.networkRollOutService.getProjectStructureShort(1, 0, projectId, filterAttr).pipe(
            map(projectStructure => projectStructure.results.find(site => {
              return site.networkSiteId === part.id || site.internalId === part.id;
            })),
            map((projectStructure: ProjectStructure) => ({
              key: part.key,
              value: projectStructure?.networkSiteName
            })
            ),
            tap((projectStructure) => {
              cachedBreadcrumbParts[cacheKey] = projectStructure.value;
              this.sessionStorageService.save(CacheKey.breadcrumb, cachedBreadcrumbParts);
            })
          );
        case 'checklistId':
          if (!projectId) return;
          return this.networkRollOutService.getChecklistDetailsByLinearId(projectId, checklistId).pipe(
            map((checklistDetail: ChecklistDetail) => ({
              key: part.key,
              value: checklistDetail.name
            })
            ),
            tap((checklistDetail) => {
              cachedBreadcrumbParts[cacheKey] = checklistDetail.value;
              this.sessionStorageService.save(CacheKey.breadcrumb, cachedBreadcrumbParts);
            })
          );
        case 'milestoneId':
        case 'workplanId':
          if (!projectId) return;
          const workItemId = keysToResolve.find(key => key.key === part.key)?.id;
          return this.networkRollOutService.getWorkItemDetailsByLinearId(projectId, workItemId).pipe(
            map((workItemInfo: WorkItemInfo) => ({
              key: part.key,
              value: workItemInfo.name,
            })),
            tap((breadcrumb) => {
              cachedBreadcrumbParts[cacheKey] = breadcrumb.value;
              this.sessionStorageService.save(CacheKey.breadcrumb, cachedBreadcrumbParts);
            }),
          )
        case 'userGroupId':
          if (!part.id) return;
          return this.groupManagementService.getGroupUserList(part.id).pipe(
            map((groupUsers: GroupUsers) => ({
              key: part.key,
              value: groupUsers.groupName
            })
            ),
            tap((groupUsers) => {
              cachedBreadcrumbParts[cacheKey] = groupUsers.value;
              this.sessionStorageService.save(CacheKey.breadcrumb, cachedBreadcrumbParts);
            })
          );
        case 'certificateRequestId':
          if (!projectId) return;
          return this.projectService.getCertificateRequest(projectId, part.id).pipe(
            map((certificateRequestDetails: CertificateRequestDetails) => ({
              key: part.key,
              value: certificateRequestDetails.requestName
            })
            ),
            tap((certificateRequestDetails) => {
              cachedBreadcrumbParts[cacheKey] = certificateRequestDetails.value;
              this.sessionStorageService.save(CacheKey.breadcrumb, cachedBreadcrumbParts);
            })
          );
        default:
          return of(null)
      }
    });
  }
}
