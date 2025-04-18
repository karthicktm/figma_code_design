import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { AcceptancePackageFormMilestoneEvidencesComponent } from '../acceptance-package-form-milestone-evidences/acceptance-package-form-milestone-evidences.component';
import { AcceptancePackageFormMilestoneLineItemsComponent } from '../acceptance-package-form-milestone-line-items/acceptance-package-form-milestone-line-items.component';
import { FormControl, FormGroup } from '@angular/forms';
import { Model } from '../acceptance-package-new.component';
import { Observable } from 'rxjs';

enum MilestoneComponentTypes {
  lineItems = 'Line items',
  milestoneEvidences = 'Milestone Evidences',
}

@Component({
  selector: 'app-acceptance-package-form-milestone-components',
  standalone: true,
  imports: [
    CommonModule,
    AcceptancePackageFormMilestoneEvidencesComponent,
    AcceptancePackageFormMilestoneLineItemsComponent,
  ],
  templateUrl: './acceptance-package-form-milestone-components.component.html',
  styleUrl: './acceptance-package-form-milestone-components.component.less'
})
export class AcceptancePackageFormMilestoneComponentsComponent {
  projectId = input.required<string>();
  packageForm = input.required<FormGroup<Model>>();

  MilestoneComponentTypes = MilestoneComponentTypes;
  selectedType = MilestoneComponentTypes.lineItems;

  switchType(type: MilestoneComponentTypes): void {
    this.selectedType = type;
  }

  get milestoneIdObservable(): Observable<string[]> {
    const step2FormGroup = this.packageForm().controls.step2;
    const milestoneIdControl: FormControl<string[]> = step2FormGroup.controls.milestoneIds;
    return milestoneIdControl.valueChanges;
  }
}
