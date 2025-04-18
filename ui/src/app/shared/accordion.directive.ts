import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';
import { Accordion } from '@eds/vanilla';

@Directive({
  selector: '[appAccordion]'
})
export class AccordionDirective implements AfterViewInit, OnDestroy {
  accordion: Accordion;
  scripts: Scripts[] = [];
  constructor(
    private ref: ElementRef,
  ) { }

  ngAfterViewInit(): void {
    const accordionDOM = this.ref.nativeElement;
    if (accordionDOM) {
      const accordion = new Accordion(accordionDOM as HTMLElement);
      accordion.init();
      this.accordion = accordion;
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((s) => s.destroy());
  }
}
