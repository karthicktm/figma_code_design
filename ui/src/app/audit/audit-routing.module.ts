import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuditReportComponent } from './audit.component';

const routes: Routes = [
  {
    path: '',
    component: AuditReportComponent,
    data: {
      // To overwrite the parent title
      title: undefined,
      metaTitle: 'Ericsson Customer Acceptance - Audit logs',
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditRoutingModule { }
