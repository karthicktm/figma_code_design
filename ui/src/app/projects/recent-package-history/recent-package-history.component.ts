import { HttpErrorResponse } from '@angular/common/http';
import { RecentHistoryResponse } from '../projects.interface';
import { ProjectsService } from '../projects.service';
import { Router } from '@angular/router';
import { SetNotificationProps } from '@eds/vanilla/notification-log/NotificationLog';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, signal } from '@angular/core';

export class HistoryLogItem {
  title: string;
  description: string;
  projectId: string;
  packageId: string
}

@Component({
  selector: 'app-recent-package-history',
  templateUrl: 'recent-package-history.component.html',
  styleUrl: './recent-package-history.component.less'
})
export class RecentPackageHistoryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('historyLog') readonly historyLogRef: ElementRef<HTMLElement>;
  historyLogItemArr: HistoryLogItem[];
  private eventAbortController = new AbortController();
  private sidePanelOpen = signal(false);

  constructor(private projectService: ProjectsService) {
    effect(() => {
      if (this.sidePanelOpen()) {
        this.retrievePackageHistory();
      }
    })
  }

  ngAfterViewInit(): void {
    const historyLogTriggerRef = document.querySelector('.history-log-trigger');
    historyLogTriggerRef?.addEventListener('click', (event) => {
      window.dispatchEvent(new CustomEvent('toggleSyspanel', { detail: this.historyLogRef.nativeElement }));
    }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
    window.addEventListener('SyspanelOpenEvent', () => this.sidePanelOpen.set(true),
      { signal: this.eventAbortController.signal } as AddEventListenerOptions);
    window.addEventListener('SyspanelCloseEvent', () => this.sidePanelOpen.set(false),
      { signal: this.eventAbortController.signal } as AddEventListenerOptions);
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
  }

  private retrievePackageHistory(): void {
    this.projectService.getPackageRecentHistory().subscribe({
      next: (recentHistoryList: RecentHistoryResponse[]) => {
        const lHistoryLogItemArr = [];
        recentHistoryList.map(elem => {
          const historyLogItem: HistoryLogItem = {
            title: elem.elementName,
            description: 'Accessed at: ' + new Date(elem.createdDate).toLocaleString(),
            projectId: elem.projectId,
            packageId: elem.elementId
          };
          lHistoryLogItemArr.push(historyLogItem)
        })
        this.historyLogItemArr = lHistoryLogItemArr;
      },
      error: (err: HttpErrorResponse) => {
        // ignore error response
      },
    });
  }

  private logItemClickHandler(historyLogItem: HistoryLogItem): void {
    window.dispatchEvent(new CustomEvent('toggleSyspanel', { detail: this.historyLogRef?.nativeElement }));

    const navigateUrl = `/projects/${historyLogItem.projectId}/acceptance-packages/${historyLogItem.packageId}`    

    // minimized change for item click reload, instead of using angular route way, which requires all sub components to handle the navigation
    window.location.href = navigateUrl;
  }
}