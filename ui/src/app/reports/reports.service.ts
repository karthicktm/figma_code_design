import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

enum UsageReportType {
  PackageUsageReport = 'PackageUsageReport',
  LineItemUsageReport = 'LineItemUsageReport',
  EvidenceUsageReport = 'EvidenceUsageReport',
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  public getUsageReport(reportType: UsageReportType, customerId?: string ): Observable<HttpEvent<Blob>> {
    let params: HttpParams = new HttpParams()
      .set('reportType', reportType);
    if (customerId) {
      params = params.set('customerId', customerId);
    }
    const url = '/usagereport';
    return this.httpClient.get(
      url,
      {
        params,
        observe: 'events',
        responseType: 'blob',
        reportProgress: true,
      }
    );
  }
}
