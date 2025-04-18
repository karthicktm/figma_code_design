import { Component, EventEmitter, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-submit-package-verdict-dialog',
  templateUrl: './submit-package-verdict-dialog.component.html',
  styleUrls: ['./submit-package-verdict-dialog.component.less']
})
export class SubmitPackageVerdictDialogComponent extends EDSDialogComponent implements OnDestroy {
  public dialogResult: EventEmitter<any> = new EventEmitter();

  verdicts: string[] = ['Approve', 'Reject'];
  chosenVerdict: string = '';
  maxLength = 3000;
  commentInput = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(this.maxLength)] });

  constructor(@Inject(DIALOG_DATA) public inputData: any) {
    super();
  }

  ngOnDestroy(): void {
    this.dialogResult.emit(false);
  }

  onSelectVerdict(verdict: string): void {
    switch (verdict) {
      case 'Approve':
        this.chosenVerdict = 'Customer Approved';
        break;
      case 'Reject':
        this.chosenVerdict = 'Customer Rejected';
        break;
      default:
        this.chosenVerdict = '';
        break;
    }
  }

  submitVerdict(): void {
    this.dialogResult.emit({ verdict: this.chosenVerdict, comment: this.commentInput.value });
  }

}
