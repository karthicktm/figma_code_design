import { Route } from '@angular/router';
import { AuthorizationGuard } from 'src/app/auth/authorization.guard';
import { ToolPermission } from 'src/app/auth/authorization.service';
import { CreateCertificateComponent } from './create-certificate/create-certificate.component';
import { CertificateListComponent } from './certificate-list/certificate-list.component';
import { CertificateRequestDetailsComponent } from './certificate-request-details/certificate-request-details.component';

export const certificatesRoutes: Route[] = [
  {
    path: 'new',
    canActivate: [AuthorizationGuard],
    component: CreateCertificateComponent,
    data: {
      title: 'New certificate request',
      permission: ToolPermission.RequestCertificate,
      metaTitle: 'Ericsson Customer Acceptance - Create new certificate request'
    }
  },
  {
    path: ':certificateRequestId',
    component: CertificateRequestDetailsComponent,
    data: {
      // To overwrite the parent title
      breadcrumbReplace: 'certificateRequestId',
      title: undefined,
      metaTitle: 'Ericsson Customer Acceptance - Certificate request detail'
    },
  },
  {
    path: '',
    canActivate: [AuthorizationGuard],
    component: CertificateListComponent,
    data: {
      title: undefined,
      permission: ToolPermission.ViewCertificateProjectMenu,
      metaTitle: 'Ericsson Customer Acceptance - Certificates',
    },
  },
];
