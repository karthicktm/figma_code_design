import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { Breadcrumb } from '@eds/vanilla';
import { AppbarService } from './appbar.service';
import { AfterViewInit } from '@angular/core';
import { BreadcrumbService } from '../../services/breadcrumb.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '.appbar',
  templateUrl: './appbar.component.html'
})
export class AppbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('appbarAction', { read: ViewContainerRef }) readonly actionContainerRef: ViewContainerRef;
  private scripts: Scripts[] = [];
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appbarService: AppbarService,
    private breadcrumbService: BreadcrumbService,
  ) {
  }

  ngOnInit(): void {
    const breadcrumbElement = document.querySelector('.breadcrumb') as HTMLElement;
    if (breadcrumbElement) {
      const breadcrumb: Breadcrumb = new Breadcrumb(breadcrumbElement);
      this.scripts.push(breadcrumb);

      // subscribe to breadcrumb
      this.appbarService.breadCrumbData.subscribe(breadCrumbDataArray => {
        breadcrumb.destroy();
        breadcrumb.init(breadCrumbDataArray);
      });
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {

          let snapshot: ActivatedRouteSnapshot = this.activatedRoute.snapshot;
          let activated: ActivatedRoute = this.activatedRoute.firstChild;
          if (activated != null) {
            while (activated != null) {
              snapshot = activated.snapshot;
              activated = activated.firstChild;
            }
          }

          // generate breadcrumb
          this.breadcrumbService.generateBreadcrumb(snapshot)
            .subscribe(breadCrumbDataArray =>
              this.appbarService.breadCrumbData.next(breadCrumbDataArray)
            );
        }
      });
    }

  }

  ngAfterViewInit(): void {
    this.appbarService.ActionContainer = this.actionContainerRef;
  }

  ngOnDestroy(): void {
    this.scripts.forEach(s => s.destroy());
  }
}
