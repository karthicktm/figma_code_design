import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy, signal } from '@angular/core';
import { EMPTY, Observable, Subscription, catchError, expand, map, of, reduce, takeWhile, tap, throwError } from 'rxjs';
import { AcceptancePackageRule, GetAcceptancePackageRulesResponse, GetProjectsResponse, GetWorkflowsResponse, ImportProjectsRequest, Project, Workflow } from '../projects/projects.interface';
import { OPSUser, OPSuserResponse } from '../user-management/user-management.interface';
import { RoleType } from '../group-management/group-management-interfaces';
import { UsersEndpoint } from '../endpoint.interface';

export interface FilterSortAttr {
  key: string;
  value: string;
}

export interface AssignProjectUsersAndGroups {
  usersAndGroups: {
    userIds: string[];
    roleType: RoleType;
  }[];
  groupIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectOnboardingService implements OnDestroy {
  readonly importedProjects = signal<Project[]>([]);
  readonly subscriptions = new Subscription();

  constructor(
    private httpService: HttpClient,
  ) {
  }

  ngOnDestroy(): void {
    this.subscriptions?.unsubscribe();
  }

  /**
   * Gets the list of imported projects.
   */
  public getProjects(limit: number, offset: number): Observable<GetProjectsResponse> {
    const url = '/sitetracker/projects';
    const params: HttpParams = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);
    return this.httpService.get<GetProjectsResponse>(url, { params });
  }

  public searchProjects(limit: number, offset: number, sort?: string,
    searchFilter?: Object): Observable<GetProjectsResponse> {
    const url = '/sitetracker/projects/search';
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);

    if (sort && sort.length > 0) {
      params = params.set('sort', sort.replace('projectName', 'name'));
    }

    if (!searchFilter) {
      searchFilter = {};
    }

    return this.httpService.post<GetProjectsResponse>(url, searchFilter, { params });
  }

  /**
   * Fetch all imported projects.
   */
  public getAllProjects(): Observable<Project[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getProjects(
            limit,
            data.nextOffset,
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => {
        return data.results;
      }),
      reduce((acc, results) => ([...acc, ...results])),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      }),
    );
  }

  /**
   * Fetches all projects and updates the state of `this.importedProjects`.
   */
  fetchAllProjects(): void {
    const fetchAllProjects = this.getAllProjects().pipe(
      tap(projects => {
        this.importedProjects.set(projects);
      })
    );
    this.subscriptions.add(fetchAllProjects.subscribe());
  }

  /**
   * Gets the list of projects by customer id.
   */
  public getProjectsByCustomerId(queryParams: { customerId: string }): Observable<Project[]> {
    const url = '/sitetracker/projects-by-customer';
    const params: HttpParams = new HttpParams()
      .set('customerId', queryParams.customerId);
    return this.httpService.get<Project[]>(url, { params });
  }

  /**
   * Sends import request for project
   */
  public importProject(body: ImportProjectsRequest): Observable<unknown> {
    const url = '/sitetracker/projects/import';
    return this.httpService.post<GetProjectsResponse>(url, body).pipe(
      tap(() => this.fetchAllProjects()),
    );
  }

  getOPSUsers(limit: number, offset: number, filterSort?: { [key: string] : string }, url: string = UsersEndpoint.allUsers): Observable<OPSuserResponse> {
    let params: HttpParams = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);
    if (filterSort) {
      Object.entries(filterSort).forEach(param => {
        const [key, value] = param;
        if (key.toLowerCase().includes('date')) {
          const dateString = new Date(value).toISOString().slice(0, 10);
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          params = params.set(key, dateString).set('timeZone', timeZone);
        }
        else params = params.set(key, value);
      });
    }
    return this.httpService.get<OPSuserResponse>(url, { params });
  }

  public getAllOPSUsers(options: { roleType?: RoleType } = { roleType: RoleType.ProjectAdmin }, url: string = UsersEndpoint.allUsers): Observable<OPSUser[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getOPSUsers(
            limit,
            data.nextOffset,
            { ...options },
            url
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => {
        return data.results;
      }),
      reduce((acc, results) => ([...acc, ...results])),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      }),
    );
  }

  public assignUsers(projectId: string,
    body: AssignProjectUsersAndGroups
  ): Observable<unknown> {
    const url = `/projects/${projectId}/projectassignment`
    return this.httpService.post(url, body);
  }

  /**
   * Gets list of all business rules
   * @param limit number of records per page
   * @param offset starting index of the record
   */
  public getAcceptancePackageRules(limit: number, offset: number): Observable<GetAcceptancePackageRulesResponse> {
    const url = '/acceptancepackagerules';
    const params: HttpParams = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);
    return this.httpService.get<GetAcceptancePackageRulesResponse>(
      url,
      { params }
    );
  }

  public getAllAcceptancePackageRules(): Observable<AcceptancePackageRule[]> {
    return of({
      morePages: true,
      limit: 100,
      nextOffset: 0,
      results: [],
    }).pipe(
      expand(data => {
        if (data.morePages)
          return this.getAcceptancePackageRules(data.limit, data.nextOffset).pipe(
            map(newData => ({ ...newData, limit: data.limit }))
          );
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => data.results),
      reduce((acc, results) => ([...acc, ...results])),
      catchError((err) => {
        console.error(err);
        return of([] as AcceptancePackageRule[]);
      }),
    );
  }

  /**
   * Gets list of all workflows
   * @param limit number of records per page
   * @param offset starting index of the record
   */
  public getWorkflows(limit: number, offset: number): Observable<GetWorkflowsResponse> {
    const url = '/workflows';
    const params: HttpParams = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);
    return this.httpService.get<GetWorkflowsResponse>(
      url,
      { params }
    );
  }

  public getAllWorkflows(): Observable<Workflow[]> {
    return of({
      morePages: true,
      limit: 100,
      nextOffset: 0,
      results: [],
    }).pipe(
      expand(data => {
        if (data.morePages)
          return this.getWorkflows(data.limit, data.nextOffset).pipe(
            map(newData => ({ ...newData, limit: data.limit }))
          );
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => data.results),
      reduce((acc, results) => ([...acc, ...results])),
      catchError((err) => {
        console.error(err);
        return of([] as Workflow[]);
      }),
    );
  }
}
