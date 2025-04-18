import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { WorkflowsComponent } from './workflows.component';
import { WorkflowsRoutingModule } from './workflows-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    WorkflowsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    WorkflowsRoutingModule,
  ]
})


export class WorkflowsModule { }
