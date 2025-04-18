import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Timeline } from '@eds/vanilla';
import { ReplaySubject, Subscription } from 'rxjs';
import { ProjectsService } from 'src/app/projects/projects.service';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { timeLineConfig } from 'src/app/portal/portal.constants';
import { CustomerAcceptanceStatus } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-evidence-history',
  standalone: true,
  imports: [],
  templateUrl: './evidence-history.component.html',
  styleUrls: ['./evidence-history.component.less']
})
export class EvidenceHistoryComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() evidenceId: string;
  @Input() reloadStatus: ReplaySubject<boolean>;
  @ViewChild('historyTimeline') readonly historyElementRef: ElementRef<HTMLElement>;

  public subscription: Subscription = new Subscription();

  private scripts: Scripts[] = [];

  evidenceHistory = [];

  timeline: Timeline;
  constructor(
    private projectsService: ProjectsService,
  ) { }

  ngAfterViewInit(): void {
    const timelineDOM = this.historyElementRef.nativeElement;

    if (timelineDOM) {
      this.timeline = new Timeline(timelineDOM, this.evidenceHistory);
      this.timeline.init(timeLineConfig);
      this.scripts.push(this.timeline);

      this.getEvidenceHistory();

      if (this.reloadStatus) {
        this.subscription.add(this.reloadStatus.subscribe( value => {
          if (value) {
            this.getEvidenceHistory();
            this.reloadStatus.next(false);
          }
        }));
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.timeline) {
      if (!!changes.evidenceId
        && changes.evidenceId.currentValue !== changes.evidenceId.previousValue
      ) {
        this.getEvidenceHistory();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  getEvidenceHistory(): void {
    const historySubscription = this.projectsService.getAllEvidenceStatusHistory(this.evidenceId)
      .subscribe({
        next: evidenceHist => {
          this.timeline.removeEntries([...this.evidenceHistory.keys()]);
          const hist = evidenceHist.map(entry => {
            const isLevelInfoToShow = typeof entry.levelId === 'number' && [CustomerAcceptanceStatus.CustomerApproved.toString(), CustomerAcceptanceStatus.CustomerRejected, CustomerAcceptanceStatus.DeemedApproved].includes(entry.status);
            const levelInfo = isLevelInfoToShow ? `<br /><span>Approval level: ${entry.levelId}</span>` : '';
            return {
              timestamp: entry.dateTime,
              content: `${AcceptancePackageUtils.getStatusTag(entry.status).outerHTML}<p>${entry.userEmail}${levelInfo}</p>`,
            }
          });
          this.timeline.addEntries(hist);
          this.evidenceHistory = hist;
        }
      });

    this.subscription.add(historySubscription);
  }

}
