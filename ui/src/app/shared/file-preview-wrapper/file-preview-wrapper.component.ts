import {
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { EvidenceDetails } from 'src/app/projects/projects.interface';
import { FilePreviewService } from './file-preview.service';
import { ImageFilePreviewComponent } from './image-file-preview/image-file-preview.component';
import { ObjectFilePreviewComponent } from './object-file-preview/object-file-preview.component';
import { VideoFilePreviewComponent } from './video-file-preview/video-file-preview.component';
import { VideoFileStreamingPreviewComponent } from './video-file-streaming-preview/video-file-streaming-preview.component';
import { RectMarker } from './image-file-preview/markable.directive';

export enum ZoomEvents {
  In = 'in',
  Out = 'out',
};

export enum MimeTypes {
  Text = 'text/plain',
  Json = 'application/json',
  PDF = 'application/pdf',
  Image = 'image/',
  Video = 'video/',
  VideoMP4 = 'video/mp4',
}

@Component({
  selector: 'app-file-preview-wrapper',
  templateUrl: './file-preview-wrapper.component.html',
  styleUrls: ['./file-preview-wrapper.component.less'],
})
export class FilePreviewWrapperComponent implements OnInit, OnDestroy {

  @ViewChild('viewContainer', {read: ViewContainerRef, static: true})
  public viewContainer!: ViewContainerRef;

  @Input() readonly zoom?: Observable<ZoomEvents>;

  @Output() readonly download: EventEmitter<void> = new EventEmitter();
  isLoaded = false;
  validMimeType = true;
  isFullscreenMode = false;
  areNavigationButtonsDisplayed: boolean;
  dataURI: string = null;
  fileName: string = null;

  evidenceMappingFns = {
    mimeType: (evidence: EvidenceDetails): string => evidence.fileMIMEType,
    name: (evidence: EvidenceDetails): string => evidence.name,
  };

  private subscriptions = new Subscription();

  markings: RectMarker[];
  @Output() readonly markingsChange: EventEmitter<RectMarker[]> = new EventEmitter();
  edit: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private ref: ElementRef<FilePreviewWrapperComponent & HTMLElement>,
    private filePreviewService: FilePreviewService
  ) { }

  ngOnInit(): void {

    this.subscriptions.add(
      this.filePreviewService.loading.subscribe(loading => {
        this.isLoaded = !loading;
      })
    );

    let component: ComponentRef<ImageFilePreviewComponent | ObjectFilePreviewComponent | VideoFileStreamingPreviewComponent | VideoFilePreviewComponent | any>;

    this.subscriptions.add(

      this.filePreviewService.filePreview.subscribe(x => {
        this.viewContainer.clear();
        this.fileName = x.name;
        this.dataURI = x.dataURI;
        this.markings = x.markings;
        if(!x.mimeType){
          this.validMimeType = false;
          return;
        }
        if(x.mimeType.startsWith(MimeTypes.Image)){
          component = this.viewContainer.createComponent(ImageFilePreviewComponent);
          component.setInput('buttons', 'none');
          component.setInput('alt', x.name ? x.name : '--');
          component.setInput('zoom', this.zoom);
          component.instance.download = this.download;
          component.setInput('markings', this.markings);
          component.instance.markingsChange = this.markingsChange;
          this.edit.subscribe(edit => component.setInput('edit', edit));
        }
        else if(x.mimeType.startsWith(MimeTypes.Text) ||
        x.mimeType.startsWith(MimeTypes.Json) ||
        x.mimeType.startsWith(MimeTypes.PDF)){
            component = this.viewContainer.createComponent(ObjectFilePreviewComponent);
            component.setInput('type', x.mimeType);
        }
        else if( x.mimeType.startsWith(MimeTypes.VideoMP4) && !x.dataURI.startsWith('data:') && !x.dataURI.startsWith('blob:')){
          component = this.viewContainer.createComponent(VideoFileStreamingPreviewComponent);
          component.setInput('type', x.mimeType);
        }
        else if( x.mimeType.startsWith(MimeTypes.Video)){
          component = this.viewContainer.createComponent(VideoFilePreviewComponent);
          component.setInput('type', x.mimeType);
        }
        else {
          this.validMimeType = false;
          return;
        }
        component.instance.evidenceUrl = x.dataURI;
        component.instance.offsetWidth = this.ref.nativeElement.offsetWidth;
        component.instance.offsetHeight = this.ref.nativeElement.offsetHeight;
        this.validMimeType = true;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  downLoadFile(event): void {
    this.filePreviewService.filePreview.pipe(
      take(1),
      tap((filePreview) => {
        const link = document.createElement('a')
        link.href = filePreview.dataURI;
        link.download = filePreview.name;
        link.dispatchEvent(new MouseEvent('click'));
      }),
    ).subscribe();
  }
  onDownload(event: Event): void {
    this.download.next();
  }
}
