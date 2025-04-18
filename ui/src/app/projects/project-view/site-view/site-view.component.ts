import { Component, computed, effect, inject, OnDestroy, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { catchError, Subscription, tap, throwError } from 'rxjs';
import { ProjectsService } from '../../projects.service';
import { SiteEvidencesComponent } from './site-evidences/site-evidences.component';

@Component({
  selector: 'app-site-view',
  standalone: true,
  imports: [SiteEvidencesComponent],
  templateUrl: './site-view.component.html',
  styleUrl: './site-view.component.less'
})
export class SiteViewComponent implements OnDestroy {
  protected readonly packageMetrics: WritableSignal<{ pending: string | number, rejected: string | number, approved: string | number }> = signal({ pending: '--', rejected: '--', approved: '--' });
  protected readonly certificateMetrics: WritableSignal<{ pending: string | number, rejected: string | number, signed: string | number }> = signal({ pending: '--', rejected: '--', signed: '--' });
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  private readonly paramMap = toSignal(this.activatedRoute.paramMap);
  private readonly parentParamMap = toSignal(this.activatedRoute.parent.paramMap);
  private readonly siteId = computed(() => {
    const paramMap = this.paramMap();
    return paramMap?.get('networkSiteId');
  });
  private readonly projectId = computed(() => {
    const parentParamMap = this.parentParamMap();
    return parentParamMap?.get('id');
  });

  private subscription: Subscription = new Subscription();

  constructor() {
    effect(() => {
      const siteId = this.siteId();
      const projectId = this.projectId();
      if (projectId && siteId) {
        this.loadPackageMetrics(projectId, siteId);
        this.loadCertificateMetrics(projectId, siteId);
      }
    }, { allowSignalWrites: true });
  }

  private loadPackageMetrics(projectId: string, siteId: string): void {
    this.packageMetrics.set({ pending: '...', rejected: '...', approved: '...' });
    const observable = this.projectsService.getSitePackageMetrics(projectId, siteId).pipe(
      tap(metrics => {
        this.packageMetrics.set(metrics);
      }),
      catchError((error: HttpErrorResponse) => {
        this.packageMetrics.set({ pending: '--', rejected: '--', approved: '--' });
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      }),
    );
    this.subscription.add(observable.subscribe());
  }

  private loadCertificateMetrics(projectId: string, siteId: string): void {
    this.certificateMetrics.set({ pending: '...', rejected: '...', signed: '...' });
    const observable = this.projectsService.getSiteCertificateMetrics(projectId, siteId).pipe(
      tap(metrics => {
        this.certificateMetrics.set(metrics);
      }),
      catchError((error: HttpErrorResponse) => {
        this.certificateMetrics.set({ pending: '--', rejected: '--', signed: '--' });
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      }),
    );
    this.subscription.add(observable.subscribe());
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
