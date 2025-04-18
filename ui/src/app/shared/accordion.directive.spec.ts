import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AccordionDirective } from './accordion.directive';

describe('AccordionDirective', () => {
  let directive: AccordionDirective;
  let elementRefSpy: jasmine.SpyObj<ElementRef>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ElementRef', ['focus']);
    TestBed.configureTestingModule({
      // Provide both the service-to-test and its (spy) dependency
      providers: [AccordionDirective, { provide: ElementRef, useValue: spy }],
    });
    // Inject both the service-to-test and its (spy) dependency
    directive = TestBed.inject(AccordionDirective);
    elementRefSpy = TestBed.inject(ElementRef) as jasmine.SpyObj<ElementRef>;
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
