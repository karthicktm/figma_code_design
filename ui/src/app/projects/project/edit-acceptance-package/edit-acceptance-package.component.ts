import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable, Subscription, forkJoin, of, throwError} from 'rxjs';
import { catchError, expand, map, reduce, takeWhile } from 'rxjs/operators';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { Evidence, PackageDetails, PackageLineItem, PackageTaxonomy } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-edit-acceptance-package',
  templateUrl: './edit-acceptance-package.component.html',
  styleUrls: ['./edit-acceptance-package.component.less']
})
export class EditAcceptancePackageComponent implements OnInit, OnDestroy {

  public packageId: string;
  currentPackage: Observable<{
    details: PackageDetails,
    taxonomy: PackageTaxonomy,
    lineItems: PackageLineItem[],
  }>;
  public isEdit: boolean;
  private subscription: Subscription = new Subscription();

  public limit: number = 30;
  public offset: number = 0;
  public evidences:  Evidence[];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectsService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.isEdit = true;
    this.packageId = this.route.snapshot.paramMap.get('id');
    this.fetchPackageDetails();
    this.fetchEvidences();
  }

  /**
   * Fetch package details to set `currentPackageDetails`.
   */
  fetchPackageDetails(): void {
    const details = this.projectService.getAcceptancePackage(this.packageId);
    const taxonomy = this.projectService.getTaxonomyByPackageId(this.packageId);
    const lineItems = this.projectService.getAllLineItemsByPackageId(this.packageId);
    this.currentPackage = forkJoin({
      details,
      taxonomy,
      lineItems,
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.notificationService.showNotification({
          title: 'Error when fetching details!',
          description: 'Click to open the FAQ doc for further steps.'

        }, true);
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


  /**
   *  fetch uploaded evidences
   *
  */
  public fetchEvidences(): void {
    const packageEvidences = of({
      morePages: true,
      limit: 100,
      nextOffset: 0,
      results: [],
    }).pipe(
      expand(data => {
        if (data.morePages)
          return this.projectService.getPackageAdditionalEvidences( this.packageId, data.limit, data.nextOffset).pipe(
            map(newData => ({ ...newData, limit: data.limit }))
          );
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => data.results),
      reduce((acc, results) => ([...acc, ...results])),
      catchError((err) => {
        console.error(err);
        return [];
      }),
    );
    const subscription = packageEvidences.subscribe({
      next: data => {
        this.evidences = data;
      },
      error: error => {
        this.notificationService.showNotification({
          title: 'Error when fetching evidences!',
          description: 'Click to open the FAQ doc for further steps.'

        }, true);
      },
    });
    this.subscription.add(subscription);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
