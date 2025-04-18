import { HttpStatusCode } from '@angular/common/http';
import { Component, EventEmitter, Inject } from '@angular/core';
import { DialogService, DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';

@Component({
  selector: 'app-abandon-acceptance-package-dialog',
  templateUrl: './abandon-acceptance-package-dialog.component.html',
  styleUrls: ['./abandon-acceptance-package-dialog.component.less'],
})
export class AbandonAcceptancePackageDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<boolean> = new EventEmitter();

  message = 'Are you sure you want to abandon the package?';

  constructor(
    private projectService : ProjectsService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    @Inject(DIALOG_DATA) public data: { packageLinearId: string },
  ) {
    super();
  }

  public delete(): void {
   this.projectService.deletePackage(this.data.packageLinearId).subscribe({
    next: () => {
      this.dialogResult.emit(true)
      this.notificationService.showNotification({
        title: 'Deleted package successfully!',
      });
    },
    error: (error) => {
      const dialogData: DialogData = {
        dialogueTitle: 'Unable to delete package',
        show:  APICallStatus.Error,
      };
      const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
      let additionalMessage = '';
      if (error.status === HttpStatusCode.BadGateway || error.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
        additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
      } else {
        additionalMessage = '\n Please follow the FAQ doc for further steps.';
      }
      dialogMessage.instance.statusMessage = 'Error when deleting the package!' + additionalMessage;
      dialogMessage.instance.additionalMessage = '';
      dialogMessage.instance.actionOn.next('FAQ');
    }
   })
  }
}
