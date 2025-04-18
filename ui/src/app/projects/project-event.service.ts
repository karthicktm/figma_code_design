import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { ActiveItem, ApproverListNotification, GetProjectsResponse, SiteInfo, UserSession, UsersProjects } from './projects.interface';

@Injectable()
export class ProjectEventService {
  public approvalStatusChange: ReplaySubject<ApproverListNotification> = new ReplaySubject(1);
  public siteInViewChange: ReplaySubject<SiteInfo> = new ReplaySubject(1);
  public activeItemInViewChange: ReplaySubject<ActiveItem> = new ReplaySubject(1);
  public acceptancePackageChange: ReplaySubject<any> = new ReplaySubject(1);
  public userSessionChange: ReplaySubject<UserSession> = new ReplaySubject(1);
  public usersProjectsChange: ReplaySubject<GetProjectsResponse> = new ReplaySubject(1);

  private messageSource = new BehaviorSubject('');
  currentMessage = this.messageSource.asObservable();

  constructor() { }

  /**
   *
   * @param message this stores project linear ID of the project that is imported successfully
   */
  public emitData(message: string): void {
    this.messageSource.next(message);
  }

  public emitApprovalStatusChange(approvalNotification: ApproverListNotification): void {
    this.approvalStatusChange.next(approvalNotification);
  }

  public emitSiteInViewChange(site: SiteInfo): void {
    this.siteInViewChange.next(site);
  }

  public emitActiveItemInViewChange(item: ActiveItem): void {
    this.activeItemInViewChange.next(item);
  }
}
