import { Component, Inject, OnInit } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { WorkItemInfo } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';
import AcceptancePackageUtils from '../../project/acceptance-package-utilities';

@Component({
  selector: 'app-work-item-info-dialog',
  templateUrl: './work-item-info-dialog.component.html',
  styleUrls: ['./work-item-info-dialog.component.less']
})
export class WorkItemInfoDialogComponent extends EDSDialogComponent implements OnInit {
  id: string;
  packageId: string;
  projectId: string;
  public details: WorkItemInfo;
  constructor(@Inject(DIALOG_DATA) public inputData: any,
    private projectService: ProjectsService,) {
    super();
    this.id = inputData.id;
    this.packageId = inputData.packageId;
    this.projectId = inputData.projectId;
  }

  ngOnInit(): void {
    this.getWorkItemInfoById();
  }
  public getWorkItemInfoById(): void {
    this.projectService.getWorkItemDetailsByLinearId(this.projectId, this.id).subscribe((data: WorkItemInfo) => {
      this.details = data;
    });
  }

  getStatusColor(status: string): string {
    return AcceptancePackageUtils.getStatusColor(status);
  }

  getStatus(status: string): string {
    return AcceptancePackageUtils.getStatus(status);
  }

}
