import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RectMarker } from './markable.directive';

enum ButtonsDisplayingMode {
  // don't show buttons
  None = 'none',
  // show fullscreen toggle
  Fullscreen = 'fullscreen',
  // show navigation buttons
  Navigation = 'navigation',
  // show all buttons
  All = 'all',
}

export enum ZoomEvents {
  In = 'in',
  Out = 'out',
};

/***
  * The component is capable of image download (in case when an image is not URL encoded), zoom
  * and drag (within the component) handling and has a fullscreen mode. On every new image,
  * the component simulates `object-fit: cover` behavior and centers an image. One can drag
  * an image to see its cropped parts in a whatever zoom level.
  *
  * Usage example
  *
  *  • in template:
  * ```html
  *        <app-image-viewer buttons="all"
  *                          [evidenceUrls]="evidenceUrls"
  *                          [selected]="selectedEvidence"
  *                          [alt]="imgDescription"
  *                          [zoom]="zoomEvents">
  *        </app-image-viewer>
  * ```
  *
  *  • in styles, the components width and height must be set:
  * ```less
  *        app-image-viewer {
  *          width: 42%;
  *          height: 24%;
  *        }
  * ```
  */
@Component({
  selector: 'app-image-file-preview',
  templateUrl: './image-file-preview.component.html',
  styleUrls: ['./image-file-preview.component.less']
})
export class ImageFilePreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() buttons: ButtonsDisplayingMode = ButtonsDisplayingMode.None;
  // an array of URL encoded images or URLs to images
  @Input() evidenceUrls: Array<string> = [];
  @Input() public evidenceUrl: string = '';

  @Input() alt: string;

  // set a selected image number
  @Input() public selected?: string;

  @Input() public offsetWidth?: number;
  @Input() public offsetHeight?: number;

  //optional zoom observable to listen to `zoom in` and `zoom out` events
  @Input() public zoom?: Observable<ZoomEvents>;

  @Input() public markings?: RectMarker[];
  @Input() public edit?: boolean;
  @Output() public markingsChange: EventEmitter<RectMarker[]> = new EventEmitter();

  @Output() public download: EventEmitter<void> = new EventEmitter();

  // left and right arrow icon references to access their class lists
  // to toggle `disabled` class when a selected image is the first or the last one
  @ViewChild('iconArrowLeft', { read: ElementRef, static: false }) readonly iconArrowLeft: ElementRef;
  iconArrowLeftClassList: ElementRef['nativeElement']['classList'];

  @ViewChild('iconArrowRight', { read: ElementRef, static: false }) readonly iconArrowRight: ElementRef;
  iconArrowRightClassList: ElementRef['nativeElement']['classList'];

  // fullscreen wrapper reference
  @ViewChild('fullscreenWrapper', { read: ElementRef, static: false }) readonly fullscreenWrapper: ElementRef;


  private img: HTMLImageElement;
  viewBox: string;
  observer: ResizeObserver;


  @ViewChild('img') set imgRef(img: ElementRef<HTMLImageElement>) {
    if (img) this.img = img.nativeElement;
  }

  // index of selected image
  selectedEvidence = 0;
  // the lowest zoom value in percent
  private readonly MIN_ZOOM_PERCENT = 100;
  // the highest zoom value in percent
  private readonly MAX_ZOOM_PERCENT = 400;
  // the first zoom level is MIN_ZOOM_PERCENT and is default. The last one is
  // MAX_ZOOM_PERCENT, so there is NUMBER_OF_ZOOM_LEVELS - 1 steps between these two states
  private readonly NUMBER_OF_ZOOM_LEVELS = 4;
  // how much percent to add or subtract for one zoom level
  private readonly ZOOM_LEVEL_PERCENT = (this.MAX_ZOOM_PERCENT - this.MIN_ZOOM_PERCENT)
    / (this.NUMBER_OF_ZOOM_LEVELS - 1);
  // how much to add or subtract for one zoom level
  private readonly ZOOM_STEP_VALUE = this.ZOOM_LEVEL_PERCENT / this.MIN_ZOOM_PERCENT;

  isLoaded = false;
  isFullscreenMode = false;
  areNavigationButtonsDisplayed: boolean;

  private isClickStarted = false;
  private isDraggingStarted = false;
  private dragCoordinates: { previousX: number; previousY: number };

  private imgTransformState = {
    translateX: 0,
    translateY: 0,
    scale: 1,
  };
  private DEFAULT_IMG_STYLES = {
    'display': 'none',
    'width': 'unset',
    'height': 'unset',
    'transform': 'none',
    'transition': 'transform .1s',
  };
  imgStyles = this.DEFAULT_IMG_STYLES;

  private readonly DEFAULT_BUTTON_STYLES = {
    'display': 'none',
    'cursor': 'pointer',
  }
  fullscreenToggleStyles = this.DEFAULT_BUTTON_STYLES;
  navigationButtonsStyles = this.DEFAULT_BUTTON_STYLES;

  private readonly destroy = new Subject<boolean>();

  constructor(private ref: ElementRef<HTMLElement>) { }

  ngOnInit(): void {
    if (this.zoom) {
      this.zoom.pipe(takeUntil(this.destroy)).subscribe({
        next: (event: ZoomEvents) => event === ZoomEvents.In ? this.onZoomIn() : this.onZoomOut(),
      });
    }
  }

  ngAfterViewInit(): void {
    this.iconArrowRightClassList = this.iconArrowRight?.nativeElement.classList;
    this.iconArrowLeftClassList = this.iconArrowLeft?.nativeElement.classList;

    // // if a current image is the first one, disable the button to a previous one
    // if (this.selectedEvidence === 0) {
    //   this.iconArrowLeftClassList.add('icon-disabled');
    // }

    // // if a current image is the last one, disable the button to a next one
    // if (this.selectedEvidence === this.evidenceUrls.length - 1) {
    //   this.iconArrowRightClassList.add('icon-disabled');
    // }

    this.observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (width > 0) {
        this.offsetWidth = this.ref?.nativeElement?.parentElement?.offsetWidth;
        this.offsetHeight = this.ref?.nativeElement?.parentElement?.offsetHeight;
        this.resetImageAttributes(this.img)
      }
    });

    this.observer.observe(this.ref?.nativeElement);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.unsubscribe();
    this.observer?.unobserve(this.ref.nativeElement);
  }

  onToggleFullscreenMode(): void {
    this.isFullscreenMode = !this.isFullscreenMode;
  }

  @HostListener('window:resize')
  onLoad({ target }: Event = <Event><unknown>{ target: this.img }): void {
    // reset an image styles
    this.resetImageAttributes(target);
    this.isLoaded = true;

    this.setButtonsStyles();
  }

  private resetImageAttributes(target: EventTarget | HTMLImageElement): void {
    this.imgStyles = this.DEFAULT_IMG_STYLES;

    // simulate `object-fit: scale-down`
    // determine which image dimension is the bigger one
    const { naturalWidth, naturalHeight } = <HTMLImageElement>target;
    this.viewBox = `0,0,${naturalWidth},${naturalHeight}`;
    const isImgWidthBigger = naturalWidth > naturalHeight;

    if (isImgWidthBigger) {
      // if an image width is bigger than the height, set the width equal to
      // a component width
      this.imgStyles = {
        ...this.imgStyles,
        'width': `${this.offsetWidth}px`,
      };
      if (naturalHeight > this.offsetHeight) {
        this.imgStyles = {
          ...this.imgStyles,
          'height': `${this.offsetHeight}px`,
        };
      }
    } else {
      // if an image height is bigger than the width, set the height equal to
      // a component height
      this.imgStyles = {
        ...this.imgStyles,
        'height': `${this.offsetHeight}px`,
      };
      if (naturalWidth > this.offsetWidth) {
        this.imgStyles = {
          ...this.imgStyles,
          'width': `${this.offsetWidth}px`,
        };
      }
    }

    this.imgStyles = {
      ...this.imgStyles,
      'display': 'block',
    };
  }

  onFullscreenLoad({ target }: Event): void {
    // reset an image styles
    this.imgStyles = this.DEFAULT_IMG_STYLES;

    // simulate `object-fit: contain`
    // determine which image dimension is the bigger one
    const { naturalWidth, naturalHeight } = <HTMLImageElement>target;
    const isImgWidthBigger = naturalWidth > naturalHeight;

    if (isImgWidthBigger) {
      // if an image width is bigger than the height, set the width equal to
      // a component width
      const { offsetWidth } = this.fullscreenWrapper.nativeElement;
      this.imgStyles = {
        ...this.imgStyles,
        'width': `${offsetWidth}px`,
      };
    } else {
      // if an image height is bigger than the width, set the height equal to
      // a component height
      const { offsetHeight } = this.fullscreenWrapper.nativeElement;
      this.imgStyles = {
        ...this.imgStyles,
        'height': `${offsetHeight}px`,
      };
    }

    this.imgStyles = {
      ...this.imgStyles,
      'display': 'block',
    };
  }

  onNextImg(): void {
    // if a current image is the last one, do nothing
    if (this.selectedEvidence === this.evidenceUrls.length - 1) return;

    // if a current image is the first one, enable the button to a previous one
    if (this.selectedEvidence === 0) {
      this.iconArrowLeftClassList.remove('icon-disabled');
    }

    this.onImgChange();

    this.selectedEvidence++;

    // if a new current image is the last one, disable the button to a next one
    if (this.selectedEvidence === this.evidenceUrls.length - 1) {
      this.iconArrowRightClassList.add('icon-disabled');
    }
  }

  onPreviousImg(): void {
    // if a current image is the first one, do nothing
    if (this.selectedEvidence === 0) return;

    // if a current image is the last one, enable the button to a next one
    if (this.selectedEvidence === this.evidenceUrls.length - 1) {
      this.iconArrowRightClassList.remove('icon-disabled');
    }

    this.onImgChange();

    this.selectedEvidence--;

    // if a new current image is the first one, disable the button to a previous one
    if (this.selectedEvidence === 0) {
      this.iconArrowLeftClassList.add('icon-disabled');
    }
  }

  onImgChange(): void {
    // reset zoom
    this.imgTransformState.scale = 1;
    this.imgStyles = {
      ...this.imgStyles,
      'display': 'none',
    };
  }

  // not using native drag event because it's not suitable for this purpose
  onImgEvent(event: MouseEvent | TouchEvent): void {
    if (this.edit) return;
    event.preventDefault();

    switch (event.type) {
      case 'mousedown':
      case 'touchstart':
        return this.onMoveStart(event as MouseEvent);
      case 'mousemove':
      case 'touchmove':
        return this.onMove(event as MouseEvent);
      case 'mouseup':
      case 'touchend':
        return this.onMoveEnd();
      case 'mouseleave':
      case 'touchcancel':
        return this.onMoveCancel(event as MouseEvent);
    }
  }

  onMoveStart(event: MouseEvent): void {
    this.isClickStarted = true;
    this.isDraggingStarted = true;
    this.dragCoordinates = {
      previousX: event.clientX,
      previousY: event.clientY,
    };
    this.setButtonsStyles();
  }

  onMove({ target, clientX, clientY }: MouseEvent): void {
    this.isClickStarted = false;

    if (!this.isDraggingStarted || this.imgTransformState.scale === 1) return;

    const {
      width: width1,
      height: height1,
    } = (target as HTMLElement).getBoundingClientRect();
    const {
      width: width2,
      height: height2,
    } = this.isFullscreenMode
        ? this.fullscreenWrapper.nativeElement.getBoundingClientRect()
        : this.ref.nativeElement.getBoundingClientRect();

    const { previousX, previousY } = this.dragCoordinates;
    this.dragCoordinates.previousX = clientX;
    this.dragCoordinates.previousY = clientY;

    // determine acceleration coefficient for every dimension
    const dragStepMultiplier = 4;
    const horizontalDragStepSize = (this.isFullscreenMode ? width2 / width1 : width1 / width2) * dragStepMultiplier;
    const verticalDragStepSize = (this.isFullscreenMode ? height2 / height1 : height1 / height2) * dragStepMultiplier;

    if (clientX - previousX > 0) {
      this.imgTransformState.translateX += horizontalDragStepSize;
    }

    if (clientX - previousX < 0) {
      this.imgTransformState.translateX -= horizontalDragStepSize;
    }

    if (clientY - previousY > 0) {
      this.imgTransformState.translateY += verticalDragStepSize;
    }

    if (clientY - previousY < 0) {
      this.imgTransformState.translateY -= verticalDragStepSize;
    }

    if (this.isFullscreenMode) return this.setImgTransformValue();

    // determine maximum possible offsets for each of dimensions
    const maxXOffset = (width1 - width2) / 2;
    const maxYOffset = (height1 - height2) / 2;

    // prevent an image to be dragged over its edges
    if (this.imgTransformState.translateY > maxYOffset) {
      this.imgTransformState.translateY = maxYOffset;
    }

    if (this.imgTransformState.translateX < -maxXOffset) {
      this.imgTransformState.translateX = -maxXOffset;
    }

    if (this.imgTransformState.translateY < -maxYOffset) {
      this.imgTransformState.translateY = -maxYOffset;
    }

    if (this.imgTransformState.translateX > maxXOffset) {
      this.imgTransformState.translateX = maxXOffset;
    }

    this.setImgTransformValue();
  }

  onMoveEnd(): void {
    // disable toggling to full screen via mouse click on image
    // if (this.isClickStarted) this.onToggleFullscreenMode();
    this.isClickStarted = false;
    this.isDraggingStarted = false;
    this.setButtonsStyles();
  }

  onMoveCancel({ clientX, clientY }: MouseEvent): void {
    const { top, right, bottom, left } = this.ref.nativeElement.getBoundingClientRect();
    // drag is ended only if cursor is out of the component edges so moving cursor over
    // buttons doesn't stop drag
    if (top >= clientY || bottom <= clientY || right <= clientX || left >= clientX) {
      this.isDraggingStarted = false;
      this.setButtonsStyles();
    }
  }

  setButtonsStyles(): void {
    const cursorStyle = this.isDraggingStarted ? 'move' : 'pointer';

    this.fullscreenToggleStyles = {
      'display': this.isFullscreenToggleDisplayed() ? 'block' : 'none',
      'cursor': cursorStyle,
    };

    this.navigationButtonsStyles = {
      'display': this.isNavigationButtonsDisplayed() ? 'block' : 'none',
      'cursor': cursorStyle,
    };
  }

  isFullscreenToggleDisplayed(): boolean {
    return (this.buttons === ButtonsDisplayingMode.All
             || this.buttons === ButtonsDisplayingMode.Fullscreen)
           && this.isLoaded;
  }

  isNavigationButtonsDisplayed(): boolean {
    return (this.buttons === ButtonsDisplayingMode.All
             || this.buttons === ButtonsDisplayingMode.Navigation)
           && this.evidenceUrls.length > 1
           && this.isLoaded;
  }

  onZoomIn(): void {
    if (this.imgTransformState.scale >= this.MAX_ZOOM_PERCENT / this.MIN_ZOOM_PERCENT) return;

    this.imgTransformState.scale += this.ZOOM_STEP_VALUE;
    this.setImgTransformValue();
  }

  onZoomOut(): void {
    if (this.imgTransformState.scale <= 1) {
      this.resetImageAttributes(this.img);
      return
    };

    this.imgTransformState.scale -= this.ZOOM_STEP_VALUE;
    this.setImgTransformValue();
  }

  setImgTransformValue(): void {
    const { translateX, translateY, scale } = this.imgTransformState;
    this.imgStyles = {
      ...this.imgStyles,
      'transform': `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
    };
  }

  onDownload(event: Event): void {
    this.download.next();
  }

}
