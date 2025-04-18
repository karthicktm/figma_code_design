import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { PortalModule } from './portal/portal.module';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { AuthModule } from './auth/auth.module';
import { RequestAccessDialogComponent } from './request-access-dialog/request-access-dialog.component';
import { MenuItemComponent } from './landing-page/menu-item/menu-item.component';
import { FeedbackDialogComponent } from './feedback-dialog/feedback-dialog.component';
import { ProjectsService } from './projects/projects.service';
import { ConfigurationService } from './configuration-management/configuration.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { ProjectEventService } from './projects/project-event.service';
import { httpInterceptorProviders } from './http-interceptors';
import { DragulaModule } from 'ng2-dragula';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { UserManagementModule } from './user-management/user-management.module';
import { ConfigurationManagementModule } from './configuration-management/configuration-management.module';
import { WarningDialogComponent } from './warning-dialog/warning-dialog.component';
import { MonitoringModule } from './monitoring/monitoring/monitoring.module';
import { MessageDialogComponent } from './projects/details-dialog/message-dialog/message-dialog.component';
import { CustomerService } from './customer-onboarding/customer.service';
import { HelpModule } from './help/help.module';
import { NavigationService } from './shared/navigation.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { RecentPackageHistoryComponent } from './projects/recent-package-history/recent-package-history.component';
import { FeedbackLoaderDirective } from './feedback/feedback-document-loader.directive';
import { StatutoryNotificationComponent } from './portal/foundations/statutory-notification/statutory-notification.component';
import { BadgeComponent } from './landing-page/landing-page-badge/badge.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    MenuItemComponent,
    RequestAccessDialogComponent,
    FeedbackDialogComponent,
    ConfirmationDialogComponent,
    WarningDialogComponent,
    MessageDialogComponent,
    RecentPackageHistoryComponent
],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    PortalModule,
    AuthModule,
    DragulaModule.forRoot(),
    HelpModule,
    UserManagementModule,
    ConfigurationManagementModule,
    MonitoringModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    FeedbackLoaderDirective,
    StatutoryNotificationComponent,
    BadgeComponent
  ],
  providers: [
    ProjectsService,
    ConfigurationService,
    ProjectEventService,
    httpInterceptorProviders,
    DatePipe,
    TitleCasePipe,
    CustomerService,
    NavigationService,
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule { }
