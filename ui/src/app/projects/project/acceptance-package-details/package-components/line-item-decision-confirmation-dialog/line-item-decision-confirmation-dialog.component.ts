import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-line-item-decision-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './line-item-decision-confirmation-dialog.component.html',
  styleUrls: ['./line-item-decision-confirmation-dialog.component.less']
})
export class LineItemDecisionConfirmationDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<boolean> = new EventEmitter();
  message: string;

  constructor(
    @Inject(DIALOG_DATA) public data: { buttonType: string, scope: string },
  ) {
    super();

    if (data.scope === 'All') {
      this.message = `This step will auto approve all rejected and pending evidence for selected line-items.`;
    } else if ((data.scope === 'Pending')) {
      this.message = `This step will auto reject all pending evidence for selected line-items and skip already approved or rejected line items.`;
    }
  }

  onCancel(): void {
    this.dialogResult.emit(false);
  }

  onConfirm(): void {
    this.dialogResult.emit(true);
  }
}
