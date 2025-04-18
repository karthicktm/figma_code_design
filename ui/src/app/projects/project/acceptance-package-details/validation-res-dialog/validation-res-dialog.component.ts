import { Component, Inject, EventEmitter, Output } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { APICallStatus,DialogData, ProgressValues, ResultData } from 'src/app/shared/dialog-data.interface';

@Component({
  selector: 'app-create-submit-dialog-message',
  templateUrl: './validation-res-dialog.component.html',
  styleUrls: ['./validation-res-dialog.component.less']
})
export class ValidationResDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<any> = new EventEmitter();
  public show: APICallStatus;
  public statusMessage: string;
  public dialogTitle: string;
  public validationResult: string;
  public iconStatus:string;
  public bcDetailWho:string;
  public bcDetailWhat:string;
  public bcDetailWhen:string;
  constructor(
    @Inject(DIALOG_DATA) public data: DialogData,
  ) {
    super();
    this.dialogTitle = data.dialogueTitle;
  }

  onOk():void {
    this.dialog.hide();
    this.dialogResult.emit(true);
  }
}

