import { Component, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-add-comment-dialog',
  templateUrl: './add-comment-dialog.component.html',
  styleUrls: ['./add-comment-dialog.component.less']
})
export class AddCommentDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<any> = new EventEmitter();

  maxLength = 3000;
  commentInput = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(this.maxLength)] });
  isSubmitButtonClicked = false;
  constructor() {
    super();
  }

  submitComment(): void {
    this.isSubmitButtonClicked = true;
    this.dialogResult.emit({ comment: this.commentInput.value });
  }
}
