import { Component, EventEmitter, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

export interface DialogResult {
  confirmed: boolean,
  requestId?: string,
}

@Component({
  selector: 'app-delete-user-confirm-dialog',
  templateUrl: './delete-user-confirm-dialog.component.html',
  styleUrls: ['./delete-user-confirm-dialog.component.less']
})
export class DeleteUserConfirmDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<DialogResult> = new EventEmitter();

  message: string;
  userId: string;
  action: string;
  mySupportRequestId: string;

  constructor(
    @Inject(DIALOG_DATA) public inputData: { userId: string, action: string },
  ) {
    super();
    this.userId = inputData.userId;
    this.action = inputData.action;
    this.message = `Are you sure you want to ${this.action} the user?`;
  }

  public onSubmit(): void {
    this.dialogResult.emit({ confirmed: true, requestId: this.mySupportRequestId });
  }

  public onCancel(): void {
    this.dialogResult.emit({ confirmed: false });
  }

}
