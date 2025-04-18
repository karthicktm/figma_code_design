import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { HealthCheckComponent } from './health-check.component';
import { HealthCheckRoutingModule } from './health-check-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    HealthCheckComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    HealthCheckRoutingModule,
  ]
})


export class HealthCheckModule { }
