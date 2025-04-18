import { Component, EventEmitter, Output } from '@angular/core';
import { EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-group-create-dialog',
  templateUrl: './group-create-dialog.component.html',
  styleUrls: ['./group-create-dialog.component.less']
})
export class GroupCreateDialogComponent extends EDSDialogComponent {

  @Output() dialogResult: EventEmitter<string> = new EventEmitter();

  /**
   * Emits groupId if group is created successfully.
   */
  public onClose(formResult: string): void {
    if (formResult) {
      this.dialogResult.emit(formResult);
    }

    this.dialog.hide();
  }

}
