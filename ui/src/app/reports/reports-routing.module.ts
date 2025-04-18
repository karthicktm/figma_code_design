import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { ToolPermission } from '../auth/authorization.service';
import { ReportsComponent } from './reports.component';
import { UsageDashboardComponent } from './usage-dashboard/usage-dashboard.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    component: ReportsComponent,
    data: {
      title: 'Reports',
      metaTitle: 'Ericsson Customer Acceptance - Reports',
      permission: ToolPermission.Reports,
    },
  },
  {
    path: 'dashboard',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    component: UsageDashboardComponent,
    data: {
      title: 'Dashboard',
      metaTitle: 'Ericsson Customer Acceptance - Dashboard',
      permission: ToolPermission.Reports,
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
