import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ProjectEventService } from '../projects/project-event.service';
import { UserSession } from '../projects/projects.interface';

export enum Role {
  ProjectAdmin = 'project-admin',
  EricssonContributor = 'ericsson-contributor',
  TemplateCreator = 'template-creator',
  MultiProjectObserver = 'multi-project-observer',
  CustomerApprover = 'customer-approver',
  OpsAdmin = 'ops-admin',
  None = 'none',
}

export enum RoleInProject {
  Contributor = 'CONTRIBUTOR',
  Approver = 'APPROVER',
  Observer = 'OBSERVER',
  None = 'NONE',
}

export enum ToolPermission {
  ViewTaskSummaryMenuItem = 'view-task-summary-menu-item',
  Settings = 'tool-settings',
  ViewToolSettingsMenuItem = 'view-tool-settings-menu-item',
  Projects = 'projects',
  ViewProjectsMenuItem = 'view-projects-menu-item',
  ViewReportsMenuItem = 'view-reports-menu-item',
  Reports = 'reports',
  ViewDashboardMenuItem = 'view-dashboard-menu-item',
  Dashboard = 'dashboard',
  ViewUserManagementMenuItem = 'view-user-management-menu-item',
  UserManagement = 'user-management',
  ConfigurationManagement = 'configuration-management',
  ConfigurationManagementMenu = 'view-configuration-management-menu',
  ViewProjectOnboardingMenuItem = 'view-project-onboarding-menu-item',
  ProjectOnboarding = 'project-onboarding',
  ViewApplicationHealthCheck = 'view-application-health-check',
  ViewDefineProject = 'view-define-project',
  ViewCustomerOnboarding = 'view-customer-onboarding',
  ViewProjectMenu = 'view-project-menu',
  ViewProjectMenuAcceptancePackage = 'view-project-menu-acceptance-package',
  ViewProjectMenuUserOnboarding = 'view-project-menu-user-onboarding',
  ViewProjectMenuProjectUsers = 'view-project-menu-project-users',
  ViewProjectMenuProjectStructure = 'view-project-menu-project-structure',
  ViewProjectMenuProjectView = 'view-project-menu-project-view',
  GroupManagement = 'group-management',
  ViewGroupManagementMenu = 'view-group-management-menu',
  CustomerOnboarding = 'customer-onboarding',
  ViewCustomerOnboardingMenuItem = 'view-customer-onboarding-menu-item',
  ViewAuditReportMenuItem = 'view-audit-report-menu-item',
  AuditReport = 'audit-report',
  ViewHealthCheckMenuItem = 'view-health-check-menu-item',
  HealthCheck = 'health-check',
  ViewWorkflowsMenuItem = 'view-workflows-menu-item',
  Workflows = 'workflows',
  CreateAcceptancePackage = 'create-package',
  EmailNotificationConfiguration = 'email-notification-configuration',
  ViewCertificateTemplatesProjectMenu = 'view-certificate-templates-project-menu',
  ViewCertificateProjectMenu = 'view-certificate-project-menu',
  RequestCertificate = 'request-certificate',
  ViewPackageConfiguration = 'view-package-configuration',
  EditPackageConfiguration = 'edit-package-configuration',
  ProjectSnagReport = 'project-snag-report',
}

export enum ComponentActionPermission {
  ProjectListCreateProject = 'project-list-create',
  ProjectListArchiveProject = 'project-list-archive',
  ProjectListDuplicateProject = 'project-list-duplicate',
}

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  constructor(private projectEventService: ProjectEventService) { }

  /**
   * Given a specific permission, it is verified if the current logged user
   * has the required permission to access the application's component.
   *
   * @param permission The required permission that should be evaluated
   */
  public isUserAuthorized(permission: string): Observable<boolean> {
    const roleDefinitions = [
      {
        role: Role.ProjectAdmin,
        permissions: [
          ToolPermission.ViewProjectsMenuItem,
          ToolPermission.Projects,
          ToolPermission.GroupManagement,
          ToolPermission.ViewGroupManagementMenu,
          ToolPermission.ViewProjectMenu,
          ToolPermission.ViewProjectMenuUserOnboarding,
          ToolPermission.ViewProjectMenuProjectStructure,
          ToolPermission.ViewProjectMenuAcceptancePackage,
          ToolPermission.CreateAcceptancePackage,
          ToolPermission.ViewCertificateTemplatesProjectMenu,
          ToolPermission.ViewCertificateProjectMenu,
          ToolPermission.RequestCertificate,
          ToolPermission.EmailNotificationConfiguration,
          ToolPermission.ViewPackageConfiguration,
          ToolPermission.EditPackageConfiguration,
          ToolPermission.ProjectSnagReport,
        ],
      },
      {
        role: Role.EricssonContributor,
        permissions: [
          ToolPermission.ViewProjectsMenuItem,
          ToolPermission.CreateAcceptancePackage,
          ToolPermission.Projects,
          ToolPermission.ViewProjectMenu,
          ToolPermission.ViewProjectMenuAcceptancePackage,
          ComponentActionPermission.ProjectListCreateProject,
          ComponentActionPermission.ProjectListArchiveProject,
          ComponentActionPermission.ProjectListDuplicateProject,
          ToolPermission.ViewProjectMenuProjectStructure,
          ToolPermission.ViewProjectMenuProjectUsers,
          ToolPermission.ViewCertificateTemplatesProjectMenu,
          ToolPermission.ViewCertificateProjectMenu,
          ToolPermission.RequestCertificate,
          ToolPermission.EmailNotificationConfiguration,
          ToolPermission.ViewPackageConfiguration,
          ToolPermission.ProjectSnagReport,
        ]
      },
      {
        role: Role.TemplateCreator,
        permissions: [
          ToolPermission.ViewProjectsMenuItem,
          ToolPermission.Projects,
        ],
      },
      {
        role: Role.MultiProjectObserver,
        permissions: [
          ToolPermission.ViewProjectsMenuItem,
          ToolPermission.Projects,
          ToolPermission.ViewDashboardMenuItem,
          ToolPermission.Dashboard,
          ToolPermission.ViewProjectMenu,
          ToolPermission.ViewProjectMenuAcceptancePackage,
          ToolPermission.ViewCertificateProjectMenu,
        ],
      },
      {
        role: Role.CustomerApprover,
        permissions: [
          ToolPermission.ViewProjectsMenuItem,
          ToolPermission.Projects,
          ToolPermission.ViewDashboardMenuItem,
          ToolPermission.Dashboard,
          ToolPermission.ViewProjectMenu,
          ToolPermission.ViewProjectMenuProjectView,
          ToolPermission.ViewProjectMenuAcceptancePackage,
          ToolPermission.ViewCertificateProjectMenu,
        ],
      },
      {
        role: Role.OpsAdmin,
        permissions: [
          ToolPermission.ViewUserManagementMenuItem,
          ToolPermission.UserManagement,
          ToolPermission.ConfigurationManagement,
          ToolPermission.ConfigurationManagementMenu,
          ToolPermission.ViewApplicationHealthCheck,
          ToolPermission.ViewCustomerOnboarding,
          ToolPermission.ViewProjectOnboardingMenuItem,
          ToolPermission.ProjectOnboarding,
          ToolPermission.ViewCustomerOnboardingMenuItem,
          ToolPermission.CustomerOnboarding,
          ToolPermission.CreateAcceptancePackage,
          ToolPermission.ViewAuditReportMenuItem,
          ToolPermission.AuditReport,
          ToolPermission.ViewHealthCheckMenuItem,
          ToolPermission.HealthCheck,
          ToolPermission.ViewWorkflowsMenuItem,
          ToolPermission.Workflows,
        ],
      },
      {
        role: Role.None,
        permissions: [],
      },
    ];

    return this.projectEventService.userSessionChange.pipe(
      take(1),
      map((userSession: UserSession) => {
        const userRoles = this.mapUserSessionRole(userSession);
        const userPermissions = roleDefinitions
          .filter(roleDefinition => userRoles.find(role => role === roleDefinition.role))
          .map(roleDefinition => roleDefinition.permissions)
          .reduce((prePermissions, currPermissions) => {
            return [...prePermissions, ...currPermissions];
          });
        return permission ? !!userPermissions.find((userPermission: string) => userPermission === permission) : true;
      })
    );
  }

  /**
   * Maps user session role with @type {Role}
   * @param userSession to map
   */
  mapUserSessionRole(userSession: UserSession): Role[] {
    const roles = [];
    userSession.roleType.forEach((r: string) => {
      if (r === 'Ericsson Contributor') {
        roles.push(Role.EricssonContributor);
      } else if (r === 'Customer Approver') {
        roles.push(Role.CustomerApprover);
      } else if (r === 'Operations Admin') {
        roles.push(Role.OpsAdmin);
      } else if (r === 'Customer Observer') {
        roles.push(Role.MultiProjectObserver);
      } else if (r === 'Project Admin') {
        roles.push(Role.ProjectAdmin);
      } else {
        roles.push(Role.None);
      }
    });
    return roles;
  }
}
