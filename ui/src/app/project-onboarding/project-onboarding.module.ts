import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectOnboardingRoutingModule } from './project-onboarding-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { ProjectOnboardingComponent } from './project-onboarding/project-onboarding.component';
import { ProjectImportComponent } from './project-import/project-import.component';
import { ProjectAssignComponent } from './project-assign/project-assign.component';

@NgModule({
  declarations: [
    ProjectOnboardingComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    ProjectOnboardingRoutingModule,
    FormsModule,
    ProjectImportComponent,
    ProjectAssignComponent,
  ]
})
export class ProjectOnboardingModule { }
