import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-delete-confirmation-dialog',
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrls: ['./delete-confirmation-dialog.component.less']
})
export class DeleteConfirmationDialogComponent extends EDSDialogComponent {

  @Output() dialogResult: EventEmitter<boolean> = new EventEmitter();

  constructor(
    @Inject(DIALOG_DATA) public inputData: {title: string, message: string},
  ) {
    super();
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
