import { HttpStatusCode } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionComponent } from 'src/app/portal/foundations/appbar/action.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { GetCountriesResponse } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';

export interface FilterSelection {
  year?: string;
  country?: string;
}

@Component({
  selector: 'app-usage-dashboard-filter',
  templateUrl: './usage-dashboard-filter.component.html',
  styleUrls: ['./usage-dashboard-filter.component.less']
})
export class UsageDashboardFilterComponent implements ActionComponent, OnDestroy {
  @Input() data: any;
  @Output() filterSelection = new EventEmitter<FilterSelection>();

  private subscription: Subscription = new Subscription();
  fetchingCountry: boolean;
  countryList: string[];
  yearList: string[];
  selectedFilters: FilterSelection;

  constructor(
    private projectService: ProjectsService,
    private notificationService: NotificationService,
  ) {
    this.retrieveCountryList();
    this.generateYearList();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onSelectYearHandler(value: string): void {
    this.selectedFilters = {...this.selectedFilters, year: value};
    this.filterSelection.next(this.selectedFilters);
  }

  onSelectCountryHandler(value: string): void {
    this.selectedFilters = {...this.selectedFilters, country: value};
    this.filterSelection.next(this.selectedFilters);
  }

  private retrieveCountryList(): void {
    this.fetchingCountry = true;
    this.subscription.add(this.projectService.getCountries().subscribe({
      next: (data: GetCountriesResponse) => {
        this.fetchingCountry = false;
        const countries = data.countries;
        countries.unshift('All');
        this.countryList = countries;
        this.selectedFilters = {...this.selectedFilters, country: this.countryList[0]};
        this.filterSelection.next(this.selectedFilters);
      },
      error: (err) => {
        console.error(err);
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: `Error getting list of countries`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else{
          this.notificationService.showNotification({
            title: `Error getting list of countries`,
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
        this.fetchingCountry = false;
      }
    }));
  }

  private generateYearList(): void {
    const currentYear = (new Date()).getFullYear();
    this.yearList = Array.from({ length: (currentYear - 2022 + 1) }, (_, i) => (currentYear - i).toString());

    this.selectedFilters = {...this.selectedFilters, year: this.yearList[0]};
    this.filterSelection.next(this.selectedFilters);
  }
}
