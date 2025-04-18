import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { SelectComponent } from 'src/app/shared/select/select.component';
import { Attribute } from '../../customer-onboarding.interface';

@Component({
  selector: 'app-new-attribute',
  templateUrl: './new-attribute.component.html',
  styleUrls: ['./new-attribute.component.less']
})
export class NewAttributeComponent {
  @Output() createdAttribute = new EventEmitter<Attribute>();
  @ViewChild('dataTypeSelection') readonly dataTypeSelectionElement: SelectComponent;
  dataTypes = ['string'];
  selectedDataType = 'string';
  attributeForm: FormGroup<{
    attributeName: FormControl<string>,
    attributeType: FormControl<string>,
    attributeValue: FormControl<string>,
  }>;
  @Input()
  readonly attributeNames: string[] = [];

  constructor(private fb: FormBuilder) {
    this.attributeForm = this.fb.group({
      attributeName: fb.nonNullable.control('', { validators: [Validators.required, this.duplicateNameValidator.bind(this), Validators.maxLength(255)] }),
      attributeType: fb.nonNullable.control({ value: 'string', disabled: true, }, { validators: [Validators.required] }),
      attributeValue: ['', [Validators.required, Validators.maxLength(255)]],
    });
  }

  createAttribute(): void {
    const attr: Attribute = this.attributeForm.getRawValue();
    this.createdAttribute.next(attr);
    this.attributeForm.reset();
  }

  duplicateNameValidator(control: AbstractControl): ValidationErrors | null {
    if(this.attributeNames?.length > 0 && this.attributeNames.includes(control.value)) {
      return { duplicate: true };
    }
    return null;
  }
}