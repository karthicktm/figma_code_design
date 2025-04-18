import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export enum HelpDocumentType {
  UserGuide = 'UserGuide',
  FAQ = 'FAQ',
  ReleaseNotes = 'ReleaseNotes',
}

interface DocumentState {
  dataUrl: string,
  isLoading: boolean,
  error?: HttpErrorResponse
}

type LoadedDocuments = Record<HelpDocumentType, DocumentState>

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  loadedDocuments: LoadedDocuments = {
    FAQ: {} as DocumentState,
    ReleaseNotes: {} as DocumentState,
    UserGuide: {} as DocumentState,
  } as LoadedDocuments;

  constructor(
    private httpClient: HttpClient,
  ) { }

  /**
   * Generates the document object URL.
   * @param type of the document
   * @param update forces omitting already loaded version
   */
  public getDocumentUrl(type: HelpDocumentType, update = false): Observable<DocumentState> {
    if (this.loadedDocuments[type] && this.loadedDocuments[type].dataUrl && !update) {
      return of(this.loadedDocuments[type]);
    }
    else {
      if (!this.loadedDocuments[type].isLoading) {
        this.loadedDocuments[type].isLoading = true;
        return this.getDocument(type).pipe(
          map((event) => {
            if (event.type === HttpEventType.Response) {
              const objectUrl = URL.createObjectURL(event.body)
              this.loadedDocuments[type].dataUrl = objectUrl;
              this.loadedDocuments[type].isLoading = false;
              this.loadedDocuments[type].error = undefined;
            }
            return this.loadedDocuments[type];
          }),
          catchError((error: HttpErrorResponse) => {
            this.loadedDocuments[type].isLoading = false;
            this.loadedDocuments[type].error = error;

            return throwError(error);
          })
        );
      }
      return EMPTY;
    }
  }

  private getDocument(type: HelpDocumentType, url: string = '/documents'): Observable<HttpEvent<Blob>> {
    const params: HttpParams = new HttpParams().set('docType', type)
    return this.httpClient.get(url, {
      params,
      observe: 'events',
      responseType: 'blob',
      reportProgress: true,
    });
  }
}
