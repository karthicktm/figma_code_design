import { Component, EventEmitter, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-marker-description-dialog',
  templateUrl: './marker-description-dialog.component.html',
  styleUrls: ['./marker-description-dialog.component.less']
})
export class MarkerDescriptionDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<string | boolean> = new EventEmitter();
  constructor(@Inject(DIALOG_DATA) public inputData: any) {
    super();
  }

  addComment(comment: string): void {
    this.dialogResult.emit(comment);
  }

  cancel(): void {
    this.dialogResult.emit(false);
  }
}
