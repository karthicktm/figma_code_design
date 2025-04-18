import { Component } from '@angular/core';
import { CustomerDetails } from '../customer-onboarding.interface';
import { CustomerService } from '../customer.service';

const stInstanceExtAttribute = 'ST_INSTANCE'

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.less']
})
export class OnboardingComponent {
  public customerDetails: CustomerDetails;
  public updatedCustomerDetails: CustomerDetails;
  constructor(private customerService: CustomerService) { }
  // default ST true
  isSelectableCustomerInput : boolean = true;

  public fetchCustomerBySelection(customerDetails: CustomerDetails): void {
    this.customerService.getCustomerByCustomerId(customerDetails.customerId).subscribe({
      next: (customerDetails) => {
        this.customerDetails = customerDetails;
        if (customerDetails?.extendedAttributes?.filter((item) => item.attributeName === stInstanceExtAttribute).length > 0) {
          this.isSelectableCustomerInput = true;
        } else {
          this.isSelectableCustomerInput = false;
        }
      },
      error: (error) => {
        // Do something to handle error
      },
    });
  }

  public switchCustomerType(event) : void {
    this.isSelectableCustomerInput = event.target.checked
  }

  public updateCustomerList(updatedCustomerDetails): void {
    this.updatedCustomerDetails = updatedCustomerDetails;
  }

  public getCustomerInputType() : boolean {
    return this.isSelectableCustomerInput
  }
}
