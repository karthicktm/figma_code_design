import { Component, Inject, OnInit } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { ProjectsService } from '../../projects.service';

@Component({
  selector: 'app-project-details-dialog',
  templateUrl: './project-details-dialog.component.html',
  styleUrls: ['./project-details-dialog.component.less']
})
export class ProjectDetailsDialogComponent extends EDSDialogComponent implements OnInit {

  public projectId: string;
  public projectDetails;

  constructor(
    private projectsService: ProjectsService,
    @Inject(DIALOG_DATA) public inputData: { projectId: string },
  ) {
    super();
    this.projectId = inputData.projectId;
  }

  ngOnInit(): void {
    this.getProjectDetails();
  }

  public getProjectDetails(): void {
    this.projectsService.getProjectDetails(this.projectId).subscribe({
      next: (projectDetails) => {
        this.projectDetails = projectDetails;
      },
      error: (error) => {
        // Do something to handle error
      },
    });
  }

}
