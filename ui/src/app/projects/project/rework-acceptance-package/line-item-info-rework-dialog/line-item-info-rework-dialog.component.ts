import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription, tap } from 'rxjs';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { CustomerAcceptanceStatus, LineItemInfo, PackageLineItem } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';

export interface Data {
  lineItemDetails: PackageLineItem;
  packageId: string;
  packageStatus: CustomerAcceptanceStatus;
  projectId: string;
}

@Component({
  selector: 'app-line-item-info-rework-dialog',
  templateUrl: './line-item-info-rework-dialog.component.html',
  styleUrls: ['./line-item-info-rework-dialog.component.less']
})
export class LineItemInfoReworkDialogComponent extends EDSDialogComponent implements OnInit, OnDestroy {
  lineItemDetails: LineItemInfo;
  packageId: string;
  packageStatus: string;
  private subscription: Subscription = new Subscription();

  constructor(
    @Inject(DIALOG_DATA) public inputData: Data,
    private projectsService: ProjectsService,
  ) {
    super();
    const lineItemDetails: LineItemInfo = {
      internalId: inputData.lineItemDetails.internalId,
      lineItemId: inputData.lineItemDetails.id,
      lineItemName: inputData.lineItemDetails.name,
      description: inputData.lineItemDetails.description,
      acceptanceCriteria: undefined,
      status: inputData.lineItemDetails.status,
      priority: undefined,
      isAcceptanceRequired: undefined,
      extendedAttributes: [],
      createdBy: undefined,
      createdDate: undefined,
      lastModifiedBy: inputData.lineItemDetails.lastModifiedBy,
      lastModifiedDate: inputData.lineItemDetails.lastModifiedDate,
    };
    this.lineItemDetails = lineItemDetails;
    this.packageId = inputData.packageId;
    this.packageStatus = inputData.packageStatus;
  }

  ngOnInit(): void {
    this.fetchLineItemDetails();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private fetchLineItemDetails(): void {
    const getLineItemDetails = this.projectsService.getLineItemInfo(this.inputData.projectId, this.inputData.lineItemDetails.internalId).pipe(
      tap(data => {
        this.lineItemDetails = data;
      }),
    );
    this.subscription.add(getLineItemDetails.subscribe());
  }

  onClose(): void {
    this.dialog.hide();
  }
}
