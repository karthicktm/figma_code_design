import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProjectsService } from 'src/app/projects/projects.service';
import { IntegrateToB2B } from '../../../package-view.interface';

@Component({
  selector: 'app-package-details-form',
  templateUrl: './package-details-form.component.html',
  styleUrls: ['./package-details-form.component.less']
})
export class PackageDetailsFormComponent implements OnInit {
  @Input() packageForm: FormGroup
  @Input() isEdit: boolean

  packageDetailsForm: FormGroup<{
    nameInput: FormControl<string>,
    scopeInput: FormControl<string>,
    slaDaysInput: FormControl<string>,
    descriptionInput: FormControl<string>,
    integrateToB2B: FormControl<boolean>,
  }>;

  IntegrateToB2B = IntegrateToB2B;

  constructor(
    private projectsService: ProjectsService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    const step1FormGroup = this.packageForm.controls.step1 as FormGroup;
    this.packageDetailsForm = step1FormGroup.controls.packageDetails as FormGroup;

    if (!this.isEdit) {
      const projectId = this.route.snapshot.parent.parent.paramMap.get('id');
      this.projectsService.getPackageConfiguration(projectId).subscribe(pkgConfig => {
        if(pkgConfig.sla) {
          this.packageDetailsForm.controls.slaDaysInput.setValue(pkgConfig.sla.toString(10));
        } else {
          this.packageDetailsForm.controls.slaDaysInput.setValue('NA') // Null value is shown as Not Applicable as SLA is now read-only for a package
        }
      })
    } else if (!this.packageDetailsForm.controls.slaDaysInput.value) {
        this.packageDetailsForm.controls.slaDaysInput.setValue('NA') // Edit case when SLA is null
    }
  }

  get nameInput(): FormControl<string> {
    return this.packageDetailsForm.controls.nameInput;
  }
  get scopeInput(): FormControl<string> {
    return this.packageDetailsForm.controls.scopeInput;
  }
  get slaDaysInput(): FormControl<string> {
    return this.packageDetailsForm.controls.slaDaysInput;
  }
  get descriptionInput(): FormControl<string> {
    return this.packageDetailsForm.controls.descriptionInput;
  }
  get integrateToB2B(): FormControl<boolean> {
    return this.packageDetailsForm.controls.integrateToB2B;
  }
}
