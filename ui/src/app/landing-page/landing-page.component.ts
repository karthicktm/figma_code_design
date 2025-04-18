import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AuthorizationService } from '../auth/authorization.service';
import { AppbarService } from '../portal/foundations/appbar/appbar.service';
import { ProjectEventService } from '../projects/project-event.service';
import { UserRoleMessage, UserSession } from '../projects/projects.interface';
import { ConfigurationService } from '../configuration-management/configuration.service';

enum AppConfigKey {
  eSupportTicketLink = 'SUPPORT_TICKET_URL'
}

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.less']
})
export class LandingPageComponent implements OnInit {
  title = `Ericsson
    Customer Acceptance`;
  userSession: UserSession;
  customerUserSupportLink = 'https://www.ericsson.com/en/contact/extranet-support/portal-application-problem';
  public showLoader: boolean;
  public showError: boolean;
  public errorReason: number;

  private subscriptions: Subscription = new Subscription();

  // message for logged in user in landing page
  LandingPageUserMessage = UserRoleMessage;

  constructor(
    private authorizationService: AuthorizationService,
    private appbarService: AppbarService,
    private projectEventService: ProjectEventService,
    private configurationService: ConfigurationService,
  ) { }

  ngOnInit(): void {
    this.showLoader = true;
    this.appbarService.isLoading.subscribe(data => {
      this.showLoader = data;
    });

    this.showError = false;
    this.appbarService.isError.subscribe(data => {
      this.showError = data;
    });
    this.appbarService.errorReason.subscribe(data => {
      this.errorReason = data;
    });

    this.subscriptions.add(this.projectEventService.userSessionChange.subscribe({
      next: (userSession) => {
        this.userSession = userSession;
      }
    }));

    this.subscriptions.add(
      this.configurationService.getAllConfigurations().subscribe(data => {
        const config = data.find((config) => config.key === AppConfigKey.eSupportTicketLink);
        localStorage.setItem('eSupportTicketLink', config.value);
        const elem = document.getElementById('landingRaiseSupportTicket')
        if (elem) {
          if (this.userSession.userType && this.userSession.userType.toLowerCase() === 'Ericsson'.toLowerCase()) {
            elem.setAttribute('href', config.value || '');
          } else if (this.userSession.userType && this.userSession.userType.toLowerCase() === 'Customer'.toLowerCase()) {
            elem.setAttribute('href', this.customerUserSupportLink);
          }
        }
      }));
  }

  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.authorizationService.isUserAuthorized(permission);
  }

  reloadPage(): void {
    document.location.reload();
  }
}
