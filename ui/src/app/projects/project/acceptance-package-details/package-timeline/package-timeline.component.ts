import { Component, effect, ElementRef, input, OnDestroy, signal, viewChild } from '@angular/core';
import { Timeline } from '@eds/vanilla';
import { Subscription } from 'rxjs';
import { ProjectsService } from 'src/app/projects/projects.service';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CustomerAcceptanceStatus } from 'src/app/projects/projects.interface';
import { timeLineConfig } from 'src/app/portal/portal.constants';

@Component({
  selector: 'app-package-timeline',
  standalone: true,
  imports: [],
  templateUrl: './package-timeline.component.html',
  styleUrl: './package-timeline.component.less'
})
export class PackageTimelineComponent implements OnDestroy {
  readonly historyElementRef = viewChild.required<ElementRef<HTMLElement>>('historyTimeline');

  readonly packageId = input.required<string>();

  private subscription: Subscription = new Subscription();
  private scripts: Scripts[] = [];

  packageHistory: { timestamp: string, title: string, content: string }[] = [];
  loadingHistory = signal(false);
  timeline: Timeline;

  constructor(
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
  ) {
    effect(() => {
      if (!this.timeline) {
        const timelineDOM = this.historyElementRef().nativeElement;

        if (timelineDOM) {
          this.timeline = new Timeline(timelineDOM, this.packageHistory);
          this.timeline.init(timeLineConfig);
          this.scripts.push(this.timeline);

          this.fetchPackageHistory();
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  fetchPackageHistory(): void {
    this.loadingHistory.set(true);
    const historySubscription = this.projectsService.getAllPackageStatusHistory(this.packageId())
      .subscribe({
        next: packageHist => {
          this.timeline.removeEntries([...this.packageHistory.keys()]);
          const hist = packageHist.map(entry => {
            return {
              timestamp: entry.dateTime,
              title: `Status: ${AcceptancePackageUtils.getStatusTag(entry.status).outerHTML}`,
              content: `Actioned by: ${entry.userFirstName + ' ' + entry.userLastName}
              ${[CustomerAcceptanceStatus.CustomerApproved, CustomerAcceptanceStatus.CustomerRejected, CustomerAcceptanceStatus.DeemedApproved].includes(entry.status as CustomerAcceptanceStatus) ? '<br />Approval level: ' + entry.levelId : ''}`,
            }
          });
          this.timeline.addEntries(hist);
          this.packageHistory = hist;
          this.loadingHistory.set(false);
        },
        error: (error) => {
          this.notificationService.showNotification({
            title: `Error while retrieving history of the acceptance package!`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);

          console.error(error);
          this.loadingHistory.set(false);
        },
      });

    this.subscription.add(historySubscription);
  }
}
