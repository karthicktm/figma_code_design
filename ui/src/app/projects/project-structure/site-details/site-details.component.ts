import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { MessageDialogComponent } from '../../details-dialog/message-dialog/message-dialog.component';
import { SiteStructure } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';

@Component({
  selector: 'app-site-details',
  templateUrl: './site-details.component.html',
  styleUrls: ['./site-details.component.less']
})
export class SiteDetailsComponent implements OnInit, OnDestroy {
  public projectId: string;
  public siteId: string;
  private subscription: Subscription = new Subscription();
  public loadingData: boolean;
  // TODO: Add the type when response is confirmed from BE team
  public siteDetails: SiteStructure;
  constructor(
    private projectsServices: ProjectsService,
    private networkRollOutService: NetworkRollOutService,
    private dialogService: DialogService,
    private activeRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.siteId = this.activeRoute.snapshot.parent.paramMap.get('networkSiteId');
    this.projectId  = this.activeRoute.snapshot.parent.paramMap.get('id');
    this.fetchSiteDetails();
  }

  private fetchSiteDetails(): void {
    this.subscription.add(this.networkRollOutService.getSiteDetailsBySiteId(this.projectId, this.siteId).subscribe({
      next: (res: SiteStructure) => {
        this.loadingData = false;
        this.siteDetails = res;
      },
      error: (error) => {
        this.loadingData = false;
        const data = {
          title: 'Unable to load data',
          message: error.error.responseMessageDescription ? error.error.responseMessageDescription + ' Please try again after some time!' : 'Please try again after some time!',
        };
        const dialogComponentRef = this.dialogService.createDialog(MessageDialogComponent, data);
        return [];
      }
    }));
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
