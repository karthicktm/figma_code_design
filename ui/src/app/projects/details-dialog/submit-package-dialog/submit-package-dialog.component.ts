import { Component, EventEmitter, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-submit-package-dialog',
  templateUrl: './submit-package-dialog.component.html',
  styleUrls: ['./submit-package-dialog.component.less']
})
export class SubmitPackageDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<string> = new EventEmitter();
  maxLength = 3000;
  commentInput = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(this.maxLength)] });

  constructor( @Inject(DIALOG_DATA) public inputData: any)
  {
    super();
  }

  public submitPackage(comment: string): void {
   this.dialogResult.emit(comment);
  }
}
