import { Component, EventEmitter, Output } from '@angular/core';
import { EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-delete-document-dialog',
  templateUrl: './delete-document-dialog.component.html',
  styleUrls: ['./delete-document-dialog.component.less']
})
export class DeleteDocumentDialogComponent extends EDSDialogComponent {
  @Output() dialogResult: EventEmitter<boolean> = new EventEmitter();

  message = 'Are you sure you want to delete this document?';

  constructor() {
    super();
  }

  public onConfirmDeletion(): void {
    this.dialogResult.emit(true);
  }
}
