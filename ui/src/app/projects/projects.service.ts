import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpParams, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, from, of, throwError } from 'rxjs';
import { catchError, expand, map, reduce, switchMap, takeWhile } from 'rxjs/operators';
import { CacheKey, SessionStorageService } from '../portal/services/session-storage.service';
import { FilterSortAttr } from '../project-onboarding/project-onboarding.service';
import { AddUserStatus, NewAddedUser, NewUser, OPSuserResponse } from '../user-management/user-management.interface';
import {
  CertificateTemplate,
  Comment, CommentsEntry, Container, Customer, Evidence, EvidenceDetails, EvidenceHistoryEntry, EvidenceParentType,
  EvidenceRequest, ExtendedAttribute, ExternalActivity,
  GetCertificatesResponse, GetCommentsResponse, GetCountriesResponse, GetEvidenceHistoryResponse,
  GetEvidenceResponse, GetLineItemEvidenceResponse, GetPackageEvidencesSizeResponse, GetPackagesResponse,
  GetProjectUsersAndGroups, GetProjectsShortResponse, GetReportStatusResponse, LineItemResponse,
  PackageDetails, PackageEvidenceFilter, PackageStatus, PackageTaxonomy,
  PageInfo,
  PostCommentsResponse,
  ProjectDetails, ProjectMember,
  ProjectUser, RelatedEvidence, RelatedEvidences,
  PackageConfiguration, SiteStructure, EvidenceStatusUpdate, UsageDashboardResponse, User, UserSession,
  WorkItemInfo,
  LineItemStatusUpdate,
  LineItemStatusUpdateWithScope,
  PackageLineItem,
  PackageValidateResponse,
  ComposeAcceptancePackageUserRequest,
  RecentHistoryResponse,
  GetCertificateTemplateResponse,
  CertificateTemplateRequest,
  WorkplanSiteResponse,
  CertificatePreviewRequestBody,
  CertificatePreviewResponseBody,
  CertificateRequestBody,
  CertificateRequestResponse,
  ProjectShort,
  CertificateRequestDetails,
  GetCertificatesRequestPayload,
  CertificatesRequestQueryType,
  Certificate,
  AcceptancePackageForWorkPlan,
  CertificateActionBody,
  CertificateActionResponse,
  PackageConfigResponse,
  SourceTool,
  CertificateRequestDocument,
  GetMilestoneEvidencesResponse,
  ComposeAcceptancePackageLevelUserRequest,
  CertificateReferenceMergeDocument,
  GetPackageHistoryResponse,
  PackageHistoryEntry,
  LineItemShortResponse,
  PackageLineItemSearchFilter,
  GetPackageDocumentDownloadStatusResponse,
  GetAllEvidencesResponse,
  SubmitAcceptancePackagesRequest,
  LineItemEvidenceSearchRequest,
  GetDashboardPackagesCountResponse,
  GetDashboardEvidencesCountResponse,
  GetDashboardCertificatesCountResponse,
  GetDashboardAcceptanceTrendResponse,
  GetDashboardCertificationTrendResponse,
  EvidenceDataWithSasUrl,
  LineItemInfo, CustomerAcceptanceStatusKey, ProjectSitesResponse,
  ProjectSiteLineItemEvidence,
  ProjectSiteMilestoneEvidence,
  PackageConfigurationShort,
  TransferPackageReportType
} from './projects.interface';
import { fileTypeMime } from '../shared/file-utilities';
import { FilterSortConfiguration } from '../shared/table-server-side-pagination/table-server-side-pagination.component';
import { CertificateDocumentRequest } from './project/certificates/certificate-document-upload-dialog/certificate-document-upload-dialog.component';
import { GroupAssociatedPackage } from '../group-management/group-management-interfaces';

interface MediaType {
  mediaTypesToString(): string;
}

export class EvidenceTypeMediaTypeMappingDefinition implements MediaType {
  map = {
    Image: ['image/gif', 'image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/vnd.microsoft.icon'],
    Video: ['audio/wave', 'audio/wav', 'audio/x-wav', 'audio/x-pn-wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'video/webm', 'video/ogg', 'video/mp4', 'video/mpeg', 'video/x-msvideo', 'video/mp2t', 'video/3gpp', 'video/3gpp2', 'audio/3gpp', 'audio/3gpp2'],
    Document: [
      'text/csv', 'application/csv', 'application/json', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12', 'application/vnd.ms-excel', 'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/msword', 'application/vnd.ms-word.document.macroEnabled.12', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template', 'application/vnd.ms-word.template.macroEnabled.12', 'text/html', 'application/pdf',
      'application/vnd.ms-powerpoint.template.macroEnabled.12', 'application/vnd.ms-powerpoint', 'application/vnd.ms-powerpoint.presentation.macroEnabled.12', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/rtf', 'application/vnd.oasis.opendocument.text'
    ],
    Archive: [
      'application/vnd.rar',
      'application/x-rar-compressed',
      '.rar',
      'application/epub+zip',
      'application/gzip',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-7z-compressed',
    ],
  }
  mediaTypesToString(): string {
    return Object.values(this.map).reduce((previousValue, currentValue) => {
      return previousValue.concat(currentValue);
    }).toString();
  }
}

/** Limit for a single file upload of max 500MiB */
export const uploadByteLimit = 500 * 1024 * 1024;

/** Limit for number of files to upload at once**/
export const uploadMaxNumberFilesAtOnce = 20;

@Injectable()
export class ProjectsService {
  constructor(
    private httpService: HttpClient,
    private sessionStorage: SessionStorageService,
  ) {
  }

  public evidenceTypeMediaTypeMappingDefinition = new EvidenceTypeMediaTypeMappingDefinition();

  /**
   * Format bytes into nice human readable string
   * @param bytes input number in bytes
   * @param decimals number of visible decimals in the result
   * @returns formatted human readable string
   */
  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Gets the list of all users known.
   * @deprecated Use `getOPSUsers` or `getAllOpsUsers` from project onboarding service instead.
   */
  public getAllUsers(): Observable<User[]> {
    const url = `/getAllEnrolledUsers`;
    return this.httpService.get<User[]>(url);
  }

  /**
   * @deprecated Use `getOPSUsers` or `getAllOpsUsers` from project onboarding service instead.
   */
  public getOPSUsers(limit: number, offset: number, filterSort?: string): Observable<OPSuserResponse> {
    let url = `/users?limit=${limit}&offset=${offset}`;
    if (filterSort) {
      url = url.concat(`${filterSort}`);
    }
    return this.httpService.get<OPSuserResponse>(url);
  }

  /**
   * Delete user.
   * @param userId of the user to be deleted
   */
  public deleteUser(userId: string): Observable<any> {
    const url = `/users/${userId.toLowerCase()}`;
    return this.httpService.delete<any>(url);
  }

  /**
   * Delete/Abandon New acceptance packages
   * @param packageId of the new acceptance package to be deleted/abandoned
   */
  public deletePackage(packageId: string): Observable<any> {
    const url = `/acceptancepackages/${packageId}`;
    return this.httpService.delete<any>(url);
  }

  /**
   * Enroll new users
   * @param users to be enrolled
   */
  public enrollUser(users: NewAddedUser): Observable<HttpResponse<NewAddedUser | AddUserStatus[]>> {
    const url = `/users`;
    return this.httpService.post<NewAddedUser | AddUserStatus[]>(url, users, { observe: 'response' })
      .pipe(
        catchError(this.handleError),
      );

  }

  /**
   * Update users
   * @param users to be updated
   */
  public updateUser(editedUser: Partial<NewUser>, userId: string): Observable<NewUser> {
    const url = `/users/${userId}`;
    return this.httpService.patch<NewUser>(url, editedUser);
  }

  /**
   * API endpoint to check if user is a sole member of the package
   * @param users to be updated
   */
  public downloadSoleUserPackagesFile(userId: string): Observable<HttpEvent<Blob>> {
    const url = `/users/${userId}/acceptancepackages/file`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * API endpoint to downlist of APs where user is a sole user
   * @param users to be updated
   */
  public getpackageDetailsForSoleUser(userId: string): Observable<GroupAssociatedPackage[]> {
    const url = `/users/${userId}/acceptancepackages`;
    return this.httpService.get<GroupAssociatedPackage[]>(url);
  }

  /**
   * Gets the list of all users in the project
   * @param linearId of the project
   */
  public getProjectUsers(linearId: string): Observable<ProjectUser[]> {
    const url = `/getProjectUsers/${linearId}`;
    return this.httpService.get<any>(url);
  }

  /**
   * Adds or updates the given user in the desired project.
   * @param projectLinearId to be used
   * @param userProps to be added or updated
   */
  public addProjectUser(
    projectLinearId: string,
    userProps: {
      emailId: string,
      roleName: string,
    }
  ): Observable<any[]> {
    const url = `/addProjectUser`;
    const body = {
      projectLinearId,
      ...userProps,
    };
    return this.httpService.post<any[]>(url, body);
  }

  /**
   * Gets the history of project level comments
   * @param linearId of the project
   */
  public getComments(linearId: string, isInternal: boolean): Observable<Comment[]> {
    const url = isInternal ? '/getHistoryOfInternalComments/' + linearId : '/getHistoryOfExternalComments/' + linearId;
    return this.httpService.get<Comment[]>(url);
  }

  /**
   * Adds a comment to the given project.
   * @param uniqueId to add to the payload, which is the linear id of the project
   * @param comment content of the comment
   */
  public addComment(uniqueId: string, comment: string, level: string, isInternal: boolean): Observable<any> {
    const emailId = this.sessionStorage.get<UserSession>(CacheKey.userSession).emailId;
    const commentPacket = {
      mappedToLinearId: uniqueId,
      comment,
      fromEmailId: emailId,
      isInternal,
      level
    };
    const url = isInternal ? '/submitInternalComment' : '/submitExternalComment';
    return this.httpService.post<any>(url, commentPacket);
  }

  public getListOfProjectShort(limit?: number, offset?: number, filter?: FilterSortConfiguration): Observable<GetProjectsShortResponse> {
    const url = '/projects/short';

    let params: HttpParams = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);

    if (filter) {
      Object.keys(filter).forEach(key => {
        if (filter[key].sortingOrder !== '') {
          params = params.set('sort', `${filter[key].sortingOrder}(${key})`);
        }

        if (!filter[key].searchText || filter[key].searchText.trim() === '') {
          return;
        }
        if (key.toLowerCase().includes('date')) {
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          params = params.set(key, new Date(filter[key].searchText).toISOString().slice(0, 10)).set('timeZone', timeZone);
        } else if (key === 'status') {
          const statusText = filter[key].searchText;
          const paramVal = statusText === 'Completed' ? 'Complete' : (statusText === 'Pending' ?
            'Acceptance Packages Received,Acceptance Package Sent To Customer' : statusText);
          params = params.set(key, paramVal);
        } else {
          params = params.set(key, filter[key].searchText);
        }
      });
    }

    return this.httpService.get<GetProjectsShortResponse>(url, { params });
  }

  public getAllProjectsShort(filter?: FilterSortConfiguration): Observable<ProjectShort[]> {
    return of({
      morePages: true,
      limit: 100,
      nextOffset: 0,
      results: [],
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getListOfProjectShort(data.limit, data.nextOffset, filter).pipe(
            map(newData => ({ ...newData, limit: data.limit }))
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => data.results),
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
   * Upload Evidence file along with evidence details as object
   * @param evidence
   * @param file
   * @param packageId
   * @returns
   */
  public uploadEvidenceFile(evidence: EvidenceRequest, file: File, packageId: string): Observable<HttpEvent<any>> {
    const url = `/acceptancepackages/${packageId}/evidences`;
    const params: HttpParams = new HttpParams().set('ngsw-bypass', true);

    const generateEvidenceFileUploadFormData = (evidence: EvidenceRequest, file: File): FormData => {
      // Mapping to identify type according to API specification.
      const evidenceTypeDefinition = this.evidenceTypeMediaTypeMappingDefinition;
      const evidenceType = Object.entries(evidenceTypeDefinition.map).find(entry => entry[1].find(type => {
        const mimeType = evidence.fileMIMEType;
        if (mimeType?.length > 0) return type === mimeType;
        return type === file.name.match(/\.([a-zA-Z0-9]*)$/)?.toString();
      })
      )?.[0];
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
    // Workaround if browser can't determine mime type that we want to support
    const setFileMimeTypeGuessFromFileBytes = (evidence: EvidenceRequest, file: File): Observable<FormData> => {
      let mimeObservable: Observable<string> = of(undefined);
      if (evidence.fileMIMEType.length === 0) {
        const blob = file.slice(0, 4);
        mimeObservable = from(blob.arrayBuffer().then(buffer => {
          const bytes = new Uint8Array(buffer);
          return evidence.fileMIMEType = fileTypeMime(bytes).find(() => true);
        }));
      }
      return mimeObservable.pipe(
        map(() => {
          return generateEvidenceFileUploadFormData(evidence, file);
        })
      );
    };
    evidence.evidenceId = crypto.randomUUID();
    const mimeObservable = setFileMimeTypeGuessFromFileBytes(evidence, file);

    return mimeObservable.pipe(
      switchMap(formData => {
        return this.httpService.post(url, formData, {
          params,
          observe: 'events',
          responseType: 'json',
          reportProgress: true,
        });
      }),
    )
  }

  /**
   * Sends provided feedback to back-end
   * @param params to be used
   */
  public submitFeedback(params: {
    userId: string,
    message: string
  }): Observable<any> {
    const url = `/feedback`;
    return this.httpService.post(url, params, { responseType: 'text' });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code %s,`
        + ` body was: %o`, error.status, error.error);
    }
    // Return an observable with a user-facing error message.
    return throwError(error);
  }

  /**
   * Gets the list of acceptance packages of a given project.
   * @param projectLinearId linear id of the project
   * @param filter String that needs to be appended in the url for search and sort
   * @param limit number of records per page
   * @param offset starting index of the records
   * @returns packages list
   */
  public getAcceptancePackageList(projectLinearId: string, filter: string, limit: number, offset: number): Observable<GetPackagesResponse> {
    let url = `/projects/${projectLinearId}/acceptancepackages?limit=${limit}&offset=${offset}`;

    if (filter) {
      url = url.concat(`${filter}`);
    }
    return this.httpService.get<GetPackagesResponse>(url);
  }

  /**
   * Gets the package details for the given linear id of the package.
   * @param linearId of the package
   */
  public getAcceptancePackage(linearId: string): Observable<PackageDetails> {
    const url = `/acceptancepackages/${linearId}/details`;
    return this.httpService.get<PackageDetails>(url);
  }

  /**
   * Gets customer details by customer Id
   *
   * @param customerId the id of the customer for which the detail has to be fetched
   */
  public getCustomerByCustomerId(customerId: string): Observable<Customer> {
    const url = `/customers/${customerId}`;
    return this.httpService.get<Customer>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets project details by project id.
   * @param projectId  id of the project for which the detail has to be fetched
   */
  public getProjectDetails(projectId: string): Observable<ProjectDetails> {
    const url = `/projects/${projectId}`;
    return this.httpService.get<ProjectDetails>(url);
  }

  isProjectPackageManagementInternal(sourceTool: SourceTool): boolean {
    const supportedSourceTools = [
      SourceTool.siteTracker,
    ]
    return !sourceTool ? false : supportedSourceTools.includes(sourceTool);
  }

  isProjectPackageSubmissionSupported(sourceTool: SourceTool): boolean {
    const unSupportedSourceTools = [
      SourceTool.dpm,
    ]
    return !sourceTool ? true : !unSupportedSourceTools.includes(sourceTool);
  }

  /**
   * Gets line items by package id.
   * @param packageId  id of the package for which the detail has to be fetched
   */
  public getLineItemsByPackageId(packageId: string, limit: number, offset: number, filterSortColumns?, status?: string): Observable<LineItemResponse> {
    let url: string;
    let sortBy = '';
    url = `/acceptancepackages/${packageId}/lineitems?limit=${limit}&offset=${offset}`;
    if (filterSortColumns) {
      Object.keys(filterSortColumns).forEach(key => {
        if (filterSortColumns[key].sortingOrder != '') {
          sortBy = `${filterSortColumns[key].sortingOrder}(${key})`;
        }
      });

      if (!!sortBy) {
        url = url.concat(`&sort=${sortBy}`);
      }
    }
    if (status) {
      url = url.concat(`&status=${status}`)
    }
    return this.httpService.get<LineItemResponse>(url);
  }

  public getAllLineItemsByPackageId(packageId: string): Observable<PackageLineItem[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getLineItemsByPackageId(
            packageId,
            limit,
            data.nextOffset,
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: PageInfo & { results: PackageLineItem[] }) => {
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
   * Gets the list of evidences directly attached to the package.
   * @param packageId id of the package
   * @param limit number of records per page
   * @param offset starting index of the record
   * @returns observable list of evidences
   */
  public getPackageAdditionalEvidences(packageId: string, limit: number, offset: number, filterSort?: string): Observable<GetEvidenceResponse> {
    let url: string;
    url = `/acceptancepackages/${packageId}/additionalevidences?limit=${limit}&offset=${offset}`;
    if (filterSort) {
      url = url.concat(`${filterSort}`);
    }
    return this.httpService.get<GetEvidenceResponse>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the evidences directly attached to the package by search.
   * @param packageId id of package
   * @param filters array of filter param
   * @returns returns package evidence list
   */
  public getPackageAdditionalEvidencesBySearch(filterPost: PackageEvidenceFilter, packageId: string, limit: number, offset: number, filterSort: string): Observable<GetEvidenceResponse> {
    let url: string;
    url = `/acceptancepackages/${packageId}/additionalevidences/search?limit=${limit}&offset=${offset}`;
    if (filterSort) {
      url = url.concat(`${filterSort}`);
    }
    Object.keys(filterPost).forEach(key => {
      if (key.toLowerCase().includes('date') && filterPost[key] !== undefined) {
        const dateString = new Date(filterPost[key]).toISOString().slice(0, 10);
        filterPost[key] = dateString;
        const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
        filterPost.timeZone = timeZone;
      }
    })
    return this.httpService.post<GetEvidenceResponse>(url, filterPost)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the line item search result.
   * @param packageId id of package
   * @param filters object of filter params
   * @returns returns line item list
   */
  public getLineItemsSearch(filters, limit, offset, packageId: string, filterSortColumns): Observable<LineItemResponse> {
    let url;
    let sortBy = '';
    url = `/acceptancepackages/${packageId}/lineitems/search?limit=${limit}&offset=${offset}`;
    if (filterSortColumns) {
      Object.keys(filterSortColumns).forEach(key => {
        if (filterSortColumns[key].sortingOrder != '') {
          sortBy = `${filterSortColumns[key].sortingOrder}(${key})`;
        }
      });
      if (!!sortBy) {
        url = url.concat(`&sort=${sortBy}`);
      }
    }
    if (filters.lineItemProperties) {
      Object.keys(filters.lineItemProperties).forEach(key => {
        if (key === 'extendedAttributes' && filters.lineItemProperties.extendedAttributes.length > 0) {
          filters.lineItemProperties.extendedAttributes.map((item, index) => {
            if (item.attribute.toLowerCase().includes('date') && item.attributeValue !== undefined) {
              const dateString = new Date(item.attributeValue).toISOString().slice(0, 10);
              filters.lineItemProperties.extendedAttributes[index].timeZone = dateString;
              const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
              filters.lineItemProperties.extendedAttributes[index].timeZone = timeZone;
            }
          });
        }
        else {
          if (key.toLowerCase().includes('date') && filters.lineItemProperties[key] !== undefined) {
            const dateString = new Date(filters.lineItemProperties[key]).toISOString().slice(0, 10);
            filters.lineItemProperties[key] = dateString;
            const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
            filters.lineItemProperties.timeZone = timeZone;
          }
        }
      });
    }
    return this.httpService.post<LineItemResponse>(url, filters)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the line item search result in short form.
   * @param packageId id of package
   * @param filters array of filter param
   * @param limit number of records per page
   * @param offset starting index of the record
   * @returns observable list of line items in short form
   */
  public getLineItemsSearchShort(filters: PackageLineItemSearchFilter, limit: number, offset: number, packageId: string): Observable<LineItemShortResponse> {
    const url = `/acceptancepackages/${packageId}/lineitems/search/short`;
    const params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    return this.httpService.post<LineItemShortResponse>(url, filters, { params })
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the list of evidences from all package line items.
   * @param packageId id of the package
   * @param limit number of records per page
   * @param offset offset
   * @returns observable list of Evidences
   */
  public getLineItemsEvidences(packageId: string, limit: number, offset: number, filterSortColumns, status?: string): Observable<GetLineItemEvidenceResponse> {
    let url: string;
    let sortBy = '';
    url = `/acceptancepackages/${packageId}/evidences?limit=${limit}&offset=${offset}`;
    if (filterSortColumns) {
      Object.keys(filterSortColumns).forEach(key => {
        if (filterSortColumns[key].sortingOrder != '') {
          sortBy = `${filterSortColumns[key].sortingOrder}(${key})`;
        }
      });
      if (!!sortBy) {
        url = url.concat(`&sort=${sortBy}`);
      }
    }
    if (status) {
      url = url.concat(`&status=${status}`);
    }
    return this.httpService.get<GetLineItemEvidenceResponse>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  getPackageMilestoneEvidences(
    packageId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,
  ): Observable<GetMilestoneEvidencesResponse> {
    const url = `/acceptancepackages/${packageId}/milestoneevidences`;
    const params: HttpParams = this.generateParamsByFilter(limit, offset, filter);

    return this.httpService.get<GetMilestoneEvidencesResponse>(url, { params });
  }

  // TODO refactor/extract as shared utility method
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
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          params = params.set(key, new Date(filter[key].searchText).toISOString().slice(0, 10)).set('timeZone', timeZone);
        } else {
          params = params.set(key, filter[key].searchText);
        }
      });
    }

    return params;
  }

  /**
   * Gets user session information
   */
  public getUserSession(): Observable<UserSession> {
    const headers = new HttpHeaders({
      'ngsw-bypass': 'true',
    });
    return this.httpService.get<UserSession>('/userSession', { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // HTTP status 401
          if (error.status === HttpStatusCode.Unauthorized) {
            location.href = `${document.baseURI}login`;
            return
          }
          return this.handleError(error);
        }),
      );
  }

  /**
   * Submit multiple acceptance packages.
   * @param body: proposed status and IDs of the acceptance packages
   */
  public submitAcceptancePackages(body: SubmitAcceptancePackagesRequest): Observable<any> {
    const url = `/acceptancepackages/status`;
    return this.httpService.put<any>(url, body);
  }

  /**
   * Fetches the package taxonomy.
   * @param packageId of the package
   */
  public getTaxonomyByPackageId(packageId: string): Observable<PackageTaxonomy> {
    const url = `/acceptancepackages/${packageId}/taxonomy`;
    return this.httpService.get<PackageTaxonomy>(url);
  }

  /**
 * Gets the details for the given linear id of a workitem.
 * @param projectId linear id of the project
 * @param workItemLinearId linear id of the workitem
 */
  public getWorkItemDetailsByLinearId(projectId: string, workItemLinearId: string): Observable<WorkItemInfo> {
    const url = `/projects/${projectId}/workitems/${workItemLinearId}`;
    return this.httpService.get<WorkItemInfo>(url);
  }

  /**
   * Get site details by project id and site id.
   * @param projectId the site belongs to
   * @param siteId of the site
   */
  public getSiteDetailsBySiteId(projectId: string, siteId: string): Observable<SiteStructure> {
    const url = `/projects/${projectId}/networkelements/${siteId}`;
    return this.httpService.get<SiteStructure>(url);
  }

  public getSitesByProject(
    limit: number,
    offset: number,
    projectId: string,
    filter?: FilterSortAttr[]
  ): Observable<ProjectSitesResponse> {
    const url = `/projects/${projectId}/sites`;
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    if (filter && filter.length > 0) {
      filter
        .filter(attr => attr.key !== undefined && attr.value !== undefined && attr.value.length > 0)
        .forEach(attr => (params = params.set(attr.key, attr.value)));
    }
    return this.httpService.get<ProjectSitesResponse>(url, { params });
  }

  /**
   * Gets site package metrics.
   * @param projectId the site belongs to
   * @param siteId of the site
   */
  public getSitePackageMetrics(projectId: string, siteId: string): Observable<{ pending: number, rejected: number, approved: number }> {
    const url = `/projects/${projectId}/sites/${siteId}/acceptancepackages/count`;
    return this.httpService.get<any>(url);
  }
  /**
   * Gets site certificate metrics.
   * @param projectId the site belongs to
   * @param siteId of the site
   */
  public getSiteCertificateMetrics(projectId: string, siteId: string): Observable<{ pending: number, rejected: number, signed: number }> {
    const url = `/projects/${projectId}/sites/${siteId}/certificates/count`;
    return this.httpService.get<any>(url);
  }

  /**
   * gets the evidence details
   * @param evidenceId linear id of the evidence
   * @returns the details
   */
  public getEvidence(evidenceId: string): Observable<Evidence> {
    const url = `/evidences/${evidenceId}`;
    return this.httpService.get<Evidence>(url);
  }

  /**
   * Gets the evidence file.
   * @param evidenceId linear id of the evidence
   */
  public getEvidenceFile(evidenceId: string): Observable<Blob> {
    const url = `/evidences/${evidenceId}/file`;
    return this.httpService.get(url, { responseType: 'blob' });
  }

  /**
* Gets the evidence file with SAS Url.
* @param evidenceId linear id of the evidence
*/
  public getEvidenceFileSasUrl(evidenceId: string): Observable<EvidenceDataWithSasUrl> {
    const url = `/evidences/${evidenceId}/sasurl`;
    return this.httpService.get<EvidenceDataWithSasUrl>(url);
  }

  public getEvidenceThumbnail(evidenceId: string): Observable<Blob> {
    const url = `/evidences/${evidenceId}/file?thumbnail=true`;
    return this.httpService.get(url, { responseType: 'blob' });
  }

  /**
   * Gets the related evidences as {@link RelatedEvidences}.
   * @param evidenceId of the evidence
   */
  public getRelatedEvidences(evidenceId: string): Observable<RelatedEvidences> {
    const url = `/evidences/${evidenceId}/related-evidence`;
    return this.httpService.get<RelatedEvidences>(url);
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
   * Download the selected evidence file
   * To get the filename with content-disposition requires HttpResponse headers so we are using this method instead of getEvidenceFile method
   * @param evidenceId
   * @returns
   */
  public downloadEvidence(evidenceId: string): Observable<HttpResponse<Blob>> {
    const url = `/evidences/${evidenceId}/file`;
    return this.httpService.get(url, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  /**
   * Save update of a given extended attribute of the referenced evidence.
   *
   * @param evidenceId to use
   * @param attr to use
   */
  public saveEvidenceExtendedAttribute(
    evidenceId: string,
    attr: ExtendedAttribute
  ): Observable<ExtendedAttribute> {
    const url = `/evidences/${evidenceId}/extended-attributes`;
    const defaultPayload: Partial<ExtendedAttribute> = {
      attributeName: undefined,
      attributeType: 'string',
      isReadOnly: false,
      isMandatory: false
    };
    const body = { ...attr, ...defaultPayload };
    const params: HttpParams = new HttpParams().set('attribute', attr.attributeName);
    return this.httpService.put<ExtendedAttribute>(
      url,
      body,
      { params }
    );
  }

  /**
   * Delete evidence.
   * @param evidenceId Id of the evidence to be deleted
   */
  public deleteEvidence(evidenceId: string): Observable<any> {
    const url = `/evidences/${evidenceId}`;
    return this.httpService.delete<any>(url);
  }

  /**
   * Gets the list of tags available in the given project.
   * @param packageId id of the package
   */
  public getTags(packageId: string): Observable<Container[]> {
    const url = `/acceptancepackages/${packageId}/tags`;
    return this.httpService.get<Container[]>(url);
  }

  /**
  * get the lineItem search result
  * @param packageId id of package
  * @param filters array of filter param
  * @returns returns lineitem list
  */

  public getLineItemEvidenceSearch(filters: LineItemEvidenceSearchRequest, limit, offset, packageId: string, filterSortColumns): Observable<GetLineItemEvidenceResponse> {
    let url;
    let sortBy = '';
    url = `/acceptancepackages/${packageId}/evidences/search?limit=${limit}&offset=${offset}`;
    if (filterSortColumns) {
      Object.keys(filterSortColumns).forEach(key => {
        if (filterSortColumns[key].sortingOrder != '') {
          sortBy = `${filterSortColumns[key].sortingOrder}(${key})`;
        }
      });
      if (!!sortBy) {
        url = url.concat(`&sort=${sortBy}`);
      }
    }
    Object.keys(filters.evidenceProperties).forEach(key => {
      if (key.toLowerCase().includes('date') && filters.evidenceProperties[key] !== undefined) {
        const dateString = new Date(filters.evidenceProperties[key]).toISOString().slice(0, 10);
        filters.evidenceProperties[key] = dateString;
        const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
        filters.evidenceProperties.timeZone = timeZone;
      }
    });
    return this.httpService.post<GetLineItemEvidenceResponse>(url, filters);
  }

  /**
   * Gets line item info.
   *
   * @param projectId of the containing project
   * @param lineItemId of the line item
   */
  public getLineItemInfo(projectId: string, lineItemId: string): Observable<LineItemInfo> {
    const url = `/projects/${projectId}/lineitems/${lineItemId}/info`;
    return this.httpService.get<LineItemInfo>(url);
  }

  public getLineItemEvidences(
    packageId: string,
    lineItemId: string,
    page: {
      limit: number,
      offset: number,
    },
  ): Observable<PageInfo & { results: EvidenceDetails[] }> {
    const params: HttpParams = new HttpParams().set('limit', page.limit).set('offset', page.offset);
    const url = `/acceptancepackages/${packageId}/lineitems/${lineItemId}/evidences`;
    return this.httpService.get<any>(url, { params });
  }

  public getAllLineItemEvidences(packageId: string, lineItemId: string,): Observable<EvidenceDetails[]> {
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
            packageId,
            lineItemId,
            {
              limit,
              offset: data.nextOffset,
            },
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: PageInfo & { results: EvidenceDetails[] }) => {
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
   * Updates the status of package evidences according to the provided status update description.
   *
   * @param packageId of the containing package
   * @param requestBody describing the status update
   */
  public updatePackageEvidencesStatus(packageId: string, requestBody: EvidenceStatusUpdate): Observable<GetEvidenceResponse> {
    const url = `/acceptancepackages/${packageId}/evidences/status`;
    return this.httpService.put<GetEvidenceResponse>(url, requestBody)
      .pipe(
        catchError(this.handleError),
      );;
  }

  /**
  * update line item status as Reject/Approve
  * @param packageId id of package
  * @param requestBody request body to update line item status
  */
  public updateLineItemStatus(packageId: string, requestBody: LineItemStatusUpdate): Observable<LineItemResponse> {
    const url = `/acceptancepackages/${packageId}/lineitems/status`;
    return this.httpService.put<LineItemResponse>(url, requestBody)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
  * update line item status as Reject/Approve with scope of All/Pending/Approved/Rejected
  * @param packageId id of package
  * @param requestBody request body to update line item status
  */
  public updateLineItemStatusWithScope(packageId: string, requestBody: LineItemStatusUpdateWithScope): Observable<LineItemResponse> {
    const url = `/acceptancepackages/${packageId}/lineitems/evidences/status`;
    return this.httpService.put<LineItemResponse>(url, requestBody)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Update evidences status with Reject/Approved
   * @param packageId id of package
   * @param body array of post method
   * @returns returns updated lineitems
   */
  public updateEvidencesStatus(packageId: string, body: EvidenceStatusUpdate): Observable<GetLineItemEvidenceResponse> {
    const url = `/acceptancepackages/${packageId}/evidences/status`;
    return this.httpService.put<GetLineItemEvidenceResponse>(url, body)
      .pipe(
        catchError(this.handleError),
      );
  }

  public getSiteMilestonesEvidences(
    projectId: string,
    siteId: string,
    page: {
      limit: number,
      offset: number,
    },
    filter?: FilterSortConfiguration
  ): Observable<PageInfo & { results: ProjectSiteMilestoneEvidence[] }> {
    const url = `/projects/${projectId}/sites/${siteId}/acceptancepackages/milestones/evidences`;
    const params: HttpParams = this.generateParamsByFilter(page.limit, page.offset, filter);
    return this.httpService.post<any>(url, {}, { params });
  }

  /**
   * Gets site milestones evidences metrics.
   * @param projectId the site belongs to
   * @param siteId of the site
   */
  public getSiteMilestonesEvidencesMetrics(projectId: string, siteId: string): Observable<{ pending: number, rejected: number, approved: number }> {
    const url = `/projects/${projectId}/sites/${siteId}/acceptancepackages/milestones/evidences/count`;
    return this.httpService.get<any>(url);
  }

  public getSiteLineItemsEvidences(
    projectId: string,
    siteId: string,
    page: {
      limit: number,
      offset: number,
    },
    filter?: FilterSortConfiguration
  ): Observable<PageInfo & { results: ProjectSiteLineItemEvidence[] }> {
    const url = `/projects/${projectId}/sites/${siteId}/acceptancepackages/lineitems/evidences`;
    const params: HttpParams = this.generateParamsByFilter(page.limit, page.offset, filter);
    return this.httpService.post<any>(url, {}, { params });
  }

  /**
   * Gets site line items evidences metrics.
   * @param projectId the site belongs to
   * @param siteId of the site
   */
  public getSiteLineItemsEvidencesMetrics(projectId: string, siteId: string): Observable<{ pending: number, rejected: number, approved: number }> {
    const url = `/projects/${projectId}/sites/${siteId}/acceptancepackages/lineitems/evidences/count`;
    return this.httpService.get<any>(url);
  }

  /**
   * gets the history of a given evidence
   * @param evidenceId id of the evidence
   */
  public getEvidenceStatusHistory(
    evidenceId: string,
    page: {
      limit: number,
      offset: number,
    }
  ): Observable<GetEvidenceHistoryResponse> {
    const url = `/evidences/${evidenceId}/status`;
    const params: HttpParams = new HttpParams().set('limit', page.limit).set('offset', page.offset);
    return this.httpService.get<GetEvidenceHistoryResponse>(url, { params });
  }

  /**
   * Get the history of comments of an evidence within a package.
   * @param packageId to use
   * @param evidenceId to use
   */
  public getAllEvidenceStatusHistory(evidenceId: string): Observable<EvidenceHistoryEntry[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getEvidenceStatusHistory(
            evidenceId,
            {
              limit,
              offset: data.nextOffset,
            },
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetEvidenceHistoryResponse) => {
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
   * Adds comments to a given acceptance package
   * @param packageId id of the acceptance package
   * @param comment text of the comment
   */
  public addPackageComments(packageId: string, comment: string): Observable<PostCommentsResponse> {
    const url = `/acceptancepackages/${packageId}/comments`;
    const body = {
      acceptancePackageComments: [
        { comment }
      ]
    };
    return this.httpService.post<PostCommentsResponse>(url, body);
  }

  /**
   * gets the history of comments in a given acceptance package
   * @param packageId id of the acceptance package
   */
  public getAllPackageComments(packageId: string): Observable<CommentsEntry[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          const url = `/acceptancepackages/${packageId}/comments`;
          const params: HttpParams = new HttpParams().set('limit', data.limit).set('offset', data.nextOffset);
          return this.httpService.get<GetCommentsResponse>(url, { params });
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetCommentsResponse) => {
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
   * gets the history of comments of a line item level evidence
   * @param packageId id of the acceptance package
   * @param lineItemUniqueId unique id of the line item
   * @param evidenceId id of the evidence
   */
  public getPackageEvidenceComments(
    identifier: {
      evidenceId: string
    },
    page: {
      limit: number,
      offset: number,
    }
  ): Observable<GetCommentsResponse> {
    const url = `/evidences/${identifier.evidenceId}/comments`;
    const params: HttpParams = new HttpParams().set('limit', page.limit).set('offset', page.offset);
    return this.httpService.get<GetCommentsResponse>(url, { params });
  }

  /**
   * Gets the history of comments of a package attached evidence
   * @param evidenceId id of the evidence
   */
  public getAllPackageEvidenceComments(evidenceId: string): Observable<CommentsEntry[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getPackageEvidenceComments({ evidenceId }, { limit, offset: data.nextOffset });
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetCommentsResponse) => {
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
   * Adds a comment to an evidence.
   * @param evidenceId id of the evidence
   * @param comment content of the comment
   */
  public addEvidenceComment(evidenceId: string, comment: string): Observable<CommentsEntry> {
    const url = `/evidences/${evidenceId}/comments`;
    const body = {
      evidenceComments: [
        {
          comment
        }
      ]
    };
    return this.httpService.post<CommentsEntry>(url, body);
  }

  /**
   * gets the history of comments of a line item level evidence
   * @param packageId id of the acceptance package
   * @param lineItemUniqueId unique id of the line item
   * @param evidenceId id of the evidence
   */
  public getEvidenceComments(
    identifier: {
      packageId: string,
      evidenceId: string
    },
    page: {
      limit: number,
      offset: number,
    }
  ): Observable<GetCommentsResponse> {
    const url = `/acceptancepackages/${identifier.packageId}/evidences/${identifier.evidenceId}/comments`;
    const params: HttpParams = new HttpParams().set('limit', page.limit).set('offset', page.offset);
    return this.httpService.get<GetCommentsResponse>(url, { params });
  }

  /**
   * Get the history of comments of an evidence within a package.
   * @param packageId to use
   * @param evidenceId to use
   */
  public getAllEvidenceComments(packageId: string, evidenceId: string): Observable<CommentsEntry[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getEvidenceComments(
            {
              packageId,
              evidenceId,
            },
            {
              limit,
              offset: data.nextOffset,
            },
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetCommentsResponse) => {
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
   * gets the history of comments of a line item
   * @param packageId id of the acceptance package
   * @param lineItemUniqueId unique id of the line item
   */
  public getLineItemComments(
    packageId: string,
    lineItemUniqueId: string,
    page: {
      limit: number,
      offset: number,
    }
  ): Observable<GetCommentsResponse> {
    const params: HttpParams = new HttpParams().set('limit', page.limit).set('offset', page.offset);
    const url = `/acceptancepackages/${packageId}/lineitems/${lineItemUniqueId}/comments`;
    return this.httpService.get<GetCommentsResponse>(url, { params });
  }

  /**
   * Get the history of comments of a package line item.
   * @param packageId to use
   * @param lineItemId to use
   */
  public getAllLineItemComments(packageId: string, lineItemId: string): Observable<CommentsEntry[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getLineItemComments(
            packageId,
            lineItemId,
            {
              limit,
              offset: data.nextOffset,
            },
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetCommentsResponse) => {
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
   * Adds a comment to a line item
   * @param lineItemUniqueId unique id of the line item
   * @param comment content of the comment
   */
  public addLineItemComment(lineItemUniqueId: string, comment: string): Observable<CommentsEntry> {
    const url = `/lineitems/${lineItemUniqueId}/comments`;
    const body = {
      lineItemComments: [
        {
          comment
        }
      ]
    };
    return this.httpService.post<CommentsEntry>(url, body);
  }

  /**
   * Download all evidences of of an acceptance package based on the selected type and status
   * @param packageId id of the acceptance package
   * @param evidenceStatus selected status of evidences for downloading
   * @param evidenceType selected type of evidences for downloading
   */
  public downloadPackageEvidences(packageId: string, evidenceStatus: string, evidenceType: string): Observable<HttpEvent<any>> {
    const url = `/acceptancepackages/${packageId}/evidences/download?evidenceType=${evidenceType}&evidenceStatus=${evidenceStatus}`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * Download all evidences of a line item.
   * @param identifier to identify the line item
   */
  public downloadLineItemEvidences(
    identifier: {
      projectId: string,
      lineItemId: string,
    },
  ): Observable<HttpEvent<any>> {
    const url = `/projects/${identifier.projectId}/lineitems/${identifier.lineItemId}/evidences/download`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * Download all package evidences of an acceptance package.
   * @param packageId id of the package
   */
  public downloadPackageLevelEvidences(packageId: string): Observable<HttpEvent<any>> {
    const url = `/acceptancepackages/${packageId}/additionalevidences/download`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * Get size information of an acceptance package
   * @param packageId id of the acceptance package
   */
  public getPackageEvidenceSize(packageId: string): Observable<GetPackageEvidencesSizeResponse> {
    const url = `/acceptancepackages/${packageId}/evidences/size`;
    return this.httpService.get<GetPackageEvidencesSizeResponse>(url);
  }

  /**
   * Extracts reports of the activity list from external tool and attaches them as evidences of the acceptance package
   * @param source of the reports
   * @param target to attach the reports
   * @returns success message
   */
  public addExternalProjectReport(
    source: {
      networkRolloutTool: string,
      siteId?: string,
      siteName?: string,
      activities?: ExternalActivity[],
    },
    target: {
      evidenceId?: string
      parentEvidenceId: string,
      parentId: string,
      parentType: EvidenceParentType,
      projectId: string,
    }
  ): Observable<string> {
    const url = `/networkrollouttool/projects/reports`;
    const requestBody = {
      ...source,
      ...target,
    };

    return this.httpService.post(url, requestBody, {
      observe: 'body',
      responseType: 'text'
    })
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets the list of countries
   * @returns country list
   */
  public getCountries(): Observable<GetCountriesResponse> {
    const url = `/countries`;
    return this.httpService.get<GetCountriesResponse>(url)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Check the status of acceptance package report based on the selected project linear id
   * @param projectLinearId id of the project
   */
  public checkReportStatus(projectLinearId: string): Observable<GetReportStatusResponse> {
    if (projectLinearId === undefined) {
      console.error('Status check of report requires the id to be set.');
      return;
    }
    const url = `/projects/${projectLinearId}/report/status`;
    return this.httpService.get<GetReportStatusResponse>(url);
  }

  /**
   * Trigger generation of acceptance package report based on the selected project linear id
   * @param projectLinearId id of the project
   */
  public generateReport(projectLinearId: string): Observable<any> {
    if (projectLinearId === undefined) {
      console.error('Download of report requires the id to be set.');
      return;
    }
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    const url = `/projects/report/generate`;
    const requestBody = { projectId: projectLinearId };
    return this.httpService.post(url, requestBody, { params });
  }

  /**
   * Download all packages of a project based on the selected project linear id
   * @param projectLinearId id of the project
   */
  public downloadReport(projectLinearId: string): Observable<HttpEvent<any>> {
    if (projectLinearId === undefined) {
      console.error('Download of package report requires the id to be set.');
      return;
    }
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    const url = `/projects/${projectLinearId}/report/download`;
    return this.httpService.get(url, {
      params,
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  public getProjectUsersAndGroups(
    projectId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortAttr[]): Observable<GetProjectUsersAndGroups> {
    const url = `/projects/${projectId}/projectassignment`;
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    if (filter && filter.length > 0) {
      filter
        .filter(attr => attr.key !== undefined && attr.value !== undefined)
        .forEach(attr => {
          if (attr.key.toLowerCase().includes('date')) {
            const dateString = new Date(attr.value).toISOString().slice(0, 10);
            const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
            params = params.set(attr.key, dateString).set('timeZone', timeZone);
          }
          else params = params.set(attr.key, attr.value);
        });
    }
    return this.httpService.get<GetProjectUsersAndGroups>(url, { params });
  }

  public getAllProjectUsersAndGroups(
    projectId: string,
    filter?: FilterSortAttr[],
  ): Observable<ProjectMember[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getProjectUsersAndGroups(
            projectId,
            limit,
            data.nextOffset,
            filter,
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
   * Updates a project member via PATCH method.
   * @param projectId of the target project
   * @param member of the project
   */
  public patchProjectMember(projectId: string, memberId: string, member: Partial<ProjectMember>): Observable<ProjectMember> {
    const url = `/projects/${projectId}/projectassignment/${memberId}`;
    return this.httpService.patch<ProjectMember>(url, member);
  }

  /**
   * @param projectId of the target project
   * @param groupInternalId Internal ID of the group as in project_groups table
   * @returns List of packages with details which are associated to the group as sole actors
   */
  public getGroupAssociatedPackageList(projectId: string, groupInternalId: string): Observable<GroupAssociatedPackage[]> {
    const url = `/projects/${projectId}/groups/${groupInternalId}/acceptancepackages`;
    return this.httpService.get<GroupAssociatedPackage[]>(url);
  }

  /**
   * @param projectId of the target project
   * @param groupInternalId Internal ID of the group as in project_groups table
   * @returns HTML File content with list of associated packages where group is sole actor
   */
  public downloadGroupAssociatedPackagesFile(projectId: string, groupInternalId: string): Observable<HttpEvent<Blob>> {
    const url = `/projects/${projectId}/groups/${groupInternalId}/acceptancepackages/file`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  public deleteProjectUsersGroups(projectLinearId: string, additionInQuery: string): Observable<string> {
    const url = `/projects/${projectLinearId}/users?${additionInQuery}`;
    return this.httpService.delete(url, {
      observe: 'body',
      responseType: 'text'
    })
      .pipe(
        catchError(this.handleError),
      );
  }

  public getUsageDashboard(year: string, country?: string): Observable<UsageDashboardResponse> {
    const url = `/usagedashboard`;
    let params: HttpParams = new HttpParams()
      .set('year', year);
    if (!!country) {
      params = params.set('country', country);
    }

    return this.httpService.get<UsageDashboardResponse>(
      url,
      { params }
    );
  }

  /**
   * Check the status of snag report based on the selected project linear id
   * @param projectLinearId id of the project
   */
  public checkSnagReportStatus(projectLinearId: string): Observable<GetReportStatusResponse> {
    if (projectLinearId === undefined) {
      console.error('Status check of report requires the id to be set.');
      return;
    }
    const url = `/projects/${projectLinearId}/snagreport/status`;
    return this.httpService.get<GetReportStatusResponse>(url);
  }

  /**
   * Trigger generation of snag report based on the selected project linear id and selected fields
   * @param projectLinearId id of the project
   * @param selectedFieldNames column names of the selected fields for snag report
   */
  public generateSnagReport(projectLinearId: string, selectedFieldNames: string[]): Observable<any> {
    if (projectLinearId === undefined) {
      console.error('Download of report requires the id to be set.');
      return;
    }
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    const url = `/projects/snagreport/generate`;
    const requestBody = {
      projectId: projectLinearId,
      reportFields: selectedFieldNames
    };
    return this.httpService.post(url, requestBody, { params });
  }

  /**
   * Download snag report
   * @param projectLinearId id of the project
   */
  public downloadSnagReport(projectLinearId: string): Observable<HttpEvent<Blob>> {
    if (projectLinearId === undefined) {
      console.error('Download of report requires the id to be set.');
      return;
    }
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    const url = `/projects/${projectLinearId}/snagreport/download`;
    return this.httpService.get(url, {
      params,
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * Check the status of project level certificate report based on the selected project linear id
   * @param projectLinearId id of the project
   */
  public checkCertificateReportStatus(projectLinearId: string): Observable<GetReportStatusResponse> {
    if (projectLinearId === undefined) {
      console.error('Status check of report requires the id to be set.');
      return;
    }
    const url = `/projects/${projectLinearId}/certificatereport/status`;
    return this.httpService.get<GetReportStatusResponse>(url);
  }

  /**
   * Trigger generation of project level certificate report based on the selected project linear id
   * @param projectLinearId id of the project
   */
  public generateCertificateReport(projectLinearId: string): Observable<any> {
    if (projectLinearId === undefined) {
      console.error('Download of certificate report requires the id to be set.');
      return;
    }
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    const url = `/projects/certificatereport/generate`;
    const requestBody = { projectId: projectLinearId };
    return this.httpService.post(url, requestBody, { params });
  }

  /**
   * Download project level certificate report based on the selected project linear id
   * @param projectLinearId id of the project
   */
  public downloadCertificateReport(projectLinearId: string): Observable<HttpEvent<Blob>> {
    if (projectLinearId === undefined) {
      console.error('Download of certificate report requires the id to be set.');
      return;
    }
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    const url = `/projects/${projectLinearId}/certificatereport/download`;
    return this.httpService.get(url, {
      params,
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * Gets values of project level acceptance package configuration
   * @param projectId linear id of the selected project
   * @returns
   */
  public getPackageConfiguration(projectId: string): Observable<PackageConfiguration> {
    const url = `/projects/${projectId}/configurations`;
    return this.httpService.get<PackageConfiguration>(url);
  }

  /**
   * Saves selected values of project level acceptance package configuration
   * @param projectId linear id of the selected project
   * @param configuration selected values for configuration form
   * @returns
  */
  public savePackageConfiguration(projectId: string, configuration: PackageConfigurationShort): Observable<PackageConfigResponse> {
    const url = `/projects/${projectId}/configurations`;
    return this.httpService.put<PackageConfigResponse>(url, configuration);
  }

  /**
   * Gets the list of certificates of a given project.
   *
   * @param projectId linear id of the project
   * @param limit number of records per page
   * @param offset starting index of the records
   * @param filterSort optional array of filter and sort attributes
   * @returns {Observable} of the requested page of certificates
   */
  public getCertificateList(projectId: string, limit: number, offset: number, filterSort?: FilterSortConfiguration, queryType?: CertificatesRequestQueryType): Observable<GetCertificatesResponse> {
    const url = `/projects/${projectId}/certificaterequest/search`;

    let params: HttpParams = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);

    const payload: any = {};
    if (filterSort) {
      Object.keys(filterSort).forEach(key => {
        if (filterSort[key].sortingOrder !== '') {
          params = params.set('sort', `${filterSort[key].sortingOrder}(${key})`);
        }

        const value = filterSort[key].searchText;
        if (!value || value.trim() === '') {
          return;
        }

        if (key.toLowerCase().includes('date')) {
          const dateString = new Date(value).toISOString().slice(0, 10);
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          payload[key] = dateString;
          payload.timeZone = timeZone;
        }
        else payload[key] = value;
      });
    }
    if (queryType) payload.queryType = queryType;

    const defaultPayload: GetCertificatesRequestPayload = {
      queryType: CertificatesRequestQueryType.project,
    };

    return this.httpService.post<GetCertificatesResponse>(url, { ...defaultPayload, ...payload }, { params });
  }

  public getCertificateRequestsForWorkPlan(identifier: { projectId: string, workPlanId: string }): Observable<Certificate[]> {
    const { projectId, workPlanId } = identifier;
    if (projectId === undefined) throw new Error('Required identifier property projectId is undefined');
    if (workPlanId === undefined) throw new Error('Required identifier property workPlanId is undefined');
    const url = `/projects/${projectId}/certificaterequest/workplans/${workPlanId}`;
    return this.httpService.get<{ certificateRequests: Certificate[] }>(url).pipe(map(response => response?.certificateRequests));
  }

  /**
   * Gets the list of acceptance packages of a given work plan.
   *
   * @param workPlanId id of the work plan
   * @returns {Observable} of the acceptance packages
   */
  public getAcceptancePackagesForWorkPlan(workPlanId: string): Observable<AcceptancePackageForWorkPlan[]> {
    const url = `/workplans/${workPlanId}/acceptancepackages`;
    return this.httpService.get<{ acceptancePackages: AcceptancePackageForWorkPlan[] }>(url).pipe(map(response => response?.acceptancePackages));
  }

  /**
   * Retrieves the certificate templates for a specific project.
   *
   * @param projectId - The ID of the project.
   * @param limit - The maximum number of templates to retrieve.
   * @param offset - The number of templates to skip before starting to retrieve.
   * @param filterSort - An optional array of filter and sort attributes.
   * @returns An Observable that emits the certificate templates.
   */
  public getCertificateTemplates(projectId: string, limit: number, offset: number, filterSort?: FilterSortAttr[]): Observable<GetCertificateTemplateResponse> {
    // TODO: use real url from backend
    const url = `/projects/${projectId}/certificatetemplates`;

    let params: HttpParams = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);
    if (filterSort && filterSort.length > 0) {
      filterSort.forEach(attr => {
        if (attr.key.toLowerCase().includes('date')) {
          const dateString = new Date(attr.value).toISOString().slice(0, 10);
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          params = params.set(attr.key, dateString).set('timeZone', timeZone);
        }
        else params = params.set(attr.key, attr.value);
      });
    }

    return this.httpService.get<GetCertificateTemplateResponse>(url, { params });
  }

  public getAllCertificateTemplates(projectId: string, filterSort?: FilterSortAttr[]): Observable<CertificateTemplate[]> {
    return of({
      morePages: true,
      limit: 100,
      nextOffset: 0,
      results: [],
    }).pipe(
      expand(data => {
        if (data.morePages)
          return this.getCertificateTemplates(projectId, data.limit, data.nextOffset, filterSort).pipe(
            map(newData => ({ ...newData, limit: data.limit }))
          );
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => data.results),
      reduce((acc, results) => ([...acc, ...results])),
      catchError((err) => {
        console.error(err);
        return of([] as CertificateTemplate[]);
      }),
    );
  }

  public getCertificateRequestDocuments(projectId: string, documentIdArr: string[]): Observable<CertificateRequestDocument[]> {
    const url = `/projects/${projectId}/certificaterequest/refdocuments/fetch`;
    return this.httpService.post<CertificateRequestDocument[]>(url, documentIdArr);
  }

  public getCertificateRequestDocumentsByCertReqId(projectId: string, certificateRequestId: string, filterSort?: FilterSortAttr[]): Observable<CertificateRequestDocument[]> {
    const url = `/projects/${projectId}/certificaterequest/${certificateRequestId}/refdocuments/fetch`;
    let params: HttpParams = new HttpParams();
    if (filterSort && filterSort.length > 0) {
      filterSort.forEach(attr => params = params.set(attr.key, attr.value));
    }
    return this.httpService.get<CertificateRequestDocument[]>(url, { params });
  }

  /**
   * Retrieves a certificate template by exact match of its name for a specific project.
   * @param projectId - The ID of the project.
   * @param templateName - The name of the certificate template.
   */
  public getCertificateTemplateByName(projectId: string, templateName: string): Observable<CertificateTemplate> {
    const url = `/projects/${projectId}/certificatetemplates/getCertificateTemplate`;

    const params: HttpParams = new HttpParams()
      .set('templateName', templateName);

    return this.httpService.get<CertificateTemplate>(url, { params });
  }

  /**
   * Saves a certificate template for a project.
   *
   * @param projectId - The ID of the project.
   * @param certificateTemplate - The certificate template request object.
   * @param file - The file to be uploaded.
   */
  public saveCertificateTemplate(projectId: string, certificateTemplate: CertificateTemplateRequest, file: File,): Observable<CertificateTemplate> {
    const url = `/projects/${projectId}/certificatetemplates`;
    const formData = new FormData();
    formData.append('reqBody', JSON.stringify(certificateTemplate));
    formData.append('file', file);
    return this.httpService.post<CertificateTemplate>(url, formData);
  }


  /**
   * Downloads a certificate template for a specific project.
   * @param projectId - The ID of the project.
   * @param templateId - The ID of the certificate template.
   */
  public downloadCertificateTemplate(projectId: string, templateId: string): Observable<HttpResponse<Blob>> {
    const url = `/projects/${projectId}/certificatetemplates/${templateId}/download`;
    return this.httpService.get(url, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  /**
   * Downloads a certificate for a specific project.
   * @param projectId - The ID of the project.
   * @param id - The ID of the certificate template.
   */
  public downloadCertificate(projectId: string, id: string): Observable<HttpResponse<Blob>> {
    const url = `/projects/${projectId}/certificates/${id}/download`;
    return this.httpService.get(url, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  /**
   * Download all documents of certificate request.
   * @param identifier to identify the line item
   */
  public downloadCertificateRequestDocuments(
    identifier: {
      projectId: string,
      certificateRequestId: string,
    },
  ): Observable<HttpEvent<any>> {
    const url = `/projects/${identifier.projectId}/certificaterequest/${identifier.certificateRequestId}/refdocuments/downloadAll`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * Updates a certificate template for a project.
   *
   * @param projectId - The ID of the project.
   * @param templateId - The ID of the template to update.
   * @param certificateTemplate - The object containing the updated values.
   * @param file - The file to be uploaded for the certificate template.
   */
  public updateCertificateTemplate(projectId: string, templateId: string, certificateTemplate: Partial<CertificateTemplateRequest>, file?: File,): Observable<CertificateTemplate> {
    const url = `/projects/${projectId}/certificatetemplates/${templateId}`;
    const formData = new FormData();
    formData.append('reqBody', JSON.stringify(certificateTemplate));
    if (file) formData.append('file', file);
    return this.httpService.patch<CertificateTemplate>(url, formData);
  }

  /**
   * Clones a certificate template.
   *
   * @param projectId - The ID of the project.
   * @param templateId - The ID of the template to clone.
   * @param newTemplateName - The name of the new template.
   */
  public cloneCertificateTemplate(projectId: string, templateId: string, newTemplateName: string): Observable<CertificateTemplate> {
    const url = `/projects/${projectId}/certificatetemplates/${templateId}/clone`;
    const requestBody = { templateName: newTemplateName };
    return this.httpService.post<CertificateTemplate>(url, requestBody);
  }

  public deleteCertificateTemplate(projectId: string, certificateTemplateId: string): Observable<any> {
    const url = `/projects/${projectId}/certificatetemplates/${certificateTemplateId}`;
    return this.httpService.delete(url);
  }

  public getCertificatePreview(projectId: string, requestBody: CertificatePreviewRequestBody | { id: string }): Observable<CertificatePreviewResponseBody> {
    // Narrow down with `in` operator to ensure property type.
    // See https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#unlisted-property-narrowing-with-the-in-operator
    const url = 'id' in requestBody
      ? `/projects/${projectId}/certificates/generatePreview`
      : `/projects/${projectId}/certificaterequest/generatePreview`;
    return this.httpService.post<CertificatePreviewResponseBody>(url, requestBody);
  }

  /**
   * Saves a certificate request for a project.
   *
   * @param projectId - The ID of the project.
   * @param requestBody - The request body containing the certificate request object.
   */
  public saveCertificateRequest(projectId: string, requestBody: CertificateRequestBody): Observable<CertificateRequestResponse> {
    const url = `/projects/${projectId}/certificaterequest`;
    return this.httpService.post<CertificateRequestResponse>(url, requestBody);
  }

  /**
   * Gets the details of a certificate request.
   * @param projectId - The ID of the project.
   * @param requestId - The ID of the certificate request.
   */
  public getCertificateRequest(projectId: string, requestId: string): Observable<CertificateRequestDetails> {
    const url = `/projects/${projectId}/certificaterequest/${requestId}`;
    return this.httpService.get<CertificateRequestDetails>(url);
  }

  public doCertificateAction(projectId: string, actionBody: CertificateActionBody): Observable<CertificateActionResponse> {
    const url = `/projects/${projectId}/certificaterequest/action`;
    return this.httpService.post<CertificateActionResponse>(url, actionBody);
  }

  /**
   * Downloads certificate merged with selected reference documents.
   *
   * @param projectId - The ID of the project.
   * @param requestId - The ID of the certificate request.
   * @param requestBody - The request body containing the list of reference documents.
   */
  public downloadCertificateMergeDocument(projectId: string, certificateRequestId: string, requestBody: CertificateReferenceMergeDocument[]): Observable<HttpEvent<Blob>> {
    const url = `/projects/${projectId}/certificates/${certificateRequestId}/downloadWithReferenceMerge`;
    return this.httpService.post(url, requestBody, {
      observe: 'events',
      responseType: 'blob'
    });
  }

  /**
   *
   * @param projectId linear id of the selected package
   * @returns
  */
  getPackageStatus(packageId: string): Observable<PackageStatus> {
    const url = `/acceptancepackages/${packageId}/status/suggestion`;
    return this.httpService.get<PackageStatus>(url);
  }

  /**
  *
  * @param projectId linear id of the selected package
  * @returns
 */
  getPackageValidationStatus(packageId: string): Observable<PackageValidateResponse> {
    const url = `/acceptancepackages/${packageId}/validate`;
    return this.httpService.get<PackageValidateResponse>(url);
  }

  /**
   *
   * @param milestones array of selected milestone ids
   * @returns sites structure
   */
  public getSitesByMilestones(milestones: string[], filterSort?: string): Observable<SiteStructure[]> {
    let url = `/getSiteAndStructureByMilestone/${milestones}`;
    if (filterSort) {
      url = url.concat(`${filterSort}`);
    }
    return this.httpService.get<SiteStructure[]>(url);
  }

  /**
   * Add users to existing acceptance package
   * @param projectId id of the project
   * @param packageId id of the package
   * @param requestBody users list in case of single level package or level list in case of multi-level package
   */
  public patchAcceptancePackageAddUser(projectId: string, packageId: string, requestBody: { users?: ComposeAcceptancePackageUserRequest[], levels?: ComposeAcceptancePackageLevelUserRequest[] }): Observable<any> {
    const url = `/projects/${projectId}/acceptancepackages/${packageId}`;
    return this.httpService.patch<any>(url, requestBody);
  }

  /**
   * @param projectId linear id of the selected package
   * @returns
  */
  getPackageRecentHistory(): Observable<RecentHistoryResponse[]> {
    const url = `/acceptancepackages/recenthistory`;
    return this.httpService.get<RecentHistoryResponse[]>(url);
  }

  public getWorkplansWithSite(
    projectId: string,
    limit: number = 10,
    offset: number = 0,
    filter?: FilterSortConfiguration,
    selectedWorkplanIds?: string[],
    selectedPackageStatus?: string[]): Observable<WorkplanSiteResponse> {
    const url = `/projects/${projectId}/workplans`;
    const filterBody = {};
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);

    if (filter) {
      Object.keys(filter).forEach(key => {
        if (filter[key].sortingOrder !== '') {
          params = params.set('sort', `${filter[key].sortingOrder}(${key})`);
        }

        if (!filter[key].searchText || filter[key].searchText.trim() === '') {
          return;
        }
        filterBody[key] = filter[key].searchText;
      });
    }

    if (selectedWorkplanIds && selectedWorkplanIds.length > 0) {
      filterBody['workplanIds'] = selectedWorkplanIds;
    }

    if (selectedPackageStatus && selectedPackageStatus.length > 0) {
      filterBody['packageStatus'] = selectedPackageStatus;
    }

    if (Object.keys(filterBody).length === 0) {
      return this.httpService.get<WorkplanSiteResponse>(url, { params });
    } else {
      return this.httpService.post<WorkplanSiteResponse>(url, filterBody, { params });
    }
  }

  public uploadCertDocumentFile(certDocumentRequest: CertificateDocumentRequest, file: File, projectId: string): Observable<HttpEvent<any>> {
    const url = `/projects/${projectId}/certificaterequest/refdocuments`;
    const params: HttpParams = new HttpParams().set('ngsw-bypass', true);

    const generateCertificateDocumentUploadFormData = (evidence: CertificateDocumentRequest, file: File): FormData => {
      // Mapping to identify type according to API specification.
      const evidenceTypeDefinition = this.evidenceTypeMediaTypeMappingDefinition;
      const evidenceType = Object.entries(evidenceTypeDefinition.map).find(entry => entry[1].find(type => {
        const mimeType = evidence.mimeType;
        if (mimeType?.length > 0) return type === mimeType;
        return type === file.name.match(/\.([a-zA-Z0-9]*)$/)?.toString();
      })
      )?.[0];
      if (evidenceType) {
        evidence.type = evidenceType;
      } else {
        // set default evidence type and MIME type
        evidence.type = 'Document';
        evidence.mimeType = 'application/octet-stream';
      }
      const formData = new FormData();
      formData.append('object', JSON.stringify(evidence));
      formData.append('file', file);
      return formData;
    }
    // Workaround if browser can't determine mime type that we want to support
    const setFileMimeTypeGuessFromFileBytes = (evidence: CertificateDocumentRequest, file: File): Observable<FormData> => {
      let mimeObservable: Observable<string> = of(undefined);
      if (evidence.mimeType.length === 0) {
        const blob = file.slice(0, 4);
        mimeObservable = from(blob.arrayBuffer().then(buffer => {
          const bytes = new Uint8Array(buffer);
          return evidence.mimeType = fileTypeMime(bytes).find(() => true);
        }));
      }
      return mimeObservable.pipe(
        map(() => {
          return generateCertificateDocumentUploadFormData(evidence, file);
        })
      );
    };
    const mimeObservable = setFileMimeTypeGuessFromFileBytes(certDocumentRequest, file);

    return mimeObservable.pipe(
      switchMap(formData => {
        return this.httpService.post(url, formData, {
          params,
          observe: 'events',
          responseType: 'json',
          reportProgress: true,
        });
      }),
    )
  }

  public downloadCertificateDocument(
    identifier: {
      projectId: string,
      documentId: string,
    },
  ): Observable<HttpEvent<any>> {
    const url = `/projects/${identifier.projectId}/certificaterequest/refdocuments/${identifier.documentId}/download`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  public deleteCertificateRequestDocument(projectId: string, documentId: string): Observable<any> {
    const url = `/projects/${projectId}/certificaterequest/refdocuments/${documentId}`;
    return this.httpService.delete<any>(url);
  }

  /**
   * Get the status history of an acceptance package
   * @param packageId id of the acceptance package
   * @param limit - The maximum number to retrieve.
   * @param offset - The number to skip before starting to retrieve.
   */
  public getPackageStatusHistory(packageId: string, limit: number, offset: number,): Observable<GetPackageHistoryResponse> {
    const url = `/acceptancepackages/${packageId}/status/history`;
    const params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    return this.httpService.get<GetPackageHistoryResponse>(url, { params });
  }

  /**
   * Get all status history of an acceptance package
   * @param packageId id of the acceptance package
   */
  public getAllPackageStatusHistory(packageId: string): Observable<PackageHistoryEntry[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getPackageStatusHistory(
            packageId,
            limit,
            data.nextOffset
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: GetPackageHistoryResponse) => {
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
   * Get all evidences of an acceptance package.
   * @param packageId id of the acceptance package
   * @param limit - The maximum number to retrieve.
   * @param offset - The number to skip before starting to retrieve.
   * @param type - The type of the evidences to retrieve.
   * @param [statuses] - array of evidence status to filter for
   */
  public getPackageAllEvidences(packageId: string, limit: number, offset: number, type: string,
    statuses: CustomerAcceptanceStatusKey[] = [
      'CustomerApproved',
      'DeemedApproved',
      'CustomerAcceptanceNotRequired',
    ]
  ): Observable<GetAllEvidencesResponse> {
    const url = `/acceptancepackagesb2b/acceptancepackages/${packageId}/allevidences`;
    const params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset).set('type', type).set('statuses', statuses.join());
    return this.httpService.get<GetAllEvidencesResponse>(url, { params });
  }

  /**
   * Transfers evidences of an acceptance package to B2B
   * @param packageId id of the acceptance package
   * @param evidenceIds ids of the evidences to be transferred
   */
  public transferPackageEvidences(
    packageId: string,
    evidenceIds: string[],
    selectedReports: TransferPackageReportType[],
  ): Observable<string> {
    const url = `/acceptancepackagesb2b/acceptancepackages/${packageId}/evidences/transfer`;
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const body = {
      evidenceIds,
      selectedReports,
      timeZone,
    };
    return this.httpService.post<string>(url, body);
  }

  /**
   * Downloads acceptance package summary for give package
   * @param packageId - The ID of the package.
   */
  public downloadAcceptancePackageSummary(packageId: string): Observable<HttpEvent<Blob>> {
    const url = `/acceptancepackages/${packageId}/summary?type=pdf`;
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    return this.httpService.get(url, {
      params,
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * Check the download status of documents from multi acceptance packages
   * @param projectLinearId id of the project that contains the acceptance packages
   */
  public checkPackageDocumentDownloadStatus(projectLinearId: string): Observable<GetPackageDocumentDownloadStatusResponse> {
    const url = `/projects/${projectLinearId}/packagedocumentzip/status`;
    return this.httpService.get<GetPackageDocumentDownloadStatusResponse>(url);
  }

  /**
   * Trigger generation of documents from multi acceptance packages
   * @param projectLinearId id of the project that contains the acceptance packages
   * @param packageIds list of ids of selected packages
   */
  public generatePackageDocumentDownload(projectLinearId: string, packageIds: string[]): Observable<any> {
    const url = `/projects/${projectLinearId}/packagedocumentzip/generate`;
    return this.httpService.post(url, packageIds);
  }

  /**
   * Download package documents from multi acceptance packages
   * @param projectLinearId id of the project that contains the acceptance packages
   */
  public downloadPackageDocument(projectLinearId: string): Observable<HttpEvent<Blob>> {
    const url = `/projects/${projectLinearId}/packagedocumentzip/download`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  /**
   * Get count of acceptance packages based on status for project dashboard
   * @param projectId id of the project that contains the acceptance packages
   */
  public getDashboardPackagesCount(projectId: string): Observable<GetDashboardPackagesCountResponse> {
    const url = `/dashboard/projects/${projectId}/acceptancepackages/count`;
    return this.httpService.get<GetDashboardPackagesCountResponse>(url);
  }

  /**
   * Get count of acceptance evidences based on status for project dashboard
   * @param projectId id of the project that contains the acceptance evidences
   */
  public getDashboardEvidencesCount(projectId: string): Observable<GetDashboardEvidencesCountResponse> {
    const url = `/dashboard/projects/${projectId}/evidences/count`;
    return this.httpService.get<GetDashboardEvidencesCountResponse>(url);
  }

  /**
   * Get count of acceptance certificates based on status for project dashboard
   * @param projectId id of the project that contains the acceptance certificates
   */
  public getDashboardCertificatesCount(projectId: string): Observable<GetDashboardCertificatesCountResponse> {
    const url = `/dashboard/projects/${projectId}/certificates/count`;
    return this.httpService.get<GetDashboardCertificatesCountResponse>(url);
  }

  /**
   * Get trend of acceptance packages based on status for project dashboard
   * @param projectId id of the project that contains the acceptance packages
   */
  public getDashboardAcceptanceTrend(projectId: string): Observable<GetDashboardAcceptanceTrendResponse> {
    const url = `/dashboard/projects/${projectId}/acceptancepackages/report`;
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    return this.httpService.get<GetDashboardAcceptanceTrendResponse>(url, { params });
  }

  /**
   * Get trend of acceptance certificates based on status for project dashboard
   * @param projectId id of the project that contains the acceptance certificates
   */
  public getDashboardCertificationTrend(projectId: string): Observable<GetDashboardCertificationTrendResponse> {
    const url = `/dashboard/projects/${projectId}/certificates/report`;
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params: HttpParams = new HttpParams().set('timeZone', timeZone);
    return this.httpService.get<GetDashboardCertificationTrendResponse>(url, { params });
  }

  /**
   * Endpoint to list APS where an user is a sole user
   * @param 
   */
  public getListOfAcceptancePackagesWhereUserIsASoleUser(projectId: string, internalId: string): Observable<GroupAssociatedPackage[]> {
    const url = `/projects/${projectId}/users/${internalId}/acceptancepackages`;
    return this.httpService.get<any>(url);
  }

  /**
  * @param projectId of the target project
  * @param groupInternalId Internal ID 
  * @returns HTML File content with list of associated packages where user is a sole actor
  */
  public downloadUserAssociatedPackagesFile(projectId: string, internalId: string): Observable<HttpEvent<Blob>> {
    const url = `/projects/${projectId}/users/${internalId}/acceptancepackages/file`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

}
