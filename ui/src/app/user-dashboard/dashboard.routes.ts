import { Routes } from '@angular/router';
export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-dashboard.component').then(c => c.UserDashboardComponent),
    data: {
      title: undefined,
      metaTitle: undefined,
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./user-dashboard.component').then(c => c.UserDashboardComponent),
    data: {
      title: undefined,
      metaTitle: undefined,
      breadcrumbReplace: 'projectId',
    },
    children: [
      {
        path: 'packages',
        loadComponent: () => import('./dashboard-packages/dashboard-packages.component').then(c => c.DashboardPackagesComponent),
        data: {
          title: 'Packages',
          metaTitle: 'Ericsson Customer Acceptance - Dashboard',
        },
      },
      {
        path: 'certificates',
        loadComponent: () => import('./dashboard-certificates/dashboard-certificates.component').then(c => c.DashboardCertificatesComponent),
        data: {
          title: 'Certificates',
          metaTitle: 'Ericsson Customer Acceptance - Dashboard',
        },
      },
    ]
  },
];
