import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OnboardingComponent } from './onboarding/onboarding.component';

const routes: Routes = [
  {
    path: '',
    component: OnboardingComponent,
    data: {
      // To overwrite the parent title
      title: undefined,
      metaTitle: 'Ericsson Customer Acceptance - Customer onboarding',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerOnboardingRoutingModule { }
