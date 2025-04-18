import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-acceptance-package-form-step1',
  templateUrl: './acceptance-package-form-step1.component.html',
  styleUrls: ['./acceptance-package-form-step1.component.less']
})
export class AcceptancePackageFormStep1Component {
  @Input() packageForm: FormGroup;
  @Input() isEdit: boolean;

  constructor() { }

}
