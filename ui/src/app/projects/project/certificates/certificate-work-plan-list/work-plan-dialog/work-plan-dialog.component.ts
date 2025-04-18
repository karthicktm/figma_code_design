import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild, signal } from '@angular/core';
import { TabGroup } from '@eds/vanilla';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { WorkplanSiteData } from 'src/app/projects/projects.interface';
import { WorkPlanPackagesComponent } from '../work-plan-packages/work-plan-packages.component';
import { WorkPlanCertificateRequestsComponent } from '../work-plan-certificate-requests/work-plan-certificate-requests.component';

interface TabConfig {
  name: string;
  id: string;
}

@Component({
  selector: 'app-work-plan-dialog',
  standalone: true,
  imports: [
    WorkPlanPackagesComponent,
    WorkPlanCertificateRequestsComponent,
  ],
  templateUrl: './work-plan-dialog.component.html',
  styleUrl: './work-plan-dialog.component.less'
})
export class WorkPlanDialogComponent extends EDSDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('tabs') private readonly tabsElementRef: ElementRef<HTMLElement>;
  tabConfigs: TabConfig[] = [
    { name: 'Acceptance packages', id: 'packages' },
    { name: 'Certificate requests', id: 'requests' },
  ];
  activeTab = signal(this.tabConfigs[0].id);

  private scripts: Scripts[] = [];

  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      workPlan: WorkplanSiteData,
      projectId: string,
      filterBy: string,
      isOnlyApDetails: boolean
    },
  ) {
    super();
    if (inputData.isOnlyApDetails) {
      this.tabConfigs = [
        { name: 'Acceptance packages', id: 'packages' }      
      ]
    }
  }
  
  ngAfterViewInit(): void {
    this.loadTabGroup();
    super.ngAfterViewInit();
  }

  ngOnDestroy(): void {
    this.scripts.forEach(script => {
      script.destroy();
    });
    super.ngOnDestroy();
  }

  private loadTabGroup(): void {
    const tabsDom = this.tabsElementRef.nativeElement;
    if (tabsDom) {
      const tabGroup = new TabGroup(tabsDom);
      tabGroup.init();
      this.scripts.push(tabGroup);
    }
  }

  openTab(id: string): void {
    // If the same tab is clicked, no need to refresh the table
    if (id === this.activeTab()) {
      return;
    }

    this.activeTab.set(id);
  }
}
