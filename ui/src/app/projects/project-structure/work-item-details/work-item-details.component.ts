import { Component, computed, effect, input, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { catchError, exhaustMap, Observable, of, tap, throwError } from 'rxjs';
import { SharedModule } from '../../../shared/shared.module';
import { WorkItemInfo } from '../../projects.interface';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NodeStatusComponent } from '../node-status/node-status.component';

@Component({
  selector: 'app-work-item-details',
  standalone: true,
  imports: [
    AsyncPipe,
    NodeStatusComponent,
    SharedModule,
  ],
  templateUrl: './work-item-details.component.html',
  styleUrl: './work-item-details.component.less'
})
export class WorkItemDetailsComponent {
  protected workItemId = input.required<string>();
  protected workItemDetails: Observable<WorkItemInfo>;
  protected readonly isLoadingData = signal<boolean>(false);
  protected readonly valuePlaceholder = computed<'--' | '...'>(() => {
    const isLoadingData = this.isLoadingData();
    return isLoadingData ? '...' : '--';
  });

  constructor(
    private activeRoute: ActivatedRoute,
    private networkRollOutService: NetworkRollOutService,
  ) {
    effect(() => {
      const workItemId = this.workItemId();
      const pathFromRoot = this.activeRoute.snapshot.pathFromRoot;
      const projectsRoute = pathFromRoot.find(route => route?.url?.at(0)?.path === 'projects');
      const projectId = projectsRoute?.firstChild?.paramMap?.get('id');
      if (workItemId && projectId) {
        this.workItemDetails = this.getWorkItemDetailsLoader(projectId, workItemId);
      }
      else console.error('URL parameter(s) could be retrieved\nproject ID: %s\work item ID: %s', projectId, workItemId);
    });
  }

  private getWorkItemDetailsLoader(projectId: string, workItemId: string): Observable<WorkItemInfo> {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.isLoadingData.set(true);
      })
    );
    const getWorkItemDetails = this.networkRollOutService.getWorkItemDetailsByLinearId(projectId, workItemId);
    return loadingStartFlagging.pipe(
      exhaustMap(() => getWorkItemDetails),
      tap(() => {
        this.isLoadingData.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoadingData.set(false);
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
  }
}
