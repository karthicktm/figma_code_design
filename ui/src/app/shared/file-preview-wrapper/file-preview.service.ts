import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { concat, Observable, of, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RectMarker } from './image-file-preview/markable.directive';

@Injectable({
  providedIn: 'root'
})
export class FilePreviewService {


  filePreview: ReplaySubject<FilePreview> = new ReplaySubject<FilePreview>(1);

  loading: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  constructor(
    private httpClient: HttpClient,
  ) { }

  /**
   * Gets the file.
   * @param url of the file
   * @param chunkSize of the file parts to download
   */
  public getFile(url: string, chunkSize: number = 1024 * 1024): Observable<HttpResponse<ArrayBuffer>> {
    const initialBytesOffset = 0;
    const headers = new HttpHeaders({
      Range: `bytes=${initialBytesOffset}-${chunkSize - 1}`,
    });
    return this.httpClient.get(url, {
      headers,
      observe: 'response',
      responseType: 'arraybuffer',
    }).pipe(
      switchMap((response) => concat(
        of(response),
        ...this.getChunkRequests(response, headers, url, chunkSize),
      )),
    );

  }

  private getChunkRequests(response: HttpResponse<ArrayBuffer>, headers: HttpHeaders, url: string, chunkSize: number): Observable<HttpResponse<ArrayBuffer>>[] {
    const contentRange = response.headers.get('Content-Range');
    const fileSize = Number.parseInt(contentRange.substring(contentRange.indexOf('/') + 1));
    let bytesOffset = 0;
    let chunkRequests: Observable<HttpResponse<ArrayBuffer>>[] = [];
    while (fileSize > bytesOffset + chunkSize) {
      bytesOffset = bytesOffset + chunkSize;
      const newRangeHeaderValue = `bytes=${bytesOffset}-${bytesOffset + chunkSize - 1}`;
      headers = headers.set('Range', `${newRangeHeaderValue}`);
      chunkRequests = [
        ...chunkRequests,
        this.httpClient.get(url, {
          headers,
          observe: 'response',
          responseType: 'arraybuffer',
        })
      ];
    }
    return chunkRequests;
  }
}

export class FilePreview {
  public name: string;
  public dataURI: string;
  public mimeType: string;
  public markings?: RectMarker[];
}
