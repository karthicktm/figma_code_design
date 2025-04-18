import { Component, Inject } from '@angular/core';
import { HelpDocumentType } from '../help/help.service';
import { DIALOG_DATA, EDSDialogComponent } from '../portal/services/dialog.service';

@Component({
  selector: 'app-warning-dialog',
  templateUrl: './warning-dialog.component.html',
  styleUrls: ['./warning-dialog.component.less']
})
export class WarningDialogComponent extends EDSDialogComponent {

  referenceDocType: string;
  referenceDocText: string;
  textBefore: string;
  textAfter: string;

  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      title: string,
      message: string,
      disableRefresh?: boolean,
      actionOn?: string,
      enableClose?: boolean
    },
  ) {
    super();
    if (inputData.actionOn) {
      const index = inputData.message.indexOf(inputData.actionOn);
      if (index !== -1) {
        this.textBefore = inputData.message.substring(0, index);
        this.textAfter = inputData.message.substring(index + inputData.actionOn.length);
        this.referenceDocType = inputData.actionOn;
        switch (inputData.actionOn) {
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
  }

  public refresh(): void {
    window.location.reload();
  }

  onClose(): void {
    this.dialog.hide();
  }

}



