import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Evidence } from '../projects.interface';
import { ProjectsService } from '../projects.service';

@Injectable()
export class ImageService {
  imgUrl: ReplaySubject<string | ArrayBuffer[]> = new ReplaySubject<string | ArrayBuffer[]>(1);
  constructor(
    private projectService: ProjectsService,
  ) {
  }

  /**
   * Gets URL of the file
   */
  public retrieveFileUrl(evidence: Evidence): ReplaySubject<string | ArrayBuffer[]> {
    const isStreamingMP4Enabled = false;
    if (isStreamingMP4Enabled
      && (evidence.fileMIMEType === 'video/mp4' || evidence.fileType === 'video/mp4')
    ) {
      this.imgUrl.next(evidence.internalId ? `/evidences/${evidence.internalId}/file` : null);
    }
    else {
      this.projectService.getEvidenceFile(evidence.internalId).pipe(tap((file) => {
        this.imgUrl.next(window.URL.createObjectURL(file));
      }),
        catchError(
          (error: HttpErrorResponse): Observable<any> => {
            this.imgUrl.next('');
            return of(null); // or any other stream like of('') etc.
          }
        ),
      )
    }
    return this.imgUrl;
  }
}