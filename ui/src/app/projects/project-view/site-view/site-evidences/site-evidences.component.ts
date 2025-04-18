import { Component, effect, ElementRef, viewChild, OnDestroy, inject, computed } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TabGroup } from '@eds/vanilla';
import { SiteLineItemEvidencesComponent } from '../site-line-item-evidences/site-line-item-evidences.component';
import { SiteMilestoneEvidencesComponent } from '../site-milestone-evidences/site-milestone-evidences.component';
import { toSignal } from '@angular/core/rxjs-interop';

enum TabIdentifier {
  lineItemEvidences = 'Line item evidences',
  milestoneEvidences = 'Milestone evidences',
}

@Component({
  selector: 'app-site-evidences',
  standalone: true,
  imports: [
    SiteLineItemEvidencesComponent,
    SiteMilestoneEvidencesComponent,
  ],
  templateUrl: './site-evidences.component.html',
  styleUrl: './site-evidences.component.less'
})
export class SiteEvidencesComponent implements OnDestroy {
  private readonly tabsElementRef = viewChild.required<ElementRef<HTMLElement>>('tabs');
  private readonly tabQueryParameterKey = 'projectSiteViewTab';
  private tabGroup: TabGroup;
  protected readonly tabConfigs = Object.entries(TabIdentifier).map(identifier => {
    const [, name] = identifier;
    return { name };
  });
  protected targetTab: TabIdentifier;
  protected readonly TabIdentifier = TabIdentifier;

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly parentParamMap = toSignal(this.activatedRoute.parent.paramMap);
  protected readonly projectId = computed(() => {
    const parentParamMap = this.parentParamMap();
    return parentParamMap?.get('id');
  });
  private readonly paramMap = toSignal(this.activatedRoute.paramMap);
  protected readonly siteId = computed(() => {
    const paramMap = this.paramMap();
    return paramMap?.get('networkSiteId');
  });

  constructor(
    private router: Router,
    private location: Location,
  ) {
    effect(() => {
      this.targetTab = this.activatedRoute.snapshot.queryParamMap.get(this.tabQueryParameterKey) as TabIdentifier || TabIdentifier.lineItemEvidences;
      if (!this.tabGroup) {
        const tabsDom = this.tabsElementRef().nativeElement;
        if (tabsDom) {
          this.tabGroup = new TabGroup(tabsDom);
          this.tabGroup.init();
        }
      }
      this.openTab(this.targetTab);
    });
  }

  ngOnDestroy(): void {
    this.tabGroup?.destroy();
  }

  openTab(name: TabIdentifier): void {
    if (name === this.targetTab) {
      return;
    }
    this.targetTab = name;
    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.activatedRoute,
      queryParams: { [this.tabQueryParameterKey]: name },
    });
    this.location.replaceState(urlTree.toString());
  }
}
