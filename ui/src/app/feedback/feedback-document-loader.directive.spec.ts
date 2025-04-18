import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService } from '../portal/services/dialog.service';
import { NotificationService } from '../portal/services/notification.service';
import { ProjectsService } from '../projects/projects.service';
import { FeedbackLoaderDirective } from './feedback-document-loader.directive';

describe('FeedbackLoaderDirective', () => {
  let directive: FeedbackLoaderDirective;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ElementRef', ['focus']);
    TestBed.configureTestingModule({
      providers: [
        FeedbackLoaderDirective,
        { provide: DialogService, useValue: {} },
        { provide: ProjectsService, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: ElementRef<HTMLAnchorElement>, useValue: {} },
      ],
    });
    // Inject both the service-to-test and its (spy) dependency
    directive = TestBed.inject(FeedbackLoaderDirective);
    TestBed.inject(DialogService);
    TestBed.inject(ProjectsService);
    TestBed.inject(NotificationService);
    TestBed.inject(ElementRef<HTMLAnchorElement>);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
