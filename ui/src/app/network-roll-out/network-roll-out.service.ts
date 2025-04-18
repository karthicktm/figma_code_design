import { HttpClient, HttpErrorResponse, HttpEvent, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, from, of, throwError } from 'rxjs';
import { catchError, expand, map, reduce, switchMap, takeWhile } from 'rxjs/operators';
import {
  ChecklistDetail,
  ChecklistLineItemsShortResponse,
  ComposeAcceptancePackageRequest,
  CountriesWithCustomer,
  EmailNotificationRequest,
  Evidence,
  EvidenceDataWithSasUrl,
  EvidenceNRORequest,
  EvidenceParentType,
  EvidenceRequest,
  ExternalActivity,
  ExternalProjectInfo,
  ExternalSiteInfo,
  GetEvidenceResponse,
  GetMilestoneEvidencesResponse, LineItemInfo,
  LineItemStatusUpdate,
  MilestoneResponse,
  Project,
  ProjectDetails,
  ProjectStructureResponse, ProjectStructureShortResponse, RelatedEvidence, RelatedEvidences, ReworkAcceptancePackageRequest, SiteStructure,
  SiteTaxonomy,
  WorkItemInfo
} from '../projects/projects.interface';
import { EvidenceTypeMediaTypeMappingDefinition } from '../projects/projects.service';
import { fileTypeMime } from '../shared/file-utilities';
import { FilterSortConfiguration } from '../shared/table-server-side-pagination/table-server-side-pagination.component';

export interface FilterSortAttr {
  key: string;
  value: string;
}

export interface AttachedEvidence {
  internalId: string;
  name: string;
  parentEvidenceId: string;
  parentEvidenceName: string;
  tag: string;
  isAcceptanceRequired: boolean;
  createdDate: string;
}

const nroUrl = '';

/**
 * Use this service for operations outside of acceptance package context.
 */
@Injectable({
  providedIn: 'root',
})
export class NetworkRollOutService {
  evidenceTypeMediaTypeMappingDefinition = new EvidenceTypeMediaTypeMappingDefinition();

  constructor(private readonly httpService: HttpClient) { }

  /**
   * Get site details by project id and site id.
   * @param projectId the site belongs to
   * @param siteId of the site
   */
  public getSiteDetailsBySiteId(projectId: string, siteId: string): Observable<SiteStructure> {
    const url = `${nroUrl}/projects/${projectId}/networkelements/${siteId}/info`;
    return this.httpService.get<SiteStructure>(url);
  }

  /**
   * Gets the details for the given linear id of a checklist.
   * @param projectId linear id of the project
   * @param checklistLinearId linear id of the checklist
   */
  public getChecklistDetailsByLinearId(projectId: string, checklistLinearId: string): Observable<ChecklistDetail> {
    const url = `${nroUrl}/projects/${projectId}/checklists/${checklistLinearId}`;
    return this.httpService.get<ChecklistDetail>(url);
  }

  /**
   *
   * @param projectId : Path variable parameter
   * @param checklistId : Path variable prameter
   * @param limit : For pagination
   * @param offset : for pagination
   * @param filter : For search and sorting
   * @returns : List of Line Items
   */
  public searchChecklistLineItems(
    projectId: string,
    checklistId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,): Observable<ChecklistLineItemsShortResponse> {
    const url = `/projects/${projectId}/checklists/${checklistId}/short`;
    const filterBody = {} as any;
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);

    if (filter) {
      Object.keys(filter).forEach(key => {
        if (filter[key].sortingOrder !== '') {
          params = params.set('sort', `${filter[key].sortingOrder}(${filter[key].columnName})`);
        }

        if (!filter[key].searchText || filter[key].searchText.trim() === '') {
          return;
        }

        if (key.toLowerCase().includes('date')) {
          const dateString = new Date(filter[key].searchText).toISOString().slice(0, 10);
          filterBody[key] = dateString;
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          filterBody.timeZone = timeZone;
        }
        else if (key.toLowerCase() === 'status') {
          filterBody[key] = filter[key].searchText?.replace(/\s/g, '');
        }
        else {
          filterBody[key] = filter[key].searchText;
        }
      });
    }

    return this.httpService.post<ChecklistLineItemsShortResponse>(url, filterBody, { params });
  }

  /**
   *
   * @param siteId : Path variable parameter
   * @param limit : For pagination
   * @param offset : for pagination
   * @param filter : For search and sorting
   * @returns : List of Line Items
   */
  public searchAllLineItems(
    siteId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,): Observable<ChecklistLineItemsShortResponse> {
    const url = `/networkelements/${siteId}/alllineitems`;
    const params: HttpParams = this.generateParamsByFilter(limit, offset, filter);

    return this.httpService.get<ChecklistLineItemsShortResponse>(url, { params });
  }

  /**
   *
   * @param workplanId : Path variable parameter
   * @param limit : For pagination
   * @param offset : for pagination
   * @param filter : For search and sorting
   * @returns : List of Line Items
   */
  public searchAllLineItemsForWorkplan(
    workplanId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,): Observable<ChecklistLineItemsShortResponse> {
    const url = `/workitems/${workplanId}/alllineitems`;
    const params: HttpParams = this.generateParamsByFilter(limit, offset, filter);

    return this.httpService.get<ChecklistLineItemsShortResponse>(url, { params });
  }

  /**
   * Gets list of projects for the user with the selected filter.
   * @param status status associated with selected tab
   */
  public getListOfProjectForRollOut(status?: string): Observable<Project[]> {
    const url = `${nroUrl}/projects?status=${status}`;
    return this.httpService.get<Project[]>(url);
  }

  /**
   * Gets project details by project name.
   * @param projectName  name of the project for which the detail has to be fetched
   */
  public getProjectDetails(projectName: string): Observable<ProjectDetails> {
    const url = `${nroUrl}/projects/?name=${projectName}`;
    return this.httpService.get<ProjectDetails>(url);
  }

  /**
   * Get the Project Structure data
   */
  public getProjectStructure(
    limit: number,
    offset: number,
    projectId: string,
    filter?: FilterSortAttr[]
  ): Observable<ProjectStructureResponse> {
    const url = `${nroUrl}/projects/${projectId}/networkelements`;
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    if (filter && filter.length > 0) {
      filter
        .filter(attr => attr.key !== undefined && attr.value !== undefined && attr.value.length > 0)
        .forEach(attr => (params = params.set(attr.key, attr.value)));
    }
    return this.httpService.get<ProjectStructureResponse>(url, { params });
  }

  /**
   * Get the Project Structure data in short form
   */
  public getProjectStructureShort(
    limit: number,
    offset: number,
    projectId: string,
    filter?: FilterSortAttr[]
  ): Observable<ProjectStructureShortResponse> {
    const url = `${nroUrl}/projects/${projectId}/networkelements/short`;
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    if (filter && filter.length > 0) {
      filter
        .filter(attr => attr.key !== undefined && attr.value !== undefined && attr.value.length > 0)
        .forEach(attr => (params = params.set(attr.key, attr.value)));
    }
    return this.httpService.get<ProjectStructureShortResponse>(url, { params });
  }

  /**
   * Get the extended attributes as headers of the Project Structure
   */
  public getProjectStructureHeader(projectId: string): Observable<Object> {
    const url = `${nroUrl}/projects/${projectId}/networkelements/headerdata`;
    return this.httpService.get<Object>(url);
  }

  /**
   * Get the Project Structure data by given IDs
   */
  public getProjectStructureByIds(
    siteIds: string[],
    limit: number,
    offset: number,
    filter?: FilterSortAttr[],
  ): Observable<ProjectStructureShortResponse> {
    const url = `${nroUrl}/networkelements`;
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    if (filter && filter.length > 0) {
      filter
        .filter(attr => attr.key !== undefined && attr.value !== undefined && attr.value.length > 0)
        .forEach(attr => (params = params.set(attr.key, attr.value)));
    }
    const requestBody = { siteIds };
    return this.httpService.post<ProjectStructureShortResponse>(url, requestBody, { params });
  }

  /**
   * Fetch the email notification configuration for a project.
   * @param projectId id of the selected project
   */
  public fetchEmailNotificationConfiguration(projectId: string): Observable<EmailNotificationRequest[]> {
    const url = `${nroUrl}/emailNotification/${projectId}`;
    return this.httpService.get<EmailNotificationRequest[]>(url);
  }

  /**
   * Save the email notification configuration for a project.
   * @param notifications Array of Email Notification objects
   */
  public saveEmailNotificationConfiguration(notifications: EmailNotificationRequest[]): Observable<any> {
    const url = `${nroUrl}/emailNotification`;
    return this.httpService.post(url, notifications);
  }

  /**
   * Get the site hierarchy
   * @param projectId the site belongs to
   * @param siteId of the site
   */
  public getSiteTaxonomy(projectId: string, siteId: string, workItemId?: string): Observable<SiteTaxonomy> {
    const params: HttpParams = workItemId ? new HttpParams().set('workItemId', workItemId) : undefined;
    const url = `${nroUrl}/projects/${projectId}/networkelements/${siteId}/taxonomy`;
    return this.httpService.get<SiteTaxonomy>(url, { params });
  }

  /**
   * Get the hierarchy of multiple sites
   * @param siteIds list of site ids
   */
  public getMultiSiteTaxonomy(siteIds: string[]): Observable<SiteTaxonomy[]> {
    const url = `${nroUrl}/networkelements/taxonomy`;
    const requestBody = { siteIds };
    return this.httpService.post<SiteTaxonomy[]>(url, requestBody);
  }

  /**
   * Get the hierarchy of multiple workplans starting from root sites
   * @param workplanIds list of site ids
   */
  public getMultiWorkplanTaxonomy(workplanIds: string[]): Observable<SiteTaxonomy[]> {
    const url = `${nroUrl}/workitems/taxonomy`;
    const requestBody = { workplanIds };
    return this.httpService.post<SiteTaxonomy[]>(url, requestBody);
  }

  /**
   * Creates a new acceptance package
   * @param projectId id of the project
   * @param packageBody input for the request
   */
  public composeAcceptancePackage(projectId: string, packageBody: ComposeAcceptancePackageRequest): Observable<any> {
    const url = `${nroUrl}/projects/${projectId}/acceptancepackages`;
    return this.httpService.post<any>(url, packageBody);
  }

  /**
   * updates existing acceptance package
   * @param projectId id of the project
   * @param packageId id of the package
   * @param packageBody input for the request
   */
  public updateAcceptancePackage(projectId: string, packageId: string, packageBody: ComposeAcceptancePackageRequest): Observable<any> {
    const url = `${nroUrl}/projects/${projectId}/acceptancepackages/${packageId}`;
    const params: HttpParams = new HttpParams().set('triggeredByUser', true);
    return this.httpService.put<any>(url, packageBody, { params });
  }

  /**
   * Updates existing acceptance package for rework
   * @param projectId id of the project containing the package
   * @param packageId id of the package
   * @param packageBody input for the request
   */
  public updateReworkAcceptancePackage(projectId: string, packageId: string, packageBody: ReworkAcceptancePackageRequest): Observable<any> {
    const url = `${nroUrl}/projects/${projectId}/acceptancepackages/${packageId}/rework`;
    return this.httpService.put<any>(url, packageBody);
  }
  /**
   * update project admins
   * @param userId the list of user ids to assign a project
   * @param projectId the id of the project to be assigned
   */
  public updateProjectAdminsNRO(projectId: string, users: string[]): Observable<any> {
    const url = `${nroUrl}/projects/${projectId}/users`;
    const requestBody = {
      roleType: 'Project Admin',
      users: users,
    };
    return this.httpService.post(url, requestBody, { responseType: 'text' });
  }

  /**
   * Gets the details for the given linear id of a workitem.
   * @param projectId linear id of the project
   * @param workItemLinearId linear id of the workitem
   */
  public getWorkItemDetailsByLinearId(projectId: string, workItemLinearId: string): Observable<WorkItemInfo> {
    const url = `${nroUrl}/projects/${projectId}/workitems/${workItemLinearId}`;
    return this.httpService.get<WorkItemInfo>(url);
  }

  /**
   * upload evidence in line item
   * @param evidence evidence request
   * @param file file to upload
   * @param projectId id of the project
   * @param linetItemUUID UUID of the line item
   * @returns the details
   */
  public uploadEvidenceFileToLineItem(
    evidence: EvidenceNRORequest,
    file: File,
    projectId: string,
    lineItemUUID: string
  ): Observable<HttpEvent<any>> {
    const url = `${nroUrl}/projects/${projectId}/lineitems/${lineItemUUID}/evidences`;
    const params: HttpParams = new HttpParams().set('ngsw-bypass', true);

    // Workaround if browser can't determine mime type that we want to support
    const mimeObservable = this.setFileMimeTypeGuessFromFileBytes(evidence, file);

    return mimeObservable.pipe(
      switchMap(formData => {
        return this.httpService
          .post(url, formData, {
            params,
            observe: 'events',
            responseType: 'json',
            reportProgress: true,
          })
          .pipe(catchError(this.handleError));
      }),
    )
  }

  public getReportsOfProjectNetworkElement(projectId: string, networkElementId: string, networkRolloutTool: 'SRS' = 'SRS'): Observable<AttachedEvidence[]> {
    const url = `${nroUrl}/projects/${projectId}/networkelements/${networkElementId}/nro/evidences`;
    const params: HttpParams = new HttpParams().set('networkRolloutTool', networkRolloutTool);

    return this.httpService.get<any>(url, { params });
  }

  /**
   * delete evidence by uuid
   * @param evidenceUUID UUID of the evidence
   *
   */
  public deleteEvidenceByUUID(evidenceUUID: string): Observable<any> {
    const url = `${nroUrl}/evidences/${evidenceUUID}`;
    return this.httpService.delete<any>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the evidence file.
   * @param evidenceId linear id of the evidence
   */
  public getEvidenceFile(evidenceId: string): Observable<Blob> {
    const url = `${nroUrl}/evidences/${evidenceId}/file`;
    return this.httpService.get(url, { responseType: 'blob' });
  }

  /**
  * Gets the evidence file with SAS Url.
  * @param evidenceId linear id of the evidence
  */
  public getEvidenceFileSasUrl(evidenceId: string): Observable<EvidenceDataWithSasUrl> {
    const url = `${nroUrl}/evidences/${evidenceId}/sasurl`;
    return this.httpService.get<EvidenceDataWithSasUrl>(url);
  }

  /**
   * Gets the evidence file by progress events.
   * @param evidenceId internal id of the evidence
   */
  public downloadEvidenceFile(evidenceId: string): Observable<HttpEvent<Blob>> {
    const url = `${nroUrl}/evidences/${evidenceId}/file`;
    return this.httpService.get(url, { observe: 'events', reportProgress: true, responseType: 'blob' });
  }

  public getRelatedEvidences(evidenceId: string): Observable<RelatedEvidences> {
    const url = `${nroUrl}/evidences/${evidenceId}/related-evidence`;
    return this.httpService.get<RelatedEvidences>(url);
  }

  /**
   * Gets the customer logo as evidence file.
   * @param evidenceId linear id of the evidence
   */
  public getCustomerLogoFile(evidenceId: string): Observable<HttpResponse<Blob>> {
    const url = `${nroUrl}/evidences/${evidenceId}/file`;
    return this.httpService.get(url, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(`Backend returned code %s,` + ` body was: %o`, error.status, error.error);
    }
    // Return an observable with a user-facing error message.
    return throwError(error);
  }

  /**
   * Gets line item info.
   *
   * @param projectId of the containing project
   * @param lineItemId of the line item
   */
  public getLineItemInfo(projectId: string, lineItemId: string): Observable<LineItemInfo> {
    const url = `${nroUrl}/projects/${projectId}/lineitems/${lineItemId}/info`;
    return this.httpService.get<LineItemInfo>(url);
  }

  /**
  * update line item status as Ready/Draft
  * @param requestBody request body to update line item status
  */
  public updateProjectLineItemStatus(requestBody: LineItemStatusUpdate): Observable<any> {
    const url = `/lineitems/status`;
    return this.httpService.put<any>(url, requestBody)
      .pipe(
        catchError(this.handleError),
      );
  }

  public getMilestoneEvidences(
    projectId: string,
    milestoneId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,
  ): Observable<GetMilestoneEvidencesResponse> {
    const url = `${nroUrl}/projects/${projectId}/milestones/${milestoneId}/evidences`;
    const params: HttpParams = this.generateParamsByFilter(limit, offset, filter);

    return this.httpService.get<GetMilestoneEvidencesResponse>(url, { params });
  }

  /**
   * Gets milestone evidences based on given milestone IDs
   *
   * @param projectId ID of the project containing the milestone
   * @param milestoneIds list of milestone IDs
   * @param limit number of records per page
   * @param offset starting index of the record
   * @param filter array of filter params
   * @returns list of milestone evidences
   */
  public getMilestoneEvidencesByMilestoneIds(
    projectId: string,
    milestoneIds: string[],
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,
  ): Observable<GetMilestoneEvidencesResponse> {
    if (milestoneIds.length === 0) {
      console.error('Milestone IDs are required.');
      return;
    }
    const url = `${nroUrl}/projects/${projectId}/milestones/evidences`;
    const params: HttpParams = this.generateParamsByFilter(limit, offset, filter);
    const body = { milestoneIds };

    return this.httpService.post<GetMilestoneEvidencesResponse>(url, body, { params });
  }

  /**
   * Gets line item evidences
   *
   * @param projectId of the containing project
   * @param lineItemId of the line item
   * @param limit of evidences to fetch
   * @param offset to start fetching evidences
   */
  public getLineItemEvidences(
    projectId: string,
    lineItemId: string,
    limit: number,
    offset: number
  ): Observable<GetEvidenceResponse> {
    const url = `${nroUrl}/projects/${projectId}/lineitems/${lineItemId}/evidences`;
    const params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    return this.httpService.get<GetEvidenceResponse>(url, { params });
  }

  public getAllLineItemEvidences(
    projectId: string,
    lineItemId: string,
  ): Observable<Evidence[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getLineItemEvidences(
            projectId,
            lineItemId,
            limit,
            data.nextOffset,
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetEvidenceResponse) => {
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
   * Download line item evidences archive.
   * @param projectId of the project
   * @param lineItemId of the line item
   */
  public downloadLineItemEvidences(
    projectId: string,
    lineItemId: string,
  ): Observable<HttpEvent<Blob>> {
    const url = `${nroUrl}/projects/${projectId}/lineitems/${lineItemId}/evidences/download`;
    return this.httpService.get(url, {
      observe: 'events',
      reportProgress: true,
      responseType: 'blob',
    });
  }

  /**
   * Upload Evidence file along with evidence details as object
   * @param evidence
   * @param file
   * @param id of acceptance project
   * @returns
   */
  public uploadEvidenceFile(evidence: EvidenceRequest, file: File, projectId: string, packageId: string = null): Observable<Evidence> {
    let url = '';
    if (null != packageId) {
      url = `${nroUrl}/acceptancepackages/${packageId}/evidences`;
    } else {
      url = `${nroUrl}/evidences/file`;
    }
    evidence.projectId = projectId;
    evidence.evidenceId = crypto.randomUUID();

    // Workaround if browser can't determine mime type that we want to support
    const mimeObservable = this.setFileMimeTypeGuessFromFileBytes(evidence, file);

    return mimeObservable.pipe(
      switchMap(formData => {
        return this.httpService.post<Evidence>(url, formData);
      }),
    )
  }

  private setFileMimeTypeGuessFromFileBytes(evidence: EvidenceRequest | EvidenceNRORequest, file: File): Observable<FormData> {
    let mimeObservable: Observable<string> = of(undefined);
    if (evidence.fileMIMEType.length === 0) {
      const blob = file.slice(0, 4);
      mimeObservable = from(blob.arrayBuffer().then(buffer => {
        const bytes = new Uint8Array(buffer);
        evidence.fileMIMEType = fileTypeMime(bytes).find(() => true);
        return undefined;
      }))
    }
    return mimeObservable.pipe(
      map(() => {
        return this.generateEvidenceFileUploadFormData(evidence, file);
      })
    );
  }

  private generateEvidenceFileUploadFormData(evidence: EvidenceRequest | EvidenceNRORequest, file: File): FormData {
    // Mapping to identify type according to API specification.
    const evidenceTypeDefinition = this.evidenceTypeMediaTypeMappingDefinition;
    const evidenceType = this.getEvidenceType(evidenceTypeDefinition, evidence.fileMIMEType, file);
    if (evidenceType) {
      evidence.type = evidenceType;
    } else {
      // set default evidence type and MIME type
      evidence.type = 'Document';
      evidence.fileMIMEType = 'application/octet-stream';
    }
    const formData = new FormData();
    formData.append('object', JSON.stringify(evidence));
    formData.append('file', file);
    return formData;
  }

  private getEvidenceType(evidenceTypeDefinition: EvidenceTypeMediaTypeMappingDefinition, mimeType: string, file: File): string {
    const evidenceType = Object.entries(evidenceTypeDefinition.map).find(entry => entry[1].find(type => {
      if (mimeType?.length > 0) return type === mimeType;
      return type === file.name.match(/\.([a-zA-Z0-9]*)$/)?.toString();
    })
    )?.[0];

    return evidenceType
  }

  /**
   * Delete evidence.
   * @param evidenceId Id of the evidence to be deleted
   */
  public deleteEvidence(evidenceId: string): Observable<any> {
    const url = `${nroUrl}/evidences/${evidenceId}`;
    return this.httpService.delete<any>(url);
  }

  /**
   * Patches the evidence `isAcceptanceRequired` property with the given value.
   * @param evidenceId id of the evidence
   * @param isAcceptanceRequired boolean value depending upon selection if acceptance is required
   */
  public updateEvidenceApprovalStatus(evidenceId: string, isAcceptanceRequired: boolean): Observable<Evidence> {
    const url = `${nroUrl}/evidences/${evidenceId}`;
    const body = {
      isAcceptanceRequired,
    };
    return this.httpService.patch<Evidence>(url, body);
  }

  /**
  * Patches the evidence with the given value.
  * @param evidenceId id of the evidence
  * @param body with content to apply
  */
  public patchEvidence(evidenceId: string, body: Partial<Evidence>): Observable<Evidence> {
    const url = `${nroUrl}/evidences/${evidenceId}`;
    return this.httpService.patch<Evidence>(url, body);
  }

  /**
   * Upload Evidence file along with evidence details as object
   * @param evidence details
   * @param file to upload
   */
  public uploadRelatedEvidenceFile(evidence: EvidenceRequest, file: File): Observable<HttpEvent<Evidence>> {
    const url = `${nroUrl}/evidences/file`;
    const params: HttpParams = new HttpParams().set('ngsw-bypass', true);
    // Workaround if browser can't determine mime type that we want to support
    const mimeObservable = this.setFileMimeTypeGuessFromFileBytes(evidence, file);

    return mimeObservable.pipe(
      switchMap(formData => {
        return this.httpService.post<Evidence>(url, formData, {
          params,
          observe: 'events',
          responseType: 'json',
          reportProgress: true,
        });
      }),
    )
  }

  /**
   * Gets the evidence details
   * @param evidenceId to handle
   */
  public getEvidence(evidenceId: string): Observable<Evidence> {
    const url = `${nroUrl}/evidences/${evidenceId}`;
    return this.httpService.get<Evidence>(url);
  }

  /**
   * Gets the related evidences as {@link Array} of {@link RelatedEvidence}.
   * @param evidenceId of the evidence
   */
  public getRelatedEvidenceList(evidenceId: string): Observable<RelatedEvidence[]> {
    return this.getRelatedEvidences(evidenceId).pipe(
      map((relatedEvidences: RelatedEvidences) => {
        return relatedEvidences.evidences;
      })
    )
  }

  /**
   * Gets the evidence thumbnail file.
   * @param evidenceId to handle
   */
  public getEvidenceThumbnail(evidenceId: string): Observable<Blob> {
    const url = `${nroUrl}/evidences/${evidenceId}/file?thumbnail=true`;
    return this.httpService.get(url, { responseType: 'blob' });
  }

  /**
   * Gets the list of countries
   * @returns country list
   */
  public getCountries(): Observable<CountriesWithCustomer[]> {
    const url = `${nroUrl}/networkrollouttool/country-customers?fillCustomers=true`;
    return this.httpService.get<CountriesWithCustomer[]>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the list of projects from external tool to extract reports from, e.g SDE.
   * @param networkRolloutTool name of the network rollout tool
   * @param country country of the customer
   * @param customerName name of the customer
   * @returns project list
   */
  public getExternalProjects(networkRolloutTool: string, country: string, customerName: string): Observable<ExternalProjectInfo[]> {
    const url = `${nroUrl}/networkrollouttool/projects?networkRolloutTool=${networkRolloutTool}&country=${country}&customerName=${customerName}`;
    return this.httpService.get<ExternalProjectInfo[]>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the list of sites of a given project from external tool
   * @param networkRolloutTool name of the network rollout tool
   * @param projectId id of the associated project
   * @returns site list
   */
  public getExternalSites(networkRolloutTool: string, projectId: string): Observable<ExternalSiteInfo[]> {
    const url = `${nroUrl}/networkrollouttool/projects/${projectId}/sites?networkRolloutTool=${networkRolloutTool}`;
    return this.httpService.get<ExternalSiteInfo[]>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the list of activities of a given project and a given site from external tool
   * @param networkRolloutTool name of the network rollout tool
   * @param projectId id of the associated project
   * @param siteName name of the associated site
   * @returns activity list
   */
  public getExternalActivities(networkRolloutTool: string, projectId: string, siteName: string): Observable<ExternalActivity[]> {
    const url = `${nroUrl}/networkrollouttool/projects/${projectId}/sites/${siteName}/activities?networkRolloutTool=${networkRolloutTool}`;
    return this.httpService.get<ExternalActivity[]>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Extracts reports of the activity list from external tool and attaches them as evidences.
   *
   * @param source of the reports
   * @param target to attach the reports
   * @returns success message
   */
  public addExternalProjectReport(
    source: {
      activities: ExternalActivity[],
      networkRolloutTool: string,
      siteId?: string,
      siteName?: string,
    },
    target: {
      parentEvidenceId?: string,
      parentId: string,
      parentType: EvidenceParentType
      projectId: string,
    }
  ): Observable<AttachedEvidence[]> {
    const url = `${nroUrl}/networkrollouttool/projects/reports`;
    const requestBody = {
      ...source,
      ...target,
    };

    return this.httpService.post<AttachedEvidence[]>(url, requestBody)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets milestones of a given project
   *
   * @param projectId ID of the containing project
   * @param limit number of records per page
   * @param offset starting index of the record
   * @param filter array of filter params
   * @returns list of milestones
   */
  public getMilestonesByProjectId(
    projectId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,): Observable<MilestoneResponse> {
    const url = `${nroUrl}/projects/${projectId}/acceptancemilestones`;
    const params: HttpParams = this.generateParamsByFilter(limit, offset, filter);

    return this.httpService.get<MilestoneResponse>(url, { params });
  }

  /**
   * Gets line items of a given milestone
   *
   * @param projectId ID of the project containing the milestone
   * @param milestoneId ID of the containing milestone
   * @param limit number of records per page
   * @param offset starting index of the record
   * @param filter array of filter params
   * @returns list of milestones
   */
  public getMilestoneLineItems(
    projectId: string,
    milestoneId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,): Observable<ChecklistLineItemsShortResponse> {
    const url = `${nroUrl}/projects/${projectId}/milestones/${milestoneId}/lineitems`;
    const params: HttpParams = this.generateParamsByFilter(limit, offset, filter);

    return this.httpService.get<ChecklistLineItemsShortResponse>(url, { params });
  }

  /**
   * Gets milestone line items based on given milestone IDs
   *
   * @param projectId ID of the project containing the milestone
   * @param milestoneIds list of milestone IDs
   * @param limit number of records per page
   * @param offset starting index of the record
   * @param filter array of filter params
   * @returns list of milestones
   */
  public getMilestoneLineItemsByMilestoneIds(
    projectId: string,
    milestoneIds: string[],
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,): Observable<ChecklistLineItemsShortResponse> {
    if (milestoneIds.length === 0) {
      console.error('Milestone IDs are required.');
      return;
    }
    const url = `${nroUrl}/projects/${projectId}/milestones/lineitems`;
    const params: HttpParams = this.generateParamsByFilter(limit, offset, filter);
    const body = { milestoneIds };

    return this.httpService.post<ChecklistLineItemsShortResponse>(url, body, { params });
  }

  private generateParamsByFilter(limit: number, offset: number, filter?: FilterSortConfiguration): HttpParams {
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    if (filter) {
      Object.keys(filter).forEach(key => {
        if (filter[key].sortingOrder !== '') {
          params = params.set('sort', `${filter[key].sortingOrder}(${key})`);
        }

        if (!filter[key].searchText || filter[key].searchText.trim() === '') {
          return;
        }
        if (key.toLowerCase().includes('date')) {
          const dateString = new Date(filter[key].searchText).toISOString().slice(0, 10);
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          params = params.set(key, dateString).set('timeZone', timeZone);
        }
        else if (key.toLowerCase() === 'status') {
          params = params.set(key, filter[key].searchText?.replace(/\s/g, ''));
        }
        else {
          params = params.set(key, filter[key].searchText);
        }
      });
    }

    return params;
  }
}
