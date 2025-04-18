import { TestBed } from '@angular/core/testing';
import { BackButtonDirective } from './back-button.directive';
import { NavigationService } from './navigation.service';

describe('BackButtonDirective', () => {
  let directive: BackButtonDirective;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('NavigationService', ['back']);
    TestBed.configureTestingModule({
      // Provide both the service-to-test and its (spy) dependency
      providers: [BackButtonDirective, { provide: NavigationService, useValue: spy }],
    });
    // Inject both the service-to-test and its (spy) dependency
    directive = TestBed.inject(BackButtonDirective);
    navigationServiceSpy = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
