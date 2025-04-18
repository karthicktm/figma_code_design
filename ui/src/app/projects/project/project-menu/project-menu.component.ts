import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, shareReplay, Subscription, tap } from 'rxjs';
import { AuthorizationService, ToolPermission } from 'src/app/auth/authorization.service';
import { ProjectsService } from '../../projects.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { ReminderConfigurationDialogComponent } from '../../details-dialog/reminder-configuration-dialog/reminder-configuration-dialog.component';
import { EmailNotificationConfigurationDialogComponent } from '../../details-dialog/email-notification-configuration-dialog/email-notification-configuration-dialog.component';
import { ProjectDetails, ProjectReportType, SourceTool } from '../../projects.interface';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { CacheKey } from 'src/app/portal/services/session-storage.service';
import { StoreService } from '../store.service';

@Component({
  selector: 'app-project-menu',
  templateUrl: './project-menu.component.html',
  styleUrls: ['./project-menu.component.less']
})
export class ProjectMenuComponent implements OnInit, OnDestroy {
  public projectLinearId: string;
  project: Observable<ProjectDetails>;
  ProjectReportType = ProjectReportType;
  ToolPermission = ToolPermission;
  private subscription: Subscription = new Subscription();

  constructor(
    private activeRoute: ActivatedRoute,
    private projectService: ProjectsService,
    private networkRollOutService: NetworkRollOutService,
    private authorizationService: AuthorizationService,
    private dialogService: DialogService,
    private storeService: StoreService,
  ) { }

  ngOnInit(): void {
    const paramMapObservable = this.activeRoute.paramMap.pipe(
      tap(paramMap => {
        const projectId = paramMap.get('id');
        this.projectLinearId = projectId;
        this.project = this.projectService.getProjectDetails(projectId).pipe(
          shareReplay(),
          tap(projectData => {
            const projectId = projectData.projectId
            const customerId = projectData.customerId
            const sourceTool = projectData.sourceTool
            this.storeService.save(CacheKey.currentProject, { projectId, customerId, sourceTool })
          }),
        );        
      })
    );
    this.subscription.add(paramMapObservable.subscribe());
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * open dialog for configuration setup
   */
  public onPackageConfigure(): void {
    const dialog = this.dialogService.createDialog(ReminderConfigurationDialogComponent, this.projectLinearId);
  }

  openEmailNotificationConfiguration(projectId: string): void {
    this.dialogService.createDialog(EmailNotificationConfigurationDialogComponent,
      { notifications: this.networkRollOutService.fetchEmailNotificationConfiguration(projectId) });
  }

  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.authorizationService.isUserAuthorized(permission);
  }

  public isPackageCreationAllowed(project: ProjectDetails): boolean {
    return this.projectService.isProjectPackageManagementInternal(project?.sourceTool as SourceTool) && project.packageCreationAllowed;
  }
  
  isPackageCreationSupported(sourceTool: SourceTool): boolean {
    return this.projectService.isProjectPackageManagementInternal(sourceTool)
  }
}
