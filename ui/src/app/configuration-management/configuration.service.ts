import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ConfigurationResponse,
  ConfigurationRequest,
  UpdateConfiguration,
  Configuration,
  ConfigurationSearchModel,
} from './configuration.interface';
import { EMPTY, Observable, catchError, expand, map, of, reduce, takeWhile, throwError } from 'rxjs';

@Injectable()
export class ConfigurationService {
  constructor(private httpService: HttpClient) { }

  private getConfigurations(limit: number, offset: number): Observable<ConfigurationResponse> {
    const url = `/configurations`;
    const params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);
    return this.httpService.get<ConfigurationResponse>(url, { params });
  }

  /**
   * 
   * @param limit - Page size starting from 1 to a positive number
   * @param offset - Page offset, starting from 0 to a positive number
   * @param sort - sort string, syntax - columnName(asc|desc) e.g. - key(asc|desc)
   * @param searchFilter - Filter object as key value pair as in interface ConfigurationSearchModel
   * @returns - Observable<ConfigurationResponse>
   */
  public searchConfiguration(limit: number, offset: number, sort?: string,
    searchFilter?: ConfigurationSearchModel): Observable<ConfigurationResponse> {
    const url = '/configurations/search';
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);

    if (sort && sort.length > 0) {
      params = params.set('sort', sort);
    }

    if (!searchFilter) {
      searchFilter = {};
    }

    Object.entries(searchFilter).forEach(param => {
      const [key, value] = param;
      if (key.toLowerCase().includes('date')) {
        const dateString = new Date(value).toISOString().slice(0, 10);
        searchFilter[key] = dateString;
        const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
        searchFilter.timeZone = timeZone;
      }
    });

    return this.httpService.post<ConfigurationResponse>(url, searchFilter, { params: params });
  }

  /**
   * Get lists of all the configurations
   * @returns
   */
  public getAllConfigurations(
  ): Observable<Configuration[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getConfigurations(
            limit,
            data.nextOffset,
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map((data: ConfigurationResponse) => {
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
   * @param key configuration key
   * Get configuration by key
   * @returns
   */
  public getConfigurationByKey(key: string): Observable<ConfigurationResponse> {
    const url = `/configurations?key=${key}`;
    return this.httpService.get<ConfigurationResponse>(url);
  }

  /**
   * Add new configuration
   * @param configuration : Configuration details
   * @returns
   */
  public addConfiguration(
    configuration: ConfigurationRequest
  ): Observable<ConfigurationRequest> {
    const url = `/configurations`;
    return this.httpService.post<ConfigurationRequest>(url, configuration);
  }

  public updateConfiguration(
    configuration: UpdateConfiguration,
    key: string
  ): Observable<UpdateConfiguration> {
    const url = `/configurations/${key}`;
    return this.httpService.put<UpdateConfiguration>(url, configuration);
  }

  /**
   * Delete configuration
   * @param key configuration key
   */
  public deleteConfiguration(
    key: string
  ): Observable<any> {
    const url = `/configurations/${key}`;
    return this.httpService.delete<any>(url);
  }
}
