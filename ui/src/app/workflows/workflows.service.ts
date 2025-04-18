import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, from, of, throwError } from 'rxjs';
import { catchError, expand, map, reduce, switchMap, takeWhile } from 'rxjs/operators';
import { AcceptanceRuleListResponse, FilterSortAttr, RuleSetInfo, WorkflowInfo, WorkflowsListResponse } from './workflows.interface';


@Injectable({
  providedIn: 'root'
})
export class WorkflowsService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  public getAllWorkflows(sort?: FilterSortAttr[]): Observable<WorkflowInfo[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getWorkflows(limit, data.nextOffset, sort);
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: WorkflowsListResponse & { results: WorkflowInfo[] }) => {
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

  public getWorkflows(limit: number, offset: number, sort?: FilterSortAttr[]): Observable<WorkflowsListResponse> {
    const url = '/workflows';
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);

    if (sort && sort.length > 0) {
      Object.keys(sort).forEach(key => {
        if (sort[key].key !== undefined && sort[key].value !== undefined && sort[key].value.length > 0) {
          params = params.set(sort[key].key, sort[key].value);
        }
      });
    }

    return this.httpClient.get<WorkflowsListResponse>(url, { params: params });
  }

  public getAllAcceptanceRules(sort?: FilterSortAttr[]): Observable<RuleSetInfo[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getAcceptanceRules(limit, data.nextOffset, sort);
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: AcceptanceRuleListResponse & { results: RuleSetInfo[] }) => {
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

  public getAcceptanceRules(limit: number, offset: number, sort?: FilterSortAttr[]): Observable<AcceptanceRuleListResponse> {
    const url = '/acceptancepackagerules';
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);

    if (sort && sort.length > 0) {
      Object.keys(sort).forEach(key => {
        if (sort[key].key !== undefined && sort[key].value !== undefined && sort[key].value.length > 0) {
          params = params.set(sort[key].key, sort[key].value);
        }
      });
    }

    return this.httpClient.get<AcceptanceRuleListResponse>(url, { params: params });
  }
}