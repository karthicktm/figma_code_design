import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, ViewChild, WritableSignal } from '@angular/core';
import { EDSDialogComponent, DIALOG_DATA } from 'src/app/portal/services/dialog.service';

export interface RejectDlgData {
  loadingData: WritableSignal<boolean>;
}

@Component({
  selector: 'app-reject-certreq-dialog',
  templateUrl: './reject-dialog.component.html',
  styleUrls: ['./reject-dialog.component.less']
})
export class RejectCertReqDialogComponent extends EDSDialogComponent implements AfterViewInit {
  
  @ViewChild('certRejectedComment') input: ElementRef<HTMLTextAreaElement>;
  public dialogResult: EventEmitter<any> = new EventEmitter();
  
  constructor(
    @Inject(DIALOG_DATA) public inputData: RejectDlgData,
  ) {
    super();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.input?.nativeElement.focus();
  }

  /**
   * This sendRequest function is the submitHandler of the feedback form
   * @param certRejectedComment Feedback from user
   */
  sendRequest(certRejectedComment: string): void {
    this.dialogResult.emit({certRejectedComment});
  }

  onCancel(): void {
    this.dialog.hide();
  } 
}
