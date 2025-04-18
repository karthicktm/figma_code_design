import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TreeNode } from './navigation-tree/tree/tree-node.interface';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-acceptance-package-form-step2',
  templateUrl: './acceptance-package-form-step2.component.html',
  styleUrls: ['./acceptance-package-form-step2.component.less']
})
export class AcceptancePackageFormStep2Component {
  @Input() packageForm: FormGroup;
  @Input() doLITableReset: ReplaySubject<boolean>;

  checkList: TreeNode;
  @Input() isEdit: boolean = false;
  selectedCheckList(checkList: TreeNode): void {
    if (!checkList) {
      this.checkList = undefined;
      return;
    }
    if (checkList.nodeType === 'checklist' || checkList.nodeType === 'LineItems') this.checkList = checkList;
  }
}
