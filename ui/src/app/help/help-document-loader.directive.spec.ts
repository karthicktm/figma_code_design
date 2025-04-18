import { TestBed } from '@angular/core/testing';
import { HelpDocumentLoaderDirective } from './help-document-loader.directive';
import { HelpService } from './help.service';

describe('HelpDocumentLoaderDirective', () => {
  let directive: HelpDocumentLoaderDirective;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ElementRef', ['focus']);
    TestBed.configureTestingModule({
      providers: [
        HelpDocumentLoaderDirective,
        { provide: HelpService, useValue: {} },
      ],
    });
    // Inject both the service-to-test and its (spy) dependency
    directive = TestBed.inject(HelpDocumentLoaderDirective);
    TestBed.inject(HelpService);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
