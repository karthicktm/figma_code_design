import { Component, Inject, EventEmitter } from '@angular/core';
import { HelpDocumentType } from 'src/app/help/help.service';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { APICallStatus, DialogData, ProgressValues, ResultData } from '../dialog-data.interface';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-dialog-message',
  templateUrl: './dialog-message.component.html',
  styleUrls: ['./dialog-message.component.less']
})
export class DialogMessageComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<any> = new EventEmitter();
  public show: APICallStatus;
  public dialogueTitle: string;
  public statusMessage: string;
  public buttonText: string;
  public additionalMessage: string;
  public progressValues: ProgressValues;
  public iconStatus:string = 'icon-check';
  public results: ResultData[];
  public actionOn: ReplaySubject<string> = new ReplaySubject(1);
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
    this.buttonText = data.buttonText;
    this.errorDetailList = data.errorDetailList;

    this.actionOn.subscribe(actionOn => {
      if (actionOn && this.show === APICallStatus.Error){
        const index = this.statusMessage.indexOf(actionOn);
      if (index !== -1) {
        this.textBefore = this.statusMessage.substring(0, index);
        this.textAfter = this.statusMessage.substring(index + actionOn.length);
        this.referenceDocType = actionOn;
        switch (actionOn) {
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
  closeDialog():void{
    this.dialog.hide();
  }
}

