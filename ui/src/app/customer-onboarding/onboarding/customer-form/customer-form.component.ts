import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { SelectComponent } from 'src/app/shared/select/select.component';
import { Attribute, CountriesList, CustomerDetails, CustomerInfo } from '../../customer-onboarding.interface';
import { CustomerService } from '../../customer.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface AttributeControls {
  attributeName: FormControl<string>;
  attributeType: FormControl<string>;
  attributeValue: FormControl<string>;
}

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.less']
})
export class CustomerFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() readonly selectedData: CustomerDetails;
  @Input() readonly isSelectableCustomerInput: boolean;
  @Output() readonly ifUpdateCustomerList = new EventEmitter<Object>();
  isEditMode: boolean = false;
  public customerForm: FormGroup<{
    customerIDInput: FormControl<string>,
    customerNameInput: FormControl<string>,
    globalCustomerUnitInput: FormControl<string>,
    customerDescriptionInput: FormControl<string>,
    countryInput: FormControl<string>,
    regionInput: FormControl<string>,
    subRegionInput: FormControl<string>,
    addressInput: FormControl<string>,
    cityInput: FormControl<string>,
    stateInput: FormControl<string>,
    extendedAttributes: FormArray<FormGroup<AttributeControls>>,
  }>;
  @ViewChildren(SelectComponent) readonly selectComponentRefs: QueryList<SelectComponent>;
  /**
   * An array containing the country names.
   */
  public countries: string[];
  readonly regions: string[] = ['MANA', 'MMEA', 'MELA', 'MOAI', 'MNEA'];
  customerOptions: { option: string; optionValue: string; }[];
  customerInfoList: CustomerInfo[];
  private subscription: Subscription = new Subscription();
  
  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private notificationService: NotificationService,
  ) {
    this.customerForm = this.fb.group({
      customerIDInput: this.fb.nonNullable.control('', { validators: [Validators.required, this.duplicateNameValidator.bind(this), Validators.maxLength(255)] }),
      customerNameInput: ['', [Validators.required, Validators.maxLength(255)]],
      globalCustomerUnitInput: ['', [Validators.maxLength(255)]],
      customerDescriptionInput: ['', [Validators.maxLength(255)]],
      countryInput: ['', [Validators.required, Validators.minLength(2)]],
      regionInput: ['', [Validators.required, Validators.maxLength(255)]],
      subRegionInput: ['', [Validators.maxLength(255)]],
      addressInput: ['', [Validators.maxLength(255)]],
      cityInput: ['', [Validators.maxLength(255)]],
      stateInput: ['', [Validators.maxLength(255)]],
      extendedAttributes: this.fb.array<FormGroup>([].map(attr => this.createAttributeGroup(attr))),
    });
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public isNew: boolean;

  ngOnInit(): void {    
    if (this.isSelectableCustomerInput) {
      // ST case, Note : countries will be filled by server data
      this.fetchCustomerInfoFromServer()
    } else {
      // else we have to fetch countries
      this.fetchAllCountries();
    }
  }

  get customerIDInput(): FormControl {
    return this.customerForm.get('customerIDInput') as FormControl;
  }

  get customerNameInput(): FormControl {
    return this.customerForm.get('customerNameInput') as FormControl;
  }

  get globalCustomerUnitInput(): FormControl {
    return this.customerForm.get('globalCustomerUnitInput') as FormControl;
  }

  get customerDescriptionInput(): FormControl {
    return this.customerForm.get('customerDescriptionInput') as FormControl;
  }

  get countryInput(): FormControl<string> {
    return this.customerForm.controls.countryInput;
  }

  get regionInput(): FormControl {
    return this.customerForm.get('regionInput') as FormControl;
  }

  get subRegionInput(): FormControl {
    return this.customerForm.get('subRegionInput') as FormControl;
  }

  get addressInput(): FormControl {
    return this.customerForm.get('addressInput') as FormControl;
  }

  get cityInput(): FormControl {
    return this.customerForm.get('cityInput') as FormControl;
  }

  get stateInput(): FormControl {
    return this.customerForm.get('stateInput') as FormControl;
  }

  get extendedAttributes(): FormArray<FormGroup<AttributeControls>> {
    return this.customerForm.controls.extendedAttributes;
  }

  get extendedAttributeNames(): string[] {
    return this.extendedAttributes.controls.map(attrControl => attrControl.controls.attributeName.value);
  }

  private createAttributeGroup(attr: Attribute): FormGroup<AttributeControls> {
    const attrFormGroup = this.fb.group(attr);
    attrFormGroup.controls.attributeValue.addValidators([Validators.maxLength(255)]);
    attrFormGroup.updateValueAndValidity();
    return attrFormGroup;
  }

  private duplicateNameValidator(control: AbstractControl): ValidationErrors | null {
    if (this.customerService.fetchedCustomerIds().length
      && this.customerService.fetchedCustomerIds().includes(control.value)
    ) {
      return { duplicate: true };
    }
    return null;
  }

  public onSubmit(): void {
    if(this.isEditMode) {
      this.onUpdateCustomer();
    } else {
      this.onAddCustomer();
    }
  }

  public onAddCustomer(): void {
    // Call API to add new customer
    const extendedAttributes: Attribute[] = this.customerForm.controls.extendedAttributes.getRawValue();
    const newCustomer: CustomerDetails = {
      customerId: this.customerIDInput.value,
      customerName: this.customerNameInput.value,
      globalCustomerUnit: this.globalCustomerUnitInput.value,
      customerDescription: this.customerDescriptionInput.value,
      region: this.regionInput.value,
      subRegion: this.subRegionInput.value,
      country: this.customerForm.controls.countryInput.value,
      city: this.cityInput.value,
      state: this.stateInput.value,
      address: this.addressInput.value,
      extendedAttributes: extendedAttributes
    };
    this.subscription.add(this.customerService.createNewCustomer(newCustomer).subscribe({
      next: (response) => {
        this.customerForm.reset();
        this.extendedAttributes.clear();
        this.selectComponentRefs?.forEach(component => component.resetInput());
        this.ifUpdateCustomerList.emit(response.find(createResponse => createResponse.customerId === newCustomer.customerId));
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.showNotification({
          title: `Error while adding customer!`,
          description: `${error.error?.description
            ? error.error.description
            : 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'}`,
        }, true);
      },
    }));
  }

  public onUpdateCustomer(): void {
    const updatedCustomerDetails: CustomerDetails = {
      customerId: this.customerIDInput.value,
      customerName: this.customerNameInput.value,
      globalCustomerUnit: this.globalCustomerUnitInput.value,
      customerDescription: this.customerDescriptionInput.value,
      region: this.regionInput.value,
      subRegion: this.subRegionInput.value,
      country: this.customerForm.controls.countryInput.value,
      city: this.cityInput.value,
      state: this.stateInput.value,
      address: this.addressInput.value,
      extendedAttributes: this.customerForm.controls.extendedAttributes.getRawValue(),
    };
    this.subscription.add(this.customerService.updateExistingCustomer(updatedCustomerDetails).subscribe({
      next: (details: CustomerDetails) => {
        this.ifUpdateCustomerList.emit(details);
        this.customerForm.reset();
        this.extendedAttributes.clear();
        this.selectComponentRefs?.forEach(component => component.resetInput());
        this.isEditMode = false;
        this.customerForm.controls.customerIDInput.enable();
        this.customerForm.controls.countryInput.enable();
        this.isNew = false;
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.showNotification({
          title: `Error while updating customer!`,
          description: `Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.`,
        }, true);
      },
    }));
  }

  cancelEdit(): void {
    this.customerForm.reset();
    this.extendedAttributes.clear();
    this.selectComponentRefs?.forEach(component => component.resetInput());
    this.isNew = false;
    this.isEditMode = false;
    this.customerForm.controls.customerIDInput.enable();
    this.customerForm.controls.countryInput.enable();
  }

  public onNewAttributeClicked(): void {
    this.isNew = !this.isNew;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedData && (changes.selectedData.currentValue !== changes.selectedData.previousValue)) {
      this.cancelEdit();
      const selectedData: CustomerDetails = changes.selectedData.currentValue;
      this.isEditMode = true;

      const extendedAttributes = selectedData.extendedAttributes.map(attr => this.createAttributeGroup(attr));
      this.customerForm.controls.extendedAttributes.controls.push(...extendedAttributes);

      this.customerForm.patchValue({
        customerIDInput: selectedData.customerId,
        customerNameInput: selectedData.customerName,
        globalCustomerUnitInput: selectedData.globalCustomerUnit,
        customerDescriptionInput: selectedData.customerDescription,
        regionInput: selectedData.region,
        subRegionInput: selectedData.subRegion,
        addressInput: selectedData.address,
        cityInput: selectedData.city,
        stateInput: selectedData.state,
        countryInput: selectedData.country,
        extendedAttributes: selectedData.extendedAttributes,
      });
      this.customerIDInput.disable();
      this.countryInput.disable();
    }


    if (changes.isSelectableCustomerInput && (changes.isSelectableCustomerInput.currentValue !== changes.isSelectableCustomerInput.previousValue)) {   
      if (this.isSelectableCustomerInput) {
        // ST case, re-fetch
        this.fetchCustomerInfoFromServer()
        // make countries empty, so that its from server data on selection
        this.countries = [];
      } else {
        this.fetchAllCountries();
      }
    }

  }

  public newAttribute(attr: Attribute): void {
    this.customerForm.controls.extendedAttributes.controls.push(this.createAttributeGroup(attr));
  }

  /**
   * get list of countries
   */
  fetchAllCountries(): void {
    this.subscription.add(this.customerService.getAllCountries().subscribe({
      next: (countries: CountriesList) => {
       this.countries = countries.countries;
      },
      error: (error) => {
        // Do something to handle error
      },
    }));
  }

  /**
   * get customer details from server (ST case)
   */
  fetchCustomerInfoFromServer(): void {
    this.subscription.add(this.customerService.getSiteTrackerCustomers().subscribe({
      next: (selectableCustomers : CustomerInfo[]) => {
        this.customerInfoList = selectableCustomers
        this.customerOptions = selectableCustomers.map(customer => {
          return {
            option: `${customer.customerId} - ${customer.customerName}`,
            optionValue: customer.customerId,
          };
        })
      },
      error: (error) => {
        // TODO : can ignore as free text input will handle this case ?
      },
    }));
  }

  public onSelectCustomer(event: CustomEvent): void {
    if (event?.detail?.value && event?.detail?.value.length > 0) {
      const customerInfo = this.customerInfoList.filter(elem => elem.customerId === event.detail.value[0])
      if (customerInfo && customerInfo.length > 0) {
        // set the customer name
        this.customerNameInput.setValue(customerInfo[0].customerName)
        // set the customer country
        this.countryInput.setValue(customerInfo[0].country)        
      }
    }
  } 
}
