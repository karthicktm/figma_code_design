import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { FilterSortConfiguration } from '../shared/table-server-side-pagination/table-server-side-pagination.component';
import { GetDashboardCertificatesResponse, CertificatesCount, GetDashboardPackagesResponse, PackagesCount } from './dashboard.interface';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private httpService: HttpClient,
  ) { }

  /**
   * Gets acceptance packages for dashboard based on role type and status
   * @param projectId id of project of the requested dashboard
   * @param roleType role type to filter the packages
   * @param status status to filter the packages
   * @param limit number of records per page
   * @param offset starting index of the record
   * @param slaOverdue whether to filter packages that are SLA overdue
   * @param filter filter and sort configuration
   * @returns paginated package list for dashboard
   */
  public getDashboardPackages(projectId: string, roleType: string, status: string, limit: number, offset: number, slaOverdue?: boolean, filter?: FilterSortConfiguration): Observable<GetDashboardPackagesResponse> {
    const url = `/projects/${projectId}/acceptancepackages/dashboard/roletype/status`;
    let params: HttpParams = new HttpParams()
      .set('roleType', roleType)
      .set('status', status)
      .set('limit', limit)
      .set('offset', offset);
    const requestBody = {};

    if (slaOverdue !== undefined) {
      requestBody['SLAOverdue'] = slaOverdue
    }
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
          requestBody[key] = dateString;
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          requestBody['timeZone'] = timeZone;
        } else {
          requestBody[key] = filter[key].searchText;
        }
      });
    }
    return this.httpService.post<GetDashboardPackagesResponse>(url, requestBody, { params })
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Gets certificate requests for dashboard based on status
   * @param projectId id of project of the requested dashboard
   * @param status status to filter the certificate requests
   * @param limit number of records per page
   * @param offset starting index of the record
   * @param filter filter and sort configuration
   * @returns paginated certificate request list for dashboard
   */
  public getDashboardCertificates(projectId: string, status: string, limit: number, offset: number, filter?: FilterSortConfiguration): Observable<GetDashboardCertificatesResponse> {
    const url = `/projects/${projectId}/certificates/dashboard/status`;
    let params: HttpParams = new HttpParams()
      .set('status', status)
      .set('limit', limit)
      .set('offset', offset);

    const requestBody = {};
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
          requestBody[key] = dateString;
          const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
          requestBody['timeZone'] = timeZone;
        } else {
          requestBody[key] = filter[key].searchText;
        }
      });
    }
    return this.httpService.post<GetDashboardCertificatesResponse>(url, requestBody, { params })
      .pipe(
        catchError(this.handleError),
      );
  }

  public getPackagesCount(projectId: string, roleType: string): Observable<PackagesCount> {
    const params: HttpParams = new HttpParams().set('roleType', roleType);
    const url = `/projects/${projectId}/acceptancepackages/count`;
    return this.httpService.get<PackagesCount>(url, { params })
      .pipe(
        catchError(this.handleError),
      );
  }

  public getCertificatesCount(projectId: string): Observable<CertificatesCount> {
    const url = `/projects/${projectId}/certificates/count`;
    return this.httpService.get<CertificatesCount>(url)
      .pipe(
        catchError(this.handleError),
      );
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
    return throwError(() => error);
  }
}
