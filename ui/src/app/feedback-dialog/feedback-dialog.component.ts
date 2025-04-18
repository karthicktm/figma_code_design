import { Component, EventEmitter } from '@angular/core';
import { EDSDialogComponent } from '../portal/services/dialog.service';

@Component({
  selector: 'app-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.less']
})
export class FeedbackDialogComponent extends EDSDialogComponent {

  public dialogResult: EventEmitter<any> = new EventEmitter();
  submitButtonDisabled = true;
  private inputCounter: { [key: string]: number } = {};    

  /**
   * This onkey function is for the text area of Feedback form
   * @param element Reference for html textarea field
   */

  onKey(element: HTMLTextAreaElement): void {
    this.inputCounter[element.id] = element.value.length;
    const someCharInput = Object.keys(this.inputCounter).find((key) => this.inputCounter[key] > 0);
    someCharInput
      ? this.submitButtonDisabled = false
      : this.submitButtonDisabled = true;
  }

  /**
   * This sendRequest function is the submitHandler of the feedback form
   * @param toImproveMessage Feedback from user
   */
  sendRequest(toImproveMessage: string): void {
    this.dialogResult.emit({toImproveMessage});
  }

  onCancel(): void {
    this.dialog.hide();
  }
 
}
