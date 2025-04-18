import { Directive, HostListener, Input } from '@angular/core';
import { throwError } from 'rxjs';
import { tap, takeWhile, catchError } from 'rxjs/operators';
import { HelpDocumentType, HelpService } from './help.service';

@Directive({
  selector: '[appHelpDocumentLoader]'
})
export class HelpDocumentLoaderDirective {
  @Input() readonly appHelpDocumentLoader: HelpDocumentType = HelpDocumentType.UserGuide
  constructor(
    private helpService: HelpService,
  ) { }

  @HostListener('click', ['$event']) onClick(event): void {
    const element: HTMLAnchorElement = event.target;
    event.stopPropagation();
    if (!element?.href?.startsWith('blob:')) {
      event.preventDefault();
      this.helpService.getDocumentUrl(this.appHelpDocumentLoader).pipe(
        tap((documentState) => {
          const { dataUrl, isLoading } = documentState;
          isLoading ? element.classList.add('loading') : element.classList.remove('loading');
          if (dataUrl && dataUrl.startsWith('blob:')) {
            element.href = dataUrl;
            element.click();
          }
        }),
        takeWhile((documentState) => !documentState.dataUrl, true),
        catchError((error) => {
          element.classList.remove('loading');
          return throwError(() => error);
        }),
      ).subscribe();
    }
  }
}
