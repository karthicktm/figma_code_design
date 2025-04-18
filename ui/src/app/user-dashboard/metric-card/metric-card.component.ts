import { Component, computed, inject, input, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink, RouterLinkActive, UrlTree } from '@angular/router';

export interface UrlConfig {
  path: string;
  queryParams: Params;
  queryParamsHandling: 'merge' | 'preserve';
}

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.less'
})
export class MetricCardComponent {
  protected readonly icon = input<string>();
  protected readonly label = input<string>();
  protected readonly placeholder = input<string>('--');
  protected readonly value = input<Signal<number>>();
  protected readonly receivedValue = computed(() => {
    const value = this.value();
    return value()?.toString();
  });
  protected readonly urlConfig = input<UrlConfig>();
  protected readonly externalUrlConfig = input<UrlConfig>();
  protected readonly contentType = computed<string>(() => {
    const url = this.urlConfig();
    return url.path;
  });
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paramMap = toSignal(this.activatedRoute.paramMap);
  protected readonly generatedUrl = computed<UrlTree>(() => {
    const url = this.urlConfig();
    const route = this.activatedRoute;
    // Update url tree on parameter change in activated route.
    this.paramMap();
    return this.router.createUrlTree([url.path], { relativeTo: route, queryParams: url.queryParams, queryParamsHandling: url.queryParamsHandling });
  });
  protected readonly generatedExternalUrl = computed<UrlTree>(() => {
    const url = this.externalUrlConfig();
    const route = this.activatedRoute;
    // Update url tree on parameter change in activated route.
    const paramMap = this.paramMap();
    const projectId = paramMap?.get('id');
    return this.router.createUrlTree(['/projects', projectId, url.path], { queryParams: url.queryParams, queryParamsHandling: url.queryParamsHandling });
  });
}
