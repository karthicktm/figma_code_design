import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HealthCheckResponse } from './health-check.interface';


@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  public getHealth(): Observable<HealthCheckResponse> {
    const url = '/health';

    return this.httpClient.get<HealthCheckResponse>(url);
  }
}