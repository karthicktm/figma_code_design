import { Component, EventEmitter, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-acceptance-decision-dialog',
  templateUrl: './acceptance-decision-dialog.component.html',
  styleUrls: ['./acceptance-decision-dialog.component.less']
})
export class AcceptanceDecisionDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<any> = new EventEmitter();
  submitButtonEnabled = false;
  workplans;
  site;
  packageComponents: any;
  submitVerdictrequestBody: any;
  projectLinearId: string;
  activityCount: number = 0;
  mileStoneCount: number = 0;
  workPlanCount: number = 0;
  siteCount: number = 0;
  constructor(
    @Inject(DIALOG_DATA) public data: any,
  ) {
    super();

    this.workplans = data.workplanBySite.workplanDetails;
    this.site = data.workplanBySite;
    this.packageComponents = data.packageCompnent;
    this.projectLinearId = data.projectLinearId;

  }
  message = `Submit your acceptance decision for each item`;

  submitVerdict(): void {
    this.dialogResult.emit({ res: this.packageComponents });
  }

  submitItemDecision(item: any, itemType: string, event): void {
    let packageComponentToUpdate;

    if (this.workplans.length > 0) {
      if (this.workplans[0].activities.length > 0 || this.workplans[0].milestones.length > 0) {
        this.workplans.forEach(workplan => {
          if (itemType === 'activity') {
            workplan.activities.forEach(activity => {
              if (event.target.name === activity.activityName) {
                if (event.target.checked) {
                  this.activityCount++;
                }
              }
            });
            packageComponentToUpdate = this.packageComponents.find(component => component.mappedItemLinearId === item.activityLinearId);
          }

          if (itemType === 'milestone') {
            workplan.milestones.forEach(milestone => {
              if (event.target.name === milestone.milestoneName) {
                if (event.target.checked) {
                  this.mileStoneCount++;
                }
              }
            });
            packageComponentToUpdate = this.packageComponents.find(component => component.mappedItemLinearId === item.milestoneLinearId);
          }
        });
      }
      else {
        this.workplans.forEach(workplan => {
          if (itemType === 'workplan') {
            if (event.target.name === workplan.workplanName) {
              if (event.target.checked) {
                this.workPlanCount++;
              }
            }
            packageComponentToUpdate = this.packageComponents.find(component => component.mappedItemLinearId === item.workplanLinearId);
          }
        });
      }
    }
    else {
      if (itemType === 'site') {
        if (event.target.name === this.site.siteName) {
          if (event.target.checked) {
            this.siteCount++;
          }
        }
        packageComponentToUpdate = this.packageComponents.find(component =>
          component.mappedItemLevel === 'SITE' && component.mappedItemId === item.siteId
        );
      }
    }

    if (!!packageComponentToUpdate) {
      packageComponentToUpdate.approverStatus[0].verdict = event.target.value.toUpperCase();
    }
    if (this.workplans.length === this.workPlanCount) {
      this.submitButtonEnabled = true;
    }
    else if ((this.workplans[0].activities.length === this.activityCount) && (this.workplans[0].milestones.length === this.mileStoneCount)) {
      this.submitButtonEnabled = true;
    }
    else if (this.workplans.length === 0) {
      if (this.site.length === this.siteCount) {
        this.submitButtonEnabled = true;
      }
    }
  }
}
