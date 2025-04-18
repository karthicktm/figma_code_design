import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { Observable, of, ReplaySubject, throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { Evidence } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { FilePreview, FilePreviewService } from 'src/app/shared/file-preview-wrapper/file-preview.service';
import { DetailsContextualService } from '../../acceptance-package-details/details-contextual.service';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DataSourceTool } from '../../acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnail/evidence-thumbnail.component';
@Component({
  selector: 'app-maximize-screen',
  templateUrl: './maximize-screen.component.html',
  styleUrls: ['./maximize-screen.component.less']
})
export class MaximizeScreenComponent implements OnInit {
  @Input() evidenceId: string;
  @Input() dataSourceTool:DataSourceTool;
  public showLoader: boolean =true;
  evidenceDetails: Evidence;
  imgUrl: ReplaySubject<string | ArrayBuffer[]> = new ReplaySubject<string | ArrayBuffer[]>(1);
  constructor(private projectsService: ProjectsService,
    private filePreviewService: FilePreviewService,
    private detailsService: DetailsContextualService,
    private networkRollOutService:NetworkRollOutService) { }

    ngOnInit(): void {
      this.getEvidenceDetails();
      this.filePreview();
    }
    getEvidenceDetails(reloadFile: boolean = true): void {
      if(this.dataSourceTool===DataSourceTool.nro){
        this.networkRollOutService.getEvidence(this.evidenceId).subscribe({
          next: (data) => {
            this.showLoader = false;
            this.evidenceDetails = data;
            if (reloadFile) {
              this.retrieveFileUrl(data);
            }
          }
        });
      }
      else{
        this.projectsService.getEvidence(this.evidenceId).subscribe({
          next: (data) => {
            this.showLoader = false;
            this.evidenceDetails = data;
            if (reloadFile) {
              this.retrieveFileUrl(data);
            }
          }
        });
      }

    }
     /**
     * Gets URL of the file
     */
      public retrieveFileUrl(evidence: Evidence): void {
        if (evidence.fileMIMEType === 'video/mp4'
        ) {
          this.projectsService.getEvidenceFileSasUrl(evidence.internalId).pipe(
            tap((evd) => {
              this.imgUrl.next(evd.sasUrl);
            }),
            catchError(
              (error: HttpErrorResponse): Observable<any> => {
                this.imgUrl.next('');
                return of(null); // or any other stream like of('') etc.
              }
            ),
          )
            .subscribe();
        }
        else {
          if(this.dataSourceTool===DataSourceTool.nro){
            this.networkRollOutService.getEvidenceFile(evidence.internalId).pipe(
              tap((file) => {
                this.imgUrl.next(window.URL.createObjectURL(file));
              }),
              catchError(
                (error: HttpErrorResponse): Observable<any> => {
                  this.imgUrl.next('');
                  return of(null); // or any other stream like of('') etc.
                }
              ),
            )
            .subscribe();
          }
          else{
            this.projectsService.getEvidenceFile(evidence.internalId).pipe(
              tap((file) => {
                this.imgUrl.next(window.URL.createObjectURL(file));
              }),
              catchError(
                (error: HttpErrorResponse): Observable<any> => {
                  this.imgUrl.next('');
                  return of(null); // or any other stream like of('') etc.
                }
              ),
            )
            .subscribe();
          }

        }
      }
       /**
     * calls the file preview
     */
    public filePreview(): void {
      this.filePreviewService.loading.next(true);
      const filePreview: FilePreview = {name: '', dataURI: '', mimeType: ''};
      const observable = this.imgUrl;
      observable.subscribe({
          next: value  => {
            filePreview.name = this.evidenceDetails.name;
            filePreview.mimeType = this.evidenceDetails.fileMIMEType;
            filePreview.dataURI = value as string;
            this.filePreviewService.filePreview.next(filePreview);
            this.filePreviewService.loading.next(false);
          },
          error: (error) => {
            this.filePreviewService.filePreview.next(filePreview);
            this.filePreviewService.loading.next(false);
            console.log(error);
          }
      });
    }
    onCloseMinimize(): void {
      this.detailsService.close();
    }

    public getStatusColor(status: string): string {
      return AcceptancePackageUtils.getStatusColor(status);
    }

    public getStatus(status: string): string {
      return AcceptancePackageUtils.getStatus(status);
    }

    downLoadFile(event): void {
      this.imgUrl.pipe(
        take(1),
        tap((imgUrl) => {
          if (!imgUrl.toString().startsWith('data:')) {
            this.projectsService.getEvidenceFile(this.evidenceDetails.internalId).pipe(
              tap((file) => {
                const link = document.createElement('a');
                const dataUrl = window.URL.createObjectURL(file);
                link.href = dataUrl;
                link.download = this.evidenceDetails.name;
                link.dispatchEvent(new MouseEvent('click'));

              }),
              catchError(
                (error: HttpErrorResponse): Observable<never> => {
                  return throwError(error);
                }
              ),
            ).subscribe();
          }
          else {
            const link = document.createElement('a');
            link.href = imgUrl as string;
            link.download = this.evidenceDetails.name;
            link.dispatchEvent(new MouseEvent('click'));
          }
        }),
      ).subscribe();
    }
  }
