import { HttpClient, HttpErrorResponse, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError, expand, map, reduce, takeWhile } from 'rxjs/operators';
import { AddGroupPayload, FilterSortAttr, Group, GroupAssociatedPackage, GroupList, GroupUsers, RoleType, UpdateGroupPayload } from './group-management-interfaces';
import { GroupsEndpoint } from '../endpoint.interface';
@Injectable({
  providedIn: 'root',
})
export class GroupManagementService {

  constructor(
    private httpService: HttpClient,
  ) {
  }

  /**
   * Gets the list of all groups known
   */
  public getGroupList(limit: number, offset: number, filterSort?: FilterSortAttr[], url: string = GroupsEndpoint.allGroups): Observable<GroupList> {
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
        else params = params.set(attr.key, attr.value)
      });
    }
    return this.httpService.get<GroupList>(
      url,
      { params }
    );
  }

  /**
   * Fetch all groups.
   */
  public getAllGroups(options?: { roleType: RoleType }, url: string = GroupsEndpoint.allGroups): Observable<Group[]> {
    const limit = 100;
    const filterSort = options ? Object.entries(options).map(option => ({ key: option[0], value: option[1] })) : [];
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getGroupList(
            limit,
            data.nextOffset,
            filterSort,
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

  /**
   * Enroll new group
   * @param group to be enrolled
   */
  public addGroup(group: AddGroupPayload): Observable<Group> {
    const url = `/groups`;
    return this.httpService.post<Group>(url, group)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Update group
   * @param groupId
   * @param updateGroup payload of update group
   */
  public updateGroup(groupId: string, updateGroup: UpdateGroupPayload): Observable<UpdateGroupPayload> {
    const url = `/groups/${groupId}/users`;
    return this.httpService.patch<Group>(url, updateGroup)
      .pipe(
        catchError(this.handleError),
      );
  }

  public getGroupUserList(groupId: string): Observable<GroupUsers> {
    const url = `/groups/${groupId}/users`;
    return this.httpService.get<GroupUsers>(url);
  }

  public getGroupAssociatedPackageList(groupId: string): Observable<GroupAssociatedPackage[]> {
    const url = `/groups/${groupId}/acceptancepackages`;
    return this.httpService.get<GroupAssociatedPackage[]>(url);
  }

  public downloadGroupAssociatedPackages(groupId: string): Observable<HttpEvent<Blob>> {
    const url = `/groups/${groupId}/acceptancepackages/file`;
    return this.httpService.get(url, {
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }

  private handleError(error: HttpErrorResponse): Observable<any> {
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

}
