import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from '../portal/services/dialog.service';

const defaultConfirmLabel = 'Leave'
const defaultCancelLabel = 'Stay'

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.less']
})
export class ConfirmationDialogComponent extends EDSDialogComponent {
  protected confirmLabel: string;
  protected cancelLabel: string;

  @Output() dialogResult: EventEmitter<boolean> = new EventEmitter();

  constructor(
    @Inject(DIALOG_DATA) public inputData: {title: string, 
      message: string, 
      confirmLabel?: string,
      cancelLabel?: string
    }) {
    super();
    this.confirmLabel = inputData.confirmLabel || defaultConfirmLabel;
    this.cancelLabel = inputData.cancelLabel || defaultCancelLabel;
  }

  /**
   * Method that is called when the user clicks the Yes button.
   * Emits `true`.
   */
  public onConfirmAndClose(): void {
    this.dialogResult.emit(true);
    this.dialog.hide();
  }

  /**
   * Method that is called when the user clicks the No button.
   * Emits `false`.
   */
  public onCancelAndClose(): void {
    this.dialogResult.emit(false);
    this.dialog.hide();
  }

}
