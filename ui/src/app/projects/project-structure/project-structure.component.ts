import { Component, effect, ElementRef, viewChild, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TabGroup } from '@eds/vanilla';
import { SiteStructureComponent } from './site-structure/site-structure.component';
import { WorkplanStructureComponent } from './workplan-structure/workplan-structure.component';
import { MilestoneStructureComponent } from './milestone-structure/milestone-structure.component';

enum TabIdentifier {
  siteStructure = 'Site structure',
  workplanStructure = 'Workplan structure',
  milestoneStructure = 'Milestone structure',
}

@Component({
  selector: 'app-project-structure',
  standalone: true,
  templateUrl: './project-structure.component.html',
  styleUrls: ['./project-structure.component.less'],
  imports: [SiteStructureComponent, WorkplanStructureComponent, MilestoneStructureComponent]
})
export class ProjectStructureComponent implements OnDestroy {
  private readonly tabsElementRef = viewChild.required<ElementRef<HTMLElement>>('tabs');
  private readonly tabQueryParameterKey = 'projectStructureTab';
  private tabGroup: TabGroup;
  protected readonly tabConfigs = Object.entries(TabIdentifier).map(identifier => {
    const [, name] = identifier;
    return { name };
  });
  protected targetTab: TabIdentifier;
  protected readonly TabIdentifier = TabIdentifier;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
  ) {
    effect(() => {
      this.targetTab = this.route.snapshot.queryParamMap.get(this.tabQueryParameterKey) as TabIdentifier || TabIdentifier.siteStructure;
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
      relativeTo: this.route,
      queryParams: { [this.tabQueryParameterKey]: name },
    });
    this.location.replaceState(urlTree.toString());
  }
}
