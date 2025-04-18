import { HttpEventType } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { Subscription, throwError } from 'rxjs';
import { FilePreviewService } from '../file-preview.service';

@Component({
  selector: 'app-video-file-streaming-preview',
  templateUrl: './video-file-streaming-preview.component.html',
  styleUrls: ['./video-file-streaming-preview.component.less']
})
export class VideoFileStreamingPreviewComponent implements AfterViewInit, OnDestroy {
  @Input() public offsetWidth?: Number;
  @Input() public offsetHeight?: Number;
  @Input() public evidenceUrl: string = '';
  @Input() public type: string = '';

  @ViewChild('videoPlayer') set videoRef(video: ElementRef) {
    if (video) this.video = video.nativeElement;
  }
  private video: HTMLVideoElement;

  private subscriptions = new Subscription();
  constructor(
    private filePreviewService: FilePreviewService,
  ) { }

  ngAfterViewInit(): void {
    const video = this.video;

    const assetURL = this.evidenceUrl;
    const mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

    if (assetURL.startsWith('https://')) {
      video.src = assetURL;
    } else if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
      const mediaSource = new MediaSource();
      video.src = URL.createObjectURL(mediaSource);
      const sourceOpen = (): void => {
        const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);

        const fileRetriever = this.filePreviewService.getFile(assetURL).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.Response) {
              const contentRange = event.headers.get('content-range');
              const fileSize = Number.parseInt(contentRange.substring(contentRange.indexOf('/') + 1));
              const chunkEnd = Number.parseInt(
                contentRange.substring(contentRange.indexOf('-') + 1, contentRange.indexOf('/'))
              );
              sourceBuffer.addEventListener('updateend', () => {
                if (fileSize -1 <= chunkEnd) {
                  mediaSource.endOfStream();
                }
              });
              sourceBuffer.appendBuffer(event.body);
            }
          },
          error: (err) => {
            throwError(err);
          },
        });
        this.subscriptions.add(fileRetriever);
      };
      mediaSource.addEventListener('sourceopen', sourceOpen);

    } else {
      console.error('Unsupported MIME type or codec: ', mimeCodec);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
