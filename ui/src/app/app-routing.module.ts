import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthenticationGuard } from './auth/authentication.guard';
import { AuthorizationGuard } from './auth/authorization.guard';
import { ToolPermission } from './auth/authorization.service';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { PageNotFoundComponent } from './portal/pages/page-not-found/page-not-found.component';
import { UserManagementComponent } from './user-management/user-management/user-management.component';
import { ConfigurationManagementComponent } from './configuration-management/configuration-management.component';
import { dashboardRoutes } from './user-dashboard/dashboard.routes';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
    data: { title: 'Home', metaTitle: 'Ericsson Customer Acceptance' }
  },
  {
    path: 'home',
    component: LandingPageComponent,
    data: { title: 'Home', metaTitle: 'Ericsson Customer Acceptance' }
  },
  {
    path: 'dashboard',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    data: {
      title: 'Dashboard',
      metaTitle: 'Ericsson Customer Acceptance - Dashboard',
      permission: ToolPermission.Dashboard,
    },
    children: dashboardRoutes,
  },
  {
    path: 'task-summary',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    component: PageNotFoundComponent,
    data: {
      title: 'Task summary',
      metaTitle: 'Ericsson Customer Acceptance - Task summary',
    }
  },
  {
    path: 'projects',
    canLoad: [AuthenticationGuard],
    loadChildren: () => import('./projects/projects.module').then(m => m.ProjectsModule),
    data: {
      title: 'My projects',
      metaTitle: 'Ericsson Customer Acceptance - Projects',
    },
  },
  {
    path: 'reports',
    canLoad: [AuthenticationGuard],
    loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule),
    data: {
      title: 'Reports',
      metaTitle: 'Ericsson Customer Acceptance - Reports',
    },
  },
  {
    path: 'customer-onboarding',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    loadChildren: () => import('./customer-onboarding/customer-onboarding.module').then(m => m.CustomerOnboardingModule),
    data: {
      title: 'Customer onboarding',
      metaTitle: 'Ericsson Customer Acceptance - Customer onboarding',
      permission: ToolPermission.CustomerOnboarding,
    },
  },
  {
    path: 'group-management',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    loadChildren: () => import('./group-management/group-management.module').then(m => m.GroupManagementModule),
    data: {
      title: 'Group management',
      metaTitle: 'Ericsson Customer Acceptance - Group management',
      permission: ToolPermission.GroupManagement,
    },
  },
  {
    path: 'user-management',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    component: UserManagementComponent,
    data: {
      title: 'User management',
      metaTitle: 'Ericsson Customer Acceptance - User management',
      permission: ToolPermission.UserManagement,
    },
  },
  {
    path: 'configuration-management',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    component: ConfigurationManagementComponent,
    data: {
      title: 'Configuration management',
      metaTitle: 'Ericsson Customer Acceptance - Configuration management',
      permission: ToolPermission.ConfigurationManagement,
    },
  },
  {
    path: 'settings',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    component: PageNotFoundComponent,
    data: {
      title: 'Tool settings',
      metaTitle: 'Ericsson Customer Acceptance - Settings',
      permission: ToolPermission.Settings,
    }
  },
  {
    path: 'project-onboarding',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    loadChildren: () => import('./project-onboarding/project-onboarding.module').then(m => m.ProjectOnboardingModule),
    data: {
      title: 'Project onboarding',
      metaTitle: 'Ericsson Customer Acceptance - Project onboarding',
      permission: ToolPermission.ProjectOnboarding,
    },
  },
  {
    path: 'audit',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    loadChildren: () => import('./audit/audit.module').then(m => m.AuditReportModule),
    data: {
      title: 'Audit',
      metaTitle: 'Ericsson Customer Acceptance - Audit',
      permission: ToolPermission.AuditReport,
    },
  },
  {
    path: 'health-check',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    loadChildren: () => import('./health-check/health-check.module').then(m => m.HealthCheckModule),
    data: {
      title: 'Health check',
      metaTitle: 'Ericsson Customer Acceptance - Health check',
      permission: ToolPermission.HealthCheck,
    },
  },
  {
    path: 'workflows',
    canActivate: [AuthenticationGuard, AuthorizationGuard],
    loadChildren: () => import('./workflows/workflows.module').then(m => m.WorkflowsModule),
    data: {
      title: 'Workflows',
      metaTitle: 'Ericsson Customer Acceptance - Workflows',
      permission: ToolPermission.Workflows,
    },
  },
  {
    path: '**',
    // redirectTo: '/',
    component: PageNotFoundComponent,
    data: { title: '404' }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
