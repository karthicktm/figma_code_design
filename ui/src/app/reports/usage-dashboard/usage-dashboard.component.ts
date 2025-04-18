import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppbarService } from 'src/app/portal/foundations/appbar/appbar.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import { UsageDashboardFilterComponent } from '../usage-dashboard-filter/usage-dashboard-filter.component';
import { ChartData, UsageDashboardResponse } from 'src/app/projects/projects.interface';
import { HttpStatusCode } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ColorScale } from '@eds/vanilla';

@Component({
  selector: 'app-usage-dashboard',
  templateUrl: './usage-dashboard.component.html',
  styleUrls: ['./usage-dashboard.component.less']
})
export class UsageDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  private selectedYear: string;
  private selectedCountry: string;
  errorMessage: string;

  public loadingUsageData: boolean;
  chartHeight = 300;
  totalNumberPackages: ChartData;
  leadTimePackages: ChartData;
  totalNumberPackagesColorScale: ColorScale;
  leadTimeColorScale: ColorScale;

  constructor(
    private appbarService: AppbarService,
    private projectService: ProjectsService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.totalNumberPackagesColorScale = new ColorScale({
      colors: [
        'color-status-green',
        'color-status-red',
        'color-status-blue',
        'color-status-purple',
        'color-status-orange',
        'color-status-gray',
      ]
    });
    this.totalNumberPackagesColorScale.init();

    this.leadTimeColorScale = new ColorScale({
      colors: [
        'color-status-blue'
      ]
    });
    this.leadTimeColorScale.init();
  }

  ngAfterViewInit(): void {
    const filters = this.appbarService.loadAction(UsageDashboardFilterComponent);
    (filters.instance as UsageDashboardFilterComponent).filterSelection.subscribe(selectedOptions => {
      this.errorMessage = '';
      if (!!selectedOptions.year && !!selectedOptions.country) {
        if (selectedOptions.year !== this.selectedYear || selectedOptions.country !== this.selectedCountry) {
          this.selectedYear = selectedOptions.year;
          this.selectedCountry = selectedOptions.country;
          this.retrieveUsageData();
        }
      } else {
        this.errorMessage = 'No data to display. Please select a year and country.';
      }
    });
  }

  ngOnDestroy(): void {
    this.appbarService.clearAction();

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private retrieveUsageData(): void {
    this.loadingUsageData = true;
    const country = this.selectedCountry !== 'All'? this.selectedCountry : undefined;
    this.subscription.add(this.projectService.getUsageDashboard(this.selectedYear, country).subscribe({
      next: (data: UsageDashboardResponse) => {
        const usageData = data.usagedata;
        const common = usageData.map(data => data.customerName);
        this.totalNumberPackages = {
          common,
          series: [
            {name: 'Approved', values: usageData.map(data => data.packageStatus.CustomerApproved)},
            {name: 'Rejected', values: usageData.map(data => data.packageStatus.CustomerRejected)},
            {name: 'Reworked pending approval', values: usageData.map(data => data.packageStatus.CustomerReworkedPendingApproval)},
            {name: 'Reworked', values: usageData.map(data => data.packageStatus.CustomerReworked)},
            {name: 'New pending approval', values: usageData.map(data => data.packageStatus.CustomerNewPendingApproval)},
            {name: 'New', values: usageData.map(data => data.packageStatus.CustomerNew)}
          ]
        }
        this.leadTimePackages = {
          common,
          series: [{name: 'Days', values: usageData.map(data => data.averageLeadTime)}]
        }
        this.loadingUsageData = false;
      },
      error: (error) => {
        this.loadingUsageData = false;
        this.totalNumberPackages = undefined;
        this.leadTimePackages = undefined;
        this.errorMessage = 'No data to display.';

        if (error.status === HttpStatusCode.BadGateway || error.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: 'Error retrieving usage data!',
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else{
          this.notificationService.showNotification({
            title: 'Error retrieving usage data!',
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
      },
    }));
  }
}
