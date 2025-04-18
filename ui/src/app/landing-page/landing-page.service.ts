import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

interface GetUserPendingPackageAndCertificateCountResponse {
  pendingPackages: number;
  pendingCertificates: number;
}

@Injectable({
  providedIn: 'root'
})
export class LandingPageService {
 
  constructor(private httpClient: HttpClient) { }

  /**
    * Get count of pending package(s) and certificate(s) for a user
  */
  public getPendingPackageAndCertificateCount(roleType: string): Observable<GetUserPendingPackageAndCertificateCountResponse> {
    const params: HttpParams = new HttpParams().set('roleType', roleType);
    const url = `/projects/packages-certificates/count`;
    return this.httpClient.get<GetUserPendingPackageAndCertificateCountResponse>(url, { params })
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
