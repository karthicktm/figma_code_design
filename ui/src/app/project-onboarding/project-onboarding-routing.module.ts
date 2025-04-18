import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectOnboardingComponent } from './project-onboarding/project-onboarding.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectOnboardingComponent,
    data: {
      // To overwrite the parent title
      title: undefined,
      metaTitle: 'Ericsson Customer Acceptance - Project onboarding',
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectOnboardingRoutingModule { }
