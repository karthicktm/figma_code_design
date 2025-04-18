import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditReportResponse } from './audit.interface';


@Injectable({
  providedIn: 'root'
})
export class AuditReportService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  public searchAudits(limit: number, offset: number, sort?: string,
    searchFilter?: Object): Observable<AuditReportResponse> {
    const url = '/audits/search';
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);

    if (sort && sort.length > 0) {
      params = params.set('sort', sort.replace('elementType', 'element_type'));
    }

    return this.httpClient.post<AuditReportResponse>(url, searchFilter, { params: params });
  }
}