import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from '../portal/services/dialog.service';

@Component({
  selector: 'app-request-access-dialog',
  templateUrl: './request-access-dialog.component.html',
  styleUrls: ['./request-access-dialog.component.less']
})
export class RequestAccessDialogComponent extends EDSDialogComponent {

  constructor(
    @Inject(DIALOG_DATA) public data: any,
  ) {
    super();
  }

  sendRequest(message: string): void {
    console.error(`Not implemented sending request for permission '${this.data.permission}' with message "${message}"`);
  }

}
