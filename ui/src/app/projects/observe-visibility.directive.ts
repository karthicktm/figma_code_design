import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { delay, filter } from 'rxjs/operators';
import { ThumbnailOptions } from './projects.interface';
// The template will be provided by the extending component.
// The extending component needs use the appObserveVisibility directive on the wrapper as below
/**
 *  ``` <div
    appObserveVisibility
    [debounceTime]="300"
    (visible)="onVisible($event)"
    [id]="item.id">
    <!-- display image here -->
  </div>``` */

@Directive({
  selector: '[appObserveVisibility]',
})
export class ObserveVisibilityDirective
  implements OnDestroy, OnInit, AfterViewInit {
  //minimum time for which the element has to be visible
  @Input() debounceTime = 0;
  // the threshold property indicates at what percentage the callback should be executed. By default, right away.
  @Input() threshold = 1;
  // output to notify the parent when an element is visible
  @Output() visible = new EventEmitter<HTMLElement>();

  private observer: IntersectionObserver | undefined;
  private messageEmitter = new Subject<{
    entry: IntersectionObserverEntry;
    observer: IntersectionObserver;
  } | void>();

  constructor(private element: ElementRef) {}

  ngOnInit(): void {
    this.createObserver();
  }

  ngAfterViewInit(): void {
    this.startObservingElements();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }

    this.messageEmitter.next();
    this.messageEmitter.complete();
  }

  private isVisible(element: HTMLElement) : Promise<boolean> {
    return new Promise(resolve => {
      const observer = new IntersectionObserver(([entry]) => {
        resolve(entry.intersectionRatio > 0);
        observer.disconnect();
      });

      observer.observe(element);
    });
  }

  private createObserver() : void {
    const options : ThumbnailOptions = {
      rootMargin: '0px',
      threshold: this.threshold,
    };
    const isIntersecting = (entry: IntersectionObserverEntry): boolean =>
      entry.isIntersecting || entry.intersectionRatio > 0;

    this.observer = new IntersectionObserver((entries, observer) => {
      // only one entry is observed each time
      if (isIntersecting(entries[0])) {
        this.messageEmitter.next({ entry: entries[0], observer });
      }
    }, options);
  }

  private startObservingElements(): void{
    if (!this.observer) {
      return;
    }

    this.observer.observe(this.element.nativeElement);

    this.messageEmitter
      .pipe(delay(this.debounceTime), filter(Object))
      .subscribe(async ({ entry, observer }) => {
        const target = entry.target as HTMLElement;
        const isStillVisible = await this.isVisible(target);

        if (isStillVisible) {
          this.visible.emit(target);
          observer.unobserve(target);
        }
      });
  }
}
