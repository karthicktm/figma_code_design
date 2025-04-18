import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.less']
})
export class MessageDialogComponent extends EDSDialogComponent {

  public isReload: boolean = true;
  constructor(
    @Inject(DIALOG_DATA) public inputData: {title: string, message:string, reload?: boolean},
  ) {
    super();
    this.isReload = inputData.reload!== undefined ? inputData.reload : true;
  }

  public okMessage(): void{
    this.dialog.hide();
  }

  public okMessageWithReload(): void{
    window.location.reload();
  }

}
