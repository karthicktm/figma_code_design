import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { CustomerAcceptanceStatus, Evidence } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { Observable, of, ReplaySubject, Subscription } from 'rxjs';
import { catchError, exhaustMap, take, tap } from 'rxjs/operators';
import AcceptancePackageUtils from 'src/app/projects/project/acceptance-package-utilities';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';

export enum DataSourceTool {
  ledger = '',
  nro = 'NROTool',
}

@Component({
  selector: 'app-evidence-thumbnail',
  templateUrl: './evidence-thumbnail.component.html',
  styleUrls: ['./evidence-thumbnail.component.less']
})
export class EvidenceThumbnailComponent implements OnDestroy {
  @Input() maximized?: boolean = false;
  @Output() readonly maximizeScreen = new EventEmitter<any>();
  @Output() readonly minimize = new EventEmitter();
  @Input() evidenceDetails: Evidence;
  @Input() zoomLevel: 1 | 2 | 3 | 4 = 3;
  @Input() dataSourceTool?: DataSourceTool;
  @Input()
  get withCheckbox(): boolean { return this._withCheckbox; }
  set withCheckbox(value: boolean) {
    if (!!value && (this.evidenceDetails?.status === CustomerAcceptanceStatus.CustomerNew || this.evidenceDetails?.status === CustomerAcceptanceStatus.Ready)) {
      this._withCheckbox = true;
    }
    else {
      this._withCheckbox = false;
    }
  };
  @Output() selectedThumbnail = new EventEmitter<{ internalId: string, checked: boolean }>();
  @Output() selectedEvidence = new EventEmitter<string>();

  _withCheckbox: boolean = false;
  public evidenceUrls: string[];
  evidenceUrls$: Observable<string[]>;
  visible = false;
  thumbnailUrlSubject = new ReplaySubject<string>(1);
  thumbnailUrl: string;

  public loading: boolean;
  public loadingError: boolean;
  public isSVGFile = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private projectsService: ProjectsService,
    private networkRollOutService: NetworkRollOutService
  ) { }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  selectEvidence(evidenceId: string): void {
    this.selectedEvidence.emit(evidenceId);
  }

  selectThumbnail(event: Event, internalId: string): void {
    // check if the checkbox is checked
    if ((event.target as HTMLInputElement).checked) {
      this.selectedThumbnail.emit({ internalId, checked: true });
    } else {
      this.selectedThumbnail.emit({ internalId, checked: false });
    }

  }

  onVisible(evidenceId: string): void {
    if (this.evidenceDetails === undefined) return;
    this.visible = true;

    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loading = true;
        this.loadingError = false;
      })
    );

    if (this.evidenceDetails.type === 'Video') {
      this.thumbnailUrlSubject.next('assets/icons/video_file_icon.svg');
      this.isSVGFile = true;
    } else if (this.evidenceDetails.type === 'Archive') {
      this.thumbnailUrlSubject.next('assets/icons/zip_file_icon.svg');
      this.isSVGFile = true;
    } else if (this.evidenceDetails.type === 'Document') {
      const mimeType = this.evidenceDetails.fileMIMEType;
      if (mimeType === 'application/json') {
        this.thumbnailUrlSubject.next('assets/icons/json_file_icon.svg');
        this.isSVGFile = true;
      } else if (mimeType === 'application/pdf') {
        this.thumbnailUrlSubject.next('assets/icons/pdf_file_icon.png');
      } else if (mimeType.includes('text')) {
        this.thumbnailUrlSubject.next('assets/icons/txt_file_icon.svg');
        this.isSVGFile = true;
      } else if (mimeType.includes('word')) {
        this.thumbnailUrlSubject.next('assets/icons/word_file_icon.png');
      } else if (mimeType.includes('excel')) {
        this.thumbnailUrlSubject.next('assets/icons/excel_file_icon.png');
      }
      else {
        this.thumbnailUrlSubject.next('assets/icons/document_icon.svg');
        this.isSVGFile = true;
      }
    }

    if (this.evidenceDetails.type === 'Image') {
      this.isSVGFile = false;
      const processFile = (file: Blob): void => {
        const evidenceUrl = window.URL.createObjectURL(file);
        this.thumbnailUrlSubject.next(evidenceUrl);
      };

      if (this.dataSourceTool === DataSourceTool.nro) {
        this.subscription.add(this.networkRollOutService.getEvidenceThumbnail(evidenceId).pipe(
          take(1),
          tap(processFile),
        ).subscribe());
      }
      else {
        this.subscription.add(this.projectsService.getEvidenceThumbnail(evidenceId).pipe(
          take(1),
          tap(processFile),
        ).subscribe());
      }
    }

    this.subscription.add(loadingStartFlagging.pipe(
      exhaustMap(() => this.thumbnailUrlSubject),
    ).pipe(
      tap(() => {
        this.loading = false;
        this.loadingError = false;
      }),
      catchError((err) => {
        this.loading = false;
        this.loadingError = true;
        return undefined;
      }),
    ).subscribe(
      (url) => this.thumbnailUrl = url as string)
    );
  }

  public getStatusColor(evidence: Evidence): string {
    return AcceptancePackageUtils.getStatusColor(this.getStatusCode(evidence));
  }

  public getStatus(evidence: Evidence): string {
    return AcceptancePackageUtils.getStatus(this.getStatusCode(evidence));
  }

  private getStatusCode(evidence: Evidence): string {
    if (!evidence) return 'unknown';
    return evidence.status;
  }

  onMaximize(evidenceId: string): void {
    this.maximizeScreen.emit(evidenceId);
  }
}
