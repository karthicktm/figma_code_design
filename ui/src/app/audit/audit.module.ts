import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { AuditReportComponent } from './audit.component';
import { AuditRoutingModule } from './audit-routing.module';

@NgModule({
  declarations: [
    AuditReportComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AuditRoutingModule,
  ]
})


export class AuditReportModule { }
