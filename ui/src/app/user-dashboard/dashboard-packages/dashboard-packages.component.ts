import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApproverPackagesComponent } from '../approver-packages/approver-packages.component';
import { ObserverPackagesComponent } from '../observer-packages/observer-packages.component';

export enum DashboardRoleType {
  Approver = 'CustomerApprover',
  Observer = 'CustomerObserver',
}

@Component({
  selector: 'app-dashboard-packages',
  standalone: true,
  imports: [
    ApproverPackagesComponent,
    ObserverPackagesComponent,
  ],
  templateUrl: './dashboard-packages.component.html',
  styleUrl: './dashboard-packages.component.less'
})
export class DashboardPackagesComponent implements OnInit, OnDestroy {
  private readonly tabQueryParameterKey = 'dashboardTab';
  private readonly statusQueryParameterKey = 'status';
  private readonly slaOverdueText = 'SlaOverdue';
  private readonly noSlaOverdueText = 'NoSlaOverdue';
  private subscription: Subscription = new Subscription();

  DashboardRoleType = DashboardRoleType;
  protected roleType = signal<DashboardRoleType>(undefined);
  protected status = signal<string>(undefined);
  protected slaOverdue = signal<boolean>(undefined);

  constructor(
    private activeRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.subscription.add(this.activeRoute.queryParamMap.subscribe((queryParams: ParamMap) => {
      const tabParam = queryParams.get(this.tabQueryParameterKey);
      if (tabParam) {
        if (tabParam === 'packageApprover') this.roleType.set(DashboardRoleType.Approver);
        else this.roleType.set(DashboardRoleType.Observer);
      } else {
        console.error('Component used in unknown route configuration.');
      }

      const statusParam = queryParams.get(this.statusQueryParameterKey);
      if (statusParam) {
        const statusArray = statusParam.split(',');
        if (statusArray.includes(this.slaOverdueText)) {
          this.slaOverdue.set(true);
          this.status.set(statusArray.filter(status => status !== this.slaOverdueText).join())
        } else if (statusArray.includes(this.noSlaOverdueText)) {
          this.slaOverdue.set(false);
          this.status.set(statusArray.filter(status => status !== this.noSlaOverdueText).join());
        } else {
          this.slaOverdue.set(undefined);
          this.status.set(statusParam);
        }
      } else {
        console.error('Component used in unknown route configuration.');
      }
    }));
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
