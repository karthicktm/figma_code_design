import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-video-file-preview',
  templateUrl: './video-file-preview.component.html',
  styleUrls: ['./video-file-preview.component.less']
})
export class VideoFilePreviewComponent implements AfterViewInit{
  @Input() public offsetWidth?: number;
  @Input() public offsetHeight?: number;
  @Input() public evidenceUrl: string = '';
  @Input() public type: string = '';


  private video: HTMLVideoElement;
  private DEFAULT_IMG_STYLES = {
    'display': 'none',
    'width': 'unset',
    'height': 'unset',
    'transform': 'none',
    'transition': 'transform .1s',
  };
  imgStyles = this.DEFAULT_IMG_STYLES;


  @ViewChild('videoPlayer') set videoRef(video: ElementRef) {
    if (video) this.video = video.nativeElement;
  }

  ngAfterViewInit(): void {
    this.video.addEventListener('loadeddata', () => {
      if(this.video.HAVE_METADATA > 0){
        this.imgStyles = this.DEFAULT_IMG_STYLES;

        const { videoWidth, videoHeight } = <HTMLVideoElement>this.video;
        const isImgWidthBigger = videoWidth > videoHeight;

        if (isImgWidthBigger) {
          this.imgStyles = {
            ...this.imgStyles,
            'width': `${this.offsetWidth}px`,
          };
          if(videoHeight > this.offsetHeight) {
            this.imgStyles = {
              ...this.imgStyles,
              'height': `${this.offsetHeight}px`,
            }
          }
        } else {
          this.imgStyles = {
            ...this.imgStyles,
            'height': `${this.offsetHeight}px`,
          };
          if(videoHeight > this.offsetWidth) {
            this.imgStyles = {
              ...this.imgStyles,
              'width': `${this.offsetWidth}px`,
            }
          }
        }

        this.imgStyles = {
          ...this.imgStyles,
          'display': 'block',
        };
      }
    })
  }

}
