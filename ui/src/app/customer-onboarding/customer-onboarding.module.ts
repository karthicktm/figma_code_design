import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerOnboardingRoutingModule } from './customer-onboarding-routing.module';
import { CustomerListComponent } from './onboarding/customer-list/customer-list.component';
import { CustomerFormComponent } from './onboarding/customer-form/customer-form.component';
import { SharedModule } from '../shared/shared.module';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { NewAttributeComponent } from './onboarding/new-attribute/new-attribute.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    OnboardingComponent,
    CustomerListComponent,
    CustomerFormComponent,
    NewAttributeComponent
  ],
  imports: [
    CommonModule,
    CustomerOnboardingRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CustomerOnboardingModule { }
