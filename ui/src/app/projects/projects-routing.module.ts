import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AcceptanceProjectListComponent } from './acceptance-project-list/acceptance-project-list.component';

import { AcceptancePackagesComponent } from './project/acceptance-packages/acceptance-packages.component';
import { AcceptancePackageDetailsComponent } from './project/acceptance-package-details/acceptance-package-details.component';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { ProjectMenuComponent } from './project/project-menu/project-menu.component';
import { ProjectStructureComponent } from './project-structure/project-structure.component';
import { CanDeactivateGuard } from '../can-deactivate.guard';
import { LineItemListComponent } from './project-structure/line-item-list/line-item-list.component';
import { SiteHierarchyComponent } from './project-structure/site-hierarchy/site-hierarchy.component';
import { SiteDetailsComponent } from './project-structure/site-details/site-details.component';
import { AcceptancePackageNewComponent } from './project/acceptance-package-new/acceptance-package-new.component';
import { EditAcceptancePackageComponent } from './project/edit-acceptance-package/edit-acceptance-package.component';
import { ReworkAcceptancePackageComponent } from './project/rework-acceptance-package/rework-acceptance-package.component';
import { ToolPermission } from '../auth/authorization.service';
import { UsersComponent } from './users/users.component';
import { AllLineItemsComponent } from './project-structure/all-line-items/all-line-items.component';
import { MilestoneEvidencesComponent } from './project-structure/milestone-evidences/milestone-evidences.component';
import { WorkplanDetailsComponent } from './project-structure/workplan-details/workplan-details.component';
import { MilestoneDetailsComponent } from './project-structure/milestone-details/milestone-details.component';
import { ProjectViewComponent } from './project-view/project-view.component';
import { SiteViewComponent } from './project-view/site-view/site-view.component';

const siteHierarchyChildRoutes: Routes = [
  {
    path: 'site-details',
    component: SiteDetailsComponent,
    data: {
      title: 'Details',
      metaTitle: 'Ericsson Customer Acceptance - Site details'
    },
  },
  {
    path: 'all-line-items',
    component: AllLineItemsComponent,
    data: {
      title: 'Line items',
      metaTitle: 'Ericsson Customer Acceptance - All line item details',
    },
  },
  // Checklist redirection if on child path given
  {
    path: 'checklist',
    redirectTo: 'site-details',
  },
  {
    path: 'checklist',
    data: {
      title: 'Checklist',
    },
    children: [
      {
        path: ':id',
        component: LineItemListComponent,
        data: {
          // To overwrite the parent title
          breadcrumbReplace: 'checklistId',
          title: undefined,
          metaTitle: 'Ericsson Customer Acceptance - Checklist',
        },
      },
    ],
  },
  {
    path: 'milestone',
    redirectTo: 'site-details',
  },
  {
    path: 'milestone',
    data: {
      title: 'Milestone',
    },
    children: [
      {
        path: ':milestoneId',
        component: MilestoneDetailsComponent,
        data: {
          // To overwrite the parent title
          breadcrumbReplace: 'milestoneId',
          title: undefined,
          metaTitle: 'Ericsson Customer Acceptance - Milestone',
        },
      },
    ],
  },
  {
    path: 'milestone-evidence',
    redirectTo: 'site-details',
  },
  {
    path: 'milestone-evidence',
    data: {
      title: 'Milestone evidences',
    },
    children: [
      {
        path: ':milestoneId',
        component: MilestoneEvidencesComponent,
        data: {
          // To overwrite the parent title
          breadcrumbReplace: 'milestoneId',
          title: undefined,
          metaTitle: 'Ericsson Customer Acceptance - Milestone evidences',
        },
      },
    ],
  },
  {
    path: 'workplan',
    redirectTo: 'site-details',
  },
  {
    path: 'workplan',
    data: {
      title: 'Workplan',
    },
    children: [
      {
        path: ':workplanId',
        component: WorkplanDetailsComponent,
        data: {
          // To overwrite the parent title
          breadcrumbReplace: 'workplanId',
          title: undefined,
          metaTitle: 'Ericsson Customer Acceptance - Workplan',
        },
      },
    ],
  },
];

const projectCommonChildRoutes: Routes = [

  {
    path: 'acceptance-packages',
    component: AcceptancePackagesComponent,
    data: {
      title: 'Acceptance packages',
      metaTitle: 'Ericsson Customer Acceptance - Project acceptance packages',
    },
  },
  {
    path: 'acceptance-packages',
    data: {
      title: 'Acceptance packages',
    },
    children: [
      {
        path: 'new',
        component: AcceptancePackageNewComponent,
        data: {
          title: 'New package',
          metaTitle: 'Ericsson Customer Acceptance - Create new acceptance package'
        }
      },
      {
        path: ':id',
        component: AcceptancePackageDetailsComponent,
        data: {
          // To overwrite the parent title
          breadcrumbReplace: 'packageId',
          title: undefined,
          metaTitle: 'Ericsson Customer Acceptance - Acceptance package detail'
        },
      },
      {
        path: ':id/edit',
        component: EditAcceptancePackageComponent,
        data: {
          // To overwrite the parent title
          breadcrumbReplace: 'packageId',
          title: 'Edit package',
          metaTitle: 'Ericsson Customer Acceptance - Edit Acceptance package'
        },
      },
      {
        path: ':id/rework',
        component: ReworkAcceptancePackageComponent,
        data: {
          // To overwrite the parent title
          breadcrumbReplace: 'packageId',
          title: 'Rework package',
          metaTitle: 'Ericsson Customer Acceptance - Rework Acceptance package'
        },
      },
    ]
  },
  {
    path: 'certificates',
    loadChildren: () => import('./project/certificates/certificates.routes').then(mod => mod.certificatesRoutes),
    data: {
      title: 'Certificates'
    }
  },
  {
    path: 'user-onboarding',
    canActivate: [AuthorizationGuard],
    canDeactivate: [CanDeactivateGuard],
    component: UsersComponent,
    data: {
      title: 'Users onboarding',
      permission: ToolPermission.ViewProjectMenuUserOnboarding,
      metaTitle: 'Ericsson Customer Acceptance - Project user onboarding',
    },
  },
  {
    path: 'users',
    canActivate: [AuthorizationGuard],
    canDeactivate: [CanDeactivateGuard],
    component: UsersComponent,
    data: {
      title: 'Users',
      permission: ToolPermission.ViewProjectMenuProjectUsers,
      metaTitle: 'Ericsson Customer Acceptance - Project users',
    },
  },
  {
    path: 'project-structure',
    canActivate: [AuthorizationGuard],
    component: ProjectStructureComponent,
    data: {
      title: 'Project structure',
      permission: 'view-project-menu-project-structure',
      metaTitle: 'Ericsson Customer Acceptance - Project structure'
    },
  },
  {
    path: 'project-structure',
    data: {
      title: 'Project structure'
    },
    children: [
      {
        path: ':networkSiteId',
        canActivate: [AuthorizationGuard],
        component: SiteHierarchyComponent,
        data: {
          breadcrumbReplace: 'networkSiteId',
          title: undefined,
          permission: 'view-project-menu-project-structure',
        },
        children: [
          ...siteHierarchyChildRoutes,
          {
            path: '**',
            redirectTo: 'site-details',
          }
        ]
      },

    ]
  },
  {
    path: 'project-view',
    canActivate: [AuthorizationGuard],
    component: ProjectViewComponent,
    data: {
      title: 'View project',
      permission: ToolPermission.ViewProjectMenuProjectView,
      metaTitle: 'Ericsson Customer Acceptance - View project'
    },
  },
  {
    path: 'project-view',
    data: {
      title: 'View project',
      permission: ToolPermission.ViewProjectMenuProjectView,
    },
    children: [
      {
        path: ':networkSiteId',
        canActivate: [AuthorizationGuard],
        component: SiteViewComponent,
        data: {
          breadcrumbReplace: 'networkSiteId',
          title: undefined,
          metaTitle: 'Ericsson Customer Acceptance - Project sites'
        },
      },
    ]
  },
  {
    path: 'certificate-templates',
    canActivate: [AuthorizationGuard],
    loadComponent: () => import('./project/certificate-templates/certificate-template-list/certificate-template-list.component').then(mod => mod.CertificateTemplateListComponent),
    data: {
      title: 'Certificate templates',
      permission: ToolPermission.ViewCertificateTemplatesProjectMenu,
      metaTitle: 'Ericsson Customer Acceptance - Certificate templates',
    },
  },
  {
    path: 'dashboard',
    loadComponent: () => import('../projects/project-dashboard/project-dashboard.component').then(mod => mod.ProjectDashboardComponent),
    data: {
      title: 'Dashboard',
      metaTitle: 'Ericsson Customer Acceptance - Project dashboard',
    },
  },
];
const routes: Routes = [
  {
    path: '',
    data: {
      // To overwrite the parent title
      title: undefined,
    },
    component: AcceptanceProjectListComponent,
  },
  {
    path: ':id',
    canActivate: [AuthorizationGuard],
    data: {
      // To overwrite the parent title
      breadcrumbReplace: 'projectId',
      title: undefined,
      permission: 'view-project-menu',
    },
    component: ProjectMenuComponent,
  },

  {
    path: ':id',
    data: {
      // To overwrite the parent title
      breadcrumbReplace: 'projectId',
      title: undefined,
    },
    children: [
      ...projectCommonChildRoutes,
      {
        path: 'acceptance-packages',
        component: AcceptancePackagesComponent,
        data: {
          // To overwrite the parent title
          title: undefined,
          metaTitle: 'Ericsson Customer Acceptance - Project acceptance packages'
        },
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectsRoutingModule { }
