import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { DialogService } from '../portal/services/dialog.service';
import { FeedbackDialogComponent } from '../feedback-dialog/feedback-dialog.component';
import { ProjectsService } from '../projects/projects.service';
import { NotificationService } from '../portal/services/notification.service';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { UserSession } from '../projects/projects.interface';

@Directive({
  standalone: true,
  selector: '[appFeedbackDialog]'
})
export class FeedbackLoaderDirective implements OnInit {
  userSession: UserSession;
  constructor(
    private dialogService: DialogService,
    private projectService: ProjectsService,
    private notificationService: NotificationService,
    private elemRef: ElementRef<HTMLAnchorElement>,
  ) { }
  ngOnInit(): void {
    this.projectService.getUserSession().subscribe({
      next: (userSession: UserSession) => {
        this.userSession = userSession;
      }
    }
    )
    this.removeUnderline();
  }

  @HostListener('click', ['$event']) onClick(event): void {
    this.openFeedbackDialog();
  }

  // remove underline in hyper link
  private removeUnderline(): void {
    this.elemRef.nativeElement.style.textDecoration = 'none'
  }

  openFeedbackDialog(): void {
    const dialog = this.dialogService.createDialog(FeedbackDialogComponent);
    dialog.instance.dialogResult.subscribe((resultData) => {
      this.projectService.submitFeedback({
        userId: this.userSession.signum,
        message: resultData.toImproveMessage,
      }).subscribe({
        next: () => {
          this.notificationService.showLogNotification({
            title: 'Thank you for your feedback!',
            description: 'We are always striving to improve based on feedback like yours. Feel free to contact us using the NRO acceptance Teams channel.'
          });
          dialog.instance.dialog.hide();
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            this.notificationService.showNotification({
              title: 'Error when sending feedback!',
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            });
          }
          else {
            this.notificationService.showNotification({
              title: 'Error when sending feedback!',
              description: 'Click to open the FAQ doc for further steps.'
            }, true);
          }
        },
      });
    });
  }
}
