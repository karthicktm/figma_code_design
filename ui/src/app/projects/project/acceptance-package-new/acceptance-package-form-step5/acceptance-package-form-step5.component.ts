import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ReplaySubject } from 'rxjs';

export enum SelectOptions {
  SITE = 'site',
  WORKPLAN = 'workplan'
};

@Component({
  selector: 'app-acceptance-package-form-step5',
  templateUrl: './acceptance-package-form-step5.component.html',
  styleUrls: ['./acceptance-package-form-step5.component.less']
})
export class AcceptancePackageFormStep5Component implements OnInit {
  @Input() packageForm: FormGroup;
  @Input() doLITableReset: ReplaySubject<boolean>;
  @Input() isEdit: boolean = false;

  readonly SelectOptions = SelectOptions;
  selectedOnly = false;
  step2FormGroup: FormGroup;
  multiSelectOption: FormControl<string>;

  ngOnInit(): void {
    this.step2FormGroup = this.packageForm.controls.step2 as FormGroup;
    const multiSelectOption = this.step2FormGroup.controls.multiSelectOption as FormControl<string>;
    if (!multiSelectOption.value) multiSelectOption.patchValue(SelectOptions.SITE);
    this.multiSelectOption = multiSelectOption;
  }

  toggleSelected(event): void {
    this.selectedOnly = event.target.checked;
  }
}
