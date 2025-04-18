import { TestBed } from '@angular/core/testing';
import { AutofocusDirective } from './autofocus.directive';
import { ElementRef } from '@angular/core';

describe('AutofocusDirective', () => {
  let directive: AutofocusDirective;
  let elementRefSpy: jasmine.SpyObj<ElementRef>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ElementRef', ['focus']);
    TestBed.configureTestingModule({
      // Provide both the service-to-test and its (spy) dependency
      providers: [AutofocusDirective, { provide: ElementRef, useValue: spy }],
    });
    // Inject both the service-to-test and its (spy) dependency
    directive = TestBed.inject(AutofocusDirective);
    elementRefSpy = TestBed.inject(ElementRef) as jasmine.SpyObj<ElementRef>;
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
