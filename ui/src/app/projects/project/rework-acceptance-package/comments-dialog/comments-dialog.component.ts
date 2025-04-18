import { Component, HostListener, Inject, AfterViewInit } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { CommentContext, CommentHistoryComponent } from '../../acceptance-package-details/comment-history/comment-history.component';

export interface Data {
  commentContext: CommentContext,
}

@Component({
  selector: 'app-comments-dialog',
  standalone: true,
  imports: [
    CommentHistoryComponent,
  ],
  templateUrl: './comments-dialog.component.html',
  styleUrl: './comments-dialog.component.less'
})
export class CommentsDialogComponent extends EDSDialogComponent implements AfterViewInit {
  @HostListener('document:keyup.escape', ['$event']) onKeyEscape(event: any): void {
    this.close();
  };
  
  constructor(
    @Inject(DIALOG_DATA) public inputData: Data,
  ) {
    super();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    const inputElement: HTMLTextAreaElement = this.dialogElement.nativeElement.querySelector('textarea');
    // Required to get the focus as expected
    setTimeout(() =>
      inputElement.focus()
    );
  }

  close(): void {
    this.dialog.hide();
  } 
}
