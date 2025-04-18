import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, ResolveStart, Router, Scroll } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ReplaySubject, Subscription } from 'rxjs';

import { Dropdown, Layout } from '@eds/vanilla';
import { Title } from '@angular/platform-browser';
import { NotificationService } from './portal/services/notification.service';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { AngularPlugin as AppInsightsAngularPlugin } from '@microsoft/applicationinsights-angularplugin-js';
import { CacheKey, SessionStorageService } from './portal/services/session-storage.service';
import { ProjectEventService } from './projects/project-event.service';
import { UserSession } from './projects/projects.interface';
import { ProjectsService } from './projects/projects.service';
import { AppbarService } from './portal/foundations/appbar/appbar.service';
import { AuthenticationService } from './auth/authentication.service';
import { ThemeSwitchService } from './portal/services/theme-switch.service';
import { ConfigurationService } from './configuration-management/configuration.service';
import { Configuration } from './configuration-management/configuration.interface';
import { NavigationService } from './shared/navigation.service';
import { SwUpdateService } from './sw-update.service';
import RoleTitleMapping from './auth/role-mapping.utils';
import { StatutoryNotificationComponent } from './portal/foundations/statutory-notification/statutory-notification.component';

export enum AppConfigKey {
  appInsightsInstrumentationKey = 'InstrumentationKey',
  groupUsersDisplayMaxCount = 'GroupUsers_Display_MaxCount',
  eSupportTicketLink = 'SUPPORT_TICKET_URL',
  blockChainIntegration = 'INTEGRATE_TO_BLOCKCHAIN',
  statutory = 'statutory',
  transferEnabledCustomers = 'TRANSFER_ENABLED_CUSTOMERS',
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'Ericsson Customer Acceptance';
  customerUserSupportLink = 'https://www.ericsson.com/en/contact/extranet-support/portal-application-problem';
  public loading = true;
  public error = false;
  version: string;
  showAlreadyOnLatestVersionInfo: ReplaySubject<boolean> = new ReplaySubject(1);
  userSession: UserSession = {
    firstName: '',
    lastName: '',
    emailId: '',
    signum: '',
    userType: '',
    roleType: [],
    accessToken: '',
    expiresAt: 0,
    refreshToken: ''
  };

  RoleTooltipMapping = RoleTitleMapping.roleTooltipMapping;
  AppConfigKey = AppConfigKey;

  private scripts: Scripts[] = [];

  @ViewChild('helpDropdown') readonly helpDropdownElementRef: ElementRef<HTMLElement>;
  private subscription: Subscription = new Subscription();
  @ViewChild(StatutoryNotificationComponent) readonly statutoryNotificationComponent: StatutoryNotificationComponent;

  constructor(
    private titleService: Title,
    private renderer: Renderer2,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private elementRef: ElementRef,
    private notificationService: NotificationService,
    private sessionStorage: SessionStorageService,
    private projectEventService: ProjectEventService,
    private projectService: ProjectsService,
    private appbarService: AppbarService,
    private authenticationService: AuthenticationService,
    private themeSwitchService: ThemeSwitchService,
    private configurationService: ConfigurationService,
    // important to keep the routing history of the whole app though the service is not really used in app component
    private navigationService: NavigationService,
    public promptUpdateService: SwUpdateService,
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof ResolveStart) {
        // this.isSignedIn = (event.url === '/signin');
      }

      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          const appContent = this.elementRef.nativeElement.querySelector('.appcontent');
          if (appContent) {
            this.renderer.setProperty(appContent, 'scrollTop', 0);
          }
        });
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof Scroll)
    ).subscribe((event: any) => {
      setTimeout(() => {
        const element = document.getElementById(event.anchor);
        if (element) {
          element.scrollIntoView();
        }
      });
    });

    // https://ultimatecourses.com/blog/dynamic-page-titles-angular-2-router-events
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map(route => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap(route => route.data)
      )
      .subscribe(data => {
        this.titleService.setTitle(data.metaTitle || `Ericsson Customer Acceptance ${data.title || ''}`);
      });
  }

  ngOnInit(): void {
    fetch('./assets/version.json')
      .then((response) => { return response.json() })
      .then(versionFile => this.version = versionFile.version);
    this.promptUpdateService.isUpdateAvailable.subscribe({
      next: (isUpdate) => {
        if (isUpdate === false) {
          this.showAlreadyOnLatestVersionInfo.next(true);
          setTimeout(() => this.showAlreadyOnLatestVersionInfo.next(false), 10 * 1000)
        }
      },
    })
    this.appbarService.isLoading.next(this.loading);
    // Fallback if no cookie for emailId is set
    if (this.userSession.emailId.length < 1) {
      this.projectService.getUserSession().subscribe({
        next: (userSession: UserSession) => {
          this.userSession = userSession;
          this.runPostUserSessionRetrieval();
          this.loading = false;
          this.appbarService.isLoading.next(this.loading);

          this.error = false;
          this.appbarService.isError.next(this.error);
        },
        error: (error) => {
          this.loading = false;
          this.appbarService.isLoading.next(this.loading);

          this.error = true;
          this.appbarService.isError.next(this.error);

          // 403 + message from server.js
          if (error && error.error && error.error.error && error.error.error.message === 'User is inactive') {
            // UserRoleMessage.USER_INACTIVE
            this.appbarService.errorReason.next(2)
          } else {
            // UserRoleMessage.USER_NO_ROLE
            this.appbarService.errorReason.next(1)
          }
        }
      })
    } else {
      this.runPostUserSessionRetrieval();
    }
    const themeSwitch = this.themeSwitchService as any;
    const selectedTheme = localStorage.getItem('theme');
    if (selectedTheme && selectedTheme !== 'light') {
      themeSwitch._setClassNames();
    }
  }

  private runPostUserSessionRetrieval(): void {
    this.sessionStorage.save(CacheKey.userSession, this.userSession);
    this.retrieveAllConfigurations();
    this.projectEventService.userSessionChange.next(this.userSession);

    const userLogin = this.authenticationService.login().subscribe({
      next: () => {
        userLogin.unsubscribe();
      }
    });
  }

  ngAfterViewInit(): void {
    const layout = new Layout(document.body);
    layout.init();
    this.scripts.push(layout);

    this.initNotificationLog();

    const dropdownDOM = this.helpDropdownElementRef?.nativeElement;
    if (dropdownDOM) {
      const dropdown = new Dropdown(dropdownDOM);
      dropdown.init();
    }
    
    this.hideNav();
  }
  
  hideNav(): void {
    // Hide navigation as of EDS instance of appbar.events.hideNavigation = new CustomEvent('hideNavigation').
    document.dispatchEvent(new CustomEvent('hideNavigation'))
  }

  initNotificationLog(): void {
    this.notificationService.initNotificationLog();
  }

  /**
   * Initialize this instance of ApplicationInsights with app configuration.
   */
  private loadAppInsights(instrumentationKey): void {
    if (instrumentationKey
      && instrumentationKey.length > 0) {
      // Set up Application Insights
      // see https://github.com/microsoft/applicationinsights-angularplugin-js
      const appInsightsAngularPlugin = new AppInsightsAngularPlugin();
      const appInsights = new ApplicationInsights({
        config: {
          instrumentationKey: instrumentationKey,
          extensions: [appInsightsAngularPlugin],
          extensionConfig: {
            [appInsightsAngularPlugin.identifier]: { router: this.router }
          }
        }
      });
      appInsights.loadAppInsights();
    }
  }

  onThemeChange(theme: string): void {
    localStorage.setItem('theme', theme);
  }

  public signout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.authenticationService.logout();
  }

  /**
   * Get list of configurations and update the configuration table and save in local storage
   */
  private retrieveAllConfigurations(): void {
    this.subscription.add(
      this.configurationService.getAllConfigurations().subscribe(data => {
        const getConfig = (key: string): Promise<Configuration> => {
          return new Promise((resolve) => {
            const config = data.find((config) => config.key === key);
            config && resolve(config);
          });
        };

        getConfig(AppConfigKey.groupUsersDisplayMaxCount).then((config) => {
          localStorage.setItem('groupUsersDisplayMaxCount', config.value);
        })

        getConfig(AppConfigKey.appInsightsInstrumentationKey).then((config) => {
          this.loadAppInsights(config.value);
        })

        getConfig(AppConfigKey.blockChainIntegration).then((config) => {
          localStorage.setItem('isBlockChainValidate', config.value)
        })

        getConfig(AppConfigKey.statutory).then((config) => {
          const localConfig = this.getLocalConfig(AppConfigKey.statutory)
          localStorage.setItem(AppConfigKey.statutory, JSON.stringify({...localConfig, ...{ text: config.value }}));
        });

        getConfig(AppConfigKey.eSupportTicketLink).then((config) => {
          localStorage.setItem('eSupportTicketLink', config.value);
          const elem = document.getElementById('raiseSupportTicket')
          if (elem) {
            if (this.userSession.userType && this.userSession.userType.toLowerCase() === 'Ericsson'.toLowerCase()) {
              elem.setAttribute('href', config.value || '');
            } else if (this.userSession.userType && this.userSession.userType.toLowerCase() === 'Customer'.toLowerCase()) {
              elem.setAttribute('href', this.customerUserSupportLink);
            }
          }
        });

        getConfig(AppConfigKey.transferEnabledCustomers).then(config => {
          localStorage.setItem(AppConfigKey.transferEnabledCustomers, config.value);
        });
      })
    );
  }

  getLocalConfig(storageKey: AppConfigKey.statutory): any {
    const localConfigString = localStorage.getItem(storageKey);
    try {
      return JSON.parse(localConfigString);
    } catch {
      return {};
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  reloadPage(): void {
    document.location.reload();
  }
}
