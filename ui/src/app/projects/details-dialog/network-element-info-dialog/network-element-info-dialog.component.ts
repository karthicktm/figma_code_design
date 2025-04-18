import { Component, Inject, OnInit } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { SiteStructure } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';

@Component({
  selector: 'app-network-element-info-dialog',
  templateUrl: './network-element-info-dialog.component.html',
  styleUrls: ['./network-element-info-dialog.component.less']
})
export class NetworkElementInfoDialogComponent extends EDSDialogComponent implements OnInit {
  id: string;
  mapData: any;
  packageId: string;
  projectId: string;
  public details: SiteStructure;
  constructor(@Inject(DIALOG_DATA) public inputData: any,
    private projectService: ProjectsService,) {
    super();
    this.id = inputData.id;
    this.packageId = inputData.packageId;
    this.projectId = inputData.projectId;
  }

  ngOnInit(): void {
    this.getNetworkElementInfoById();
  }
  public getNetworkElementInfoById(): void {
    //logic here
    this.projectService.getSiteDetailsBySiteId(this.projectId, this.id).subscribe((data: SiteStructure) => {
      this.details = data;
    });
  }
}
