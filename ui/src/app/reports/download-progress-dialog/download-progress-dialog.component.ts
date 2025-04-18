import { Component, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

export enum Status {
  inProgress = 'loading',
  completed = 'success',
  failed = 'failed',
}
@Component({
  selector: 'app-download-progress-dialog',
  templateUrl: './download-progress-dialog.component.html',
  styleUrls: ['./download-progress-dialog.component.less']
})
export class DownloadProgressDialogComponent extends EDSDialogComponent {

  constructor(
    @Inject(DIALOG_DATA) public inputData: { status: Observable<Status> },
  ) {
    super();
  }

}
