import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs';


@Component({
  selector: 'app-site-hierarchy',
  templateUrl: './site-hierarchy.component.html',
  styleUrls: ['./site-hierarchy.component.less']
})
export class SiteHierarchyComponent {

  // as per requirement
  // Site, Milestone, Checklist are default selected,
  // Workplan and Activity in hierarchy are in selection controlled by user
  // Line Items are not in tree, so no checkbox for this, only information with legend
  hierarchyChangeSignal = signal<{ [key: string]: { checked: boolean, disabled: boolean } }>({
    NetworkSite: { checked: true, disabled: true },
    Workplan: { checked: false, disabled: false },
    Milestone: { checked: true, disabled: true },
    Activity: { checked: false, disabled: false },
    Checklist: { checked: true, disabled: true },
    Evidence: { checked: true, disabled: true },
  });

  constructor(
    private activeRoute: ActivatedRoute,
  ) {
    activeRoute.queryParamMap.pipe(
      tap(paramMap => {
        if (paramMap.has('workplanId')) {
          const hierarchy = this.hierarchyChangeSignal();
          hierarchy.Workplan.checked = true;
          this.hierarchyChangeSignal.set(Object.assign({}, hierarchy));
        };
      }),
    ).subscribe();
  }
  public updateCheckboxState(event): void {
    const hierarchy = this.hierarchyChangeSignal();
    hierarchy[event.target.id].checked = event.target.checked
    this.hierarchyChangeSignal.set(Object.assign({}, hierarchy));
  }
}
