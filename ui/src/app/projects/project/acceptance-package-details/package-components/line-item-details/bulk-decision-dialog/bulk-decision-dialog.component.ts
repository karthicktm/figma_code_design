import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { DecisionType } from '../decision-type';

export interface DialogData {
  decision: DecisionType,
  submit: (decision: DecisionType, scope: string) => void,
}

export enum ScopeOptions {
  all = 'All (will override past decision)',
  pendingOnly = 'Pending only',
  rejectedOnly = 'Rejected ones (will override past decision)',
  approvedOnly = 'Approved ones (will override past decision)',
}

@Component({
  selector: 'app-bulk-decision-dialog',
  templateUrl: './bulk-decision-dialog.component.html',
  styleUrls: ['./bulk-decision-dialog.component.less']
})
export class BulkDecisionDialogComponent extends EDSDialogComponent {
  options = [
    ScopeOptions.pendingOnly,
    ScopeOptions.rejectedOnly,
    ScopeOptions.all,
  ];
  form: FormGroup = new FormGroup({
    scope: new FormControl(''),
  });

  constructor(
    @Inject(DIALOG_DATA) public data: DialogData,
  ) {
    super();
    if (data.decision === DecisionType.approve) {
      this.options = [
        ScopeOptions.pendingOnly,
        ScopeOptions.rejectedOnly,
        ScopeOptions.all,
      ];
    } else {
      this.options = [
        ScopeOptions.pendingOnly,
        ScopeOptions.approvedOnly,
        ScopeOptions.all,
      ];
    }
    this.form.controls.scope.setValue(this.options[0]);
  }

  onSubmit(): void {
    const result = this.form.getRawValue()
    this.data.submit(this.data.decision, result.scope);
    this.dialog.hide();
  }
}
