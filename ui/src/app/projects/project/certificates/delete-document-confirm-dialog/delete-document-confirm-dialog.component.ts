import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-delete-document-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './delete-document-confirm-dialog.component.html',
  styleUrl: './delete-document-confirm-dialog.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteDocumentConfirmDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<boolean> = new EventEmitter();

  documentName: string;

  constructor(
    @Inject(DIALOG_DATA) public inputData: { documentName: string },
  ) {
    super();
    this.documentName = inputData.documentName;
  }

  public onSubmit(): void {
    this.dialogResult.emit(true);
  }

  public onCancel(): void {
    this.dialogResult.emit(false);
  }
}
