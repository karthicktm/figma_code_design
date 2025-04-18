import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appAutofocus]'
})
export class AutofocusDirective implements AfterViewInit {

  constructor(private el: ElementRef) {
  }

  ngAfterViewInit(): void {
    const element: HTMLElement = this.el.nativeElement;
    const focusableContent = `a[href], area[href], button:not([disabled]),
      input:not([disabled]), select:not([disabled]), textarea:not([disabled]),
      iframe, object, embed, *[tabindex]:not([tabindex="-1"]), *[contenteditable]`;
    const focusElement: HTMLInputElement = element?.querySelector(focusableContent);
    // Required to get the focus as expected
    setTimeout(() =>
      focusElement.focus()
    );
  }

}
