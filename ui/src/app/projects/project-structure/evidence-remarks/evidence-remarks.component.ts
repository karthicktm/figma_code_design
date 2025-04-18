import { Component, input, model, signal } from '@angular/core';
import { EvidenceRemark } from '../../projects.interface';
import { KeyValuePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-evidence-remarks',
  standalone: true,
  imports: [
    KeyValuePipe,
    NgClass,
  ],
  templateUrl: './evidence-remarks.component.html',
  styleUrl: './evidence-remarks.component.less'
})
export class EvidenceRemarksComponent {
  readonly selectedRemark = model<EvidenceRemark>(undefined);
  readonly isViewSelectedOnly = input<boolean>(false);
  readonly isDisabled = input<boolean>(true);
  readonly isEditMode = signal<boolean>(false);
  Remarks = EvidenceRemark;
}
