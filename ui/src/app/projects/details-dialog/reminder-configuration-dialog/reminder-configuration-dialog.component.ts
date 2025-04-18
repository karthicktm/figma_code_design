import { Component, effect, ElementRef, Inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { ProjectsService } from '../../projects.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { Subscription } from 'rxjs';
import { PackageConfiguration } from '../../projects.interface';
import { TabGroup } from '@eds/vanilla';

@Component({
  selector: 'app-reminder-configuration-dialog',
  templateUrl: './reminder-configuration-dialog.component.html',
  styleUrls: ['./reminder-configuration-dialog.component.less']
})
export class ReminderConfigurationDialogComponent extends EDSDialogComponent implements OnInit, OnDestroy {
  readonly tabsElementRef = viewChild.required<ElementRef<HTMLElement>>('tabs');

  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();

  tabGroup: TabGroup;
  tabConfigs = [
    { name: 'Acceptance package' },
    { name: 'Acceptance flow' },
  ];
  targetTab: string;

  configuration = signal<PackageConfiguration>(undefined);
  fetchingConfigurationError = signal(false);

  constructor(
    @Inject(DIALOG_DATA) public projectId: string,
    private projectService: ProjectsService,
    private notificationService: NotificationService) {
    super();
    effect(() => {
      if (!this.tabGroup) {
        const tabsDom = this.tabsElementRef().nativeElement;
        if (tabsDom) {
          this.tabGroup = new TabGroup(tabsDom);
          this.tabGroup.init();
          this.scripts.push(this.tabGroup);
          const firstTab = tabsDom.querySelector('.title');
          if (firstTab && firstTab instanceof HTMLDivElement) firstTab.focus();
        }
      }
      if (!this.targetTab) this.targetTab = this.tabConfigs[0].name;
      this.openTab(this.targetTab);
    });
  }

  ngOnInit(): void {
    this.fetchConfiguration();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  public fetchConfiguration(): void {
    this.subscription.add(this.projectService.getPackageConfiguration(this.projectId).subscribe({
      next: (configuration: PackageConfiguration) => {
        this.configuration.set(configuration);
      },
      error: (error) => {
        this.fetchingConfigurationError.set(true);
        this.notificationService.showNotification({
          title: `Error while retrieving acceptance package configuration!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
        }, true);
      },
    }));
  }

  openTab(name: string): void {
    if (name === this.targetTab) {
      return;
    }

    this.targetTab = name;
  }
}
