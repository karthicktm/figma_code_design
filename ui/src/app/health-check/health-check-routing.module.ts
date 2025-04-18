import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HealthCheckComponent } from './health-check.component';

const routes: Routes = [
  {
    path: '',
    component: HealthCheckComponent,
    data: {
      // To overwrite the parent title
      title: undefined,
      metaTitle: 'Ericsson Customer Acceptance - Health check',
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HealthCheckRoutingModule { }
