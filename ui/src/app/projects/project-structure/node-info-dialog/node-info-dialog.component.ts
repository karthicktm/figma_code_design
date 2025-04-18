import { Component, computed, Inject, OnInit, signal } from '@angular/core';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ChecklistDetail, LineItemInfo, WorkItemInfo } from '../../projects.interface';
import AcceptancePackageUtils from '../../project/acceptance-package-utilities';
import { NodeType } from '../node-type.interface';

@Component({
  selector: 'app-node-info-dialog',
  templateUrl: './node-info-dialog.component.html',
  styleUrls: ['./node-info-dialog.component.less']
})
export class NodeInfoDialogComponent extends EDSDialogComponent implements OnInit {
  public workItemInfo: WorkItemInfo;
  public checklistDetail: ChecklistDetail;
  public lineItemDetails: LineItemInfo;
  public nodeType: string;
  public type: string;
  public nodeId: string;
  public projectId: string;
  public NodeType = NodeType;
  protected isLoadingData = signal<boolean>(false);
  protected valuePlaceholder = computed<'--' | '...'>(() => {
    const isLoadingData = this.isLoadingData();
    return isLoadingData ? '...' : '--';
  });

  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      nodeType: string,
      type: string,
      nodeId: string,
      projectId: string,
    },
    private notificationService: NotificationService,
    private networkRollOutService: NetworkRollOutService
  ) {
    super();
    this.nodeType = inputData.nodeType;
    this.nodeId = inputData.nodeId;
    this.projectId = inputData.projectId;
    this.type = inputData.type;
  }

  ngOnInit(): void {
    if (this.nodeType === NodeType.Checklist) {
      this.fetchChecklistDetailsByLinearId();
    }
    else if (this.nodeType === NodeType.LineItemInfo) {
      this.fetchLineItemDetails();
    }
    else {
      this.fetchWorkItemDetailsByLinearId();
    }
  }

  public fetchWorkItemDetailsByLinearId(): void {
    this.isLoadingData.set(true);
    this.networkRollOutService.getWorkItemDetailsByLinearId(this.projectId, this.nodeId).subscribe({
      next: (WorkItemInfo: WorkItemInfo) => {
        this.workItemInfo = WorkItemInfo;
        this.isLoadingData.set(false);
      },
      error: (error) => {
        this.isLoadingData.set(false);
        this.showNotification();
      }
    });
  }

  public fetchChecklistDetailsByLinearId(): void {
    this.isLoadingData.set(true);
    this.networkRollOutService.getChecklistDetailsByLinearId(this.projectId, this.nodeId).subscribe({
      next: (checklistDetail: ChecklistDetail) => {
        this.checklistDetail = checklistDetail;
        this.isLoadingData.set(false);
      },
      error: (error) => {
        this.isLoadingData.set(false);
        this.showNotification();
      }
    });
  }

  public fetchLineItemDetails(): void {
    this.isLoadingData.set(true);
    this.networkRollOutService.getLineItemInfo(this.projectId, this.nodeId).subscribe({
      next: (lineItemDetails: LineItemInfo) => {
        this.lineItemDetails = lineItemDetails;
        this.isLoadingData.set(false);
      },
      error: (error) => {
        this.isLoadingData.set(false);
        this.showNotification();
      }
    });
  }

  public showNotification(): void {
    this.notificationService.showNotification({
      title: 'Error while loading data!',
      description: 'Please try again later'
    });
  }

  getStatusColor(status: string): string {
    return AcceptancePackageUtils.getStatusColor(status);
  }

  getStatus(status: string): string {
    return AcceptancePackageUtils.getStatus(status);
  }
}
