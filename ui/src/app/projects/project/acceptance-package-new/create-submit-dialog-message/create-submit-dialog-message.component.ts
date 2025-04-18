import { Component, Inject, EventEmitter } from '@angular/core';
import { HelpDocumentType } from 'src/app/help/help.service';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';

import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-create-submit-dialog-message',
  templateUrl: './create-submit-dialog-message.component.html',
  styleUrls: ['./create-submit-dialog-message.component.less']
})
export class CreateSubmitDialogMessageComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<any> = new EventEmitter();
  public show: APICallStatus;
  public dialogueTitle: string;
  public statusMessage: string;
  public cAdditionalMessage: string;
  public sAdditionalMessage: string;
  public referenceType: ReplaySubject<string> = new ReplaySubject(1);
  public referenceDocType: string;
  public referenceDocText: string;
  public textBefore: string;
  public textAfter: string;
  public errorDetailList: string[];

  constructor(
    @Inject(DIALOG_DATA) public data: DialogData,
  ) {
    super();
    this.show = data.show;
    this.statusMessage = data.statusMessage;
    this.dialogueTitle = data.dialogueTitle;
    this.errorDetailList = data.errorDetailList;

    this.referenceType.subscribe(referenceType => {
      if (referenceType && this.show === APICallStatus.Error) {
        const index = this.statusMessage.indexOf(referenceType);
        if (index !== -1) {
          this.textBefore = this.statusMessage.substring(0, index);
          this.textAfter = this.statusMessage.substring(index + referenceType.length);
          this.referenceDocType = referenceType;
          switch (referenceType) {
            case HelpDocumentType.FAQ:
              this.referenceDocText = 'FAQ';
              break;
            case HelpDocumentType.UserGuide:
              this.referenceDocText = 'user guide';
              break;
            default:
              this.referenceDocType = undefined;
              this.referenceDocText = undefined;
              break;
          }
        }
      }
    })
  }

  onOk():void {
    this.dialog.hide();
    this.dialogResult.emit(true);
  }

}

