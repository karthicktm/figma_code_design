import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { Dropdown } from '@eds/vanilla';
import { EDSDialogComponent } from 'src/app/portal/services/dialog.service';

export type Verdict = 'Approve' | 'Reject' | 'N/A';

export interface DialogResult {
  requestDescription: string;
  verdict: Verdict;
}

@Component({
  selector: 'app-submit-verdict-dialog',
  templateUrl: './submit-verdict-dialog.component.html',
  styleUrls: ['./submit-verdict-dialog.component.less']
})
export class SubmitVerdictDialogComponent extends EDSDialogComponent implements AfterViewInit, OnDestroy {

  @ViewChild('selectVerdict') readonly verdictDropDownElementRef: ElementRef<HTMLElement>;
  @ViewChild('verdict') readonly verdictButtonElementRef: ElementRef<HTMLElement>;
  public dialogResult: EventEmitter<DialogResult> = new EventEmitter();
  verdictButtonText = 'Approve';
  submitButtonDisabled = false;

  private scripts: Scripts[] = [];

  message = `
    When submitting your verdict the request for approval will be be sent
    to the next approver on the list. After they have made a verdict the
    request will be sent to the next approver in line.
  `;

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    const dropDown = new Dropdown(this.verdictDropDownElementRef.nativeElement);
    dropDown.init();
    this.scripts.push(dropDown);
  }

  validateInput(element: HTMLTextAreaElement): void {
    const verdictButton = this.verdictButtonElementRef.nativeElement as HTMLButtonElement;
    element.value.length === 0 && verdictButton.value !== 'Approve'
      ? this.submitButtonDisabled = true
      : this.submitButtonDisabled = false;
  }

  sendRequest(requestDescription: string, verdict: Verdict): void {
    this.dialogResult.emit({ requestDescription, verdict });
  }

  ngOnDestroy(): void {
    this.scripts.forEach((s) => s.destroy());
  }
}
