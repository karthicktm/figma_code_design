import { HttpStatusCode } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Observable, forkJoin, of } from 'rxjs';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import { AttachedEvidence, NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';

@Component({
  selector: 'app-source-srs-report',
  templateUrl: './source-srs-report.component.html',
  styleUrls: ['./source-srs-report.component.less']
})
export class SourceSrsReportComponent implements OnInit {
  @Input() readonly inputData: {
    projectId: string,
    parentIds: string[],
    parentId: string,
  };

  dialogForm = new FormGroup({
    step1: new FormGroup({
      reports: new FormControl([], [
        Validators.required,
        Validators.minLength(1),
      ])
    }),
  });

  currentStep: number;
  loading = false;

  reportList: AttachedEvidence[] = [];
  @Output() readonly submissionResult: EventEmitter<AttachedEvidence[]> = new EventEmitter();
  reports: Observable<AttachedEvidence[]>;

  constructor(
    private networkRolloutService: NetworkRollOutService,
    private notificationService: NotificationService,
  ) {
    this.currentStep = 1;
  }

  ngOnInit(): void {
    this.reports = this.getReports();
  }

  get selectedReports(): string[] {
    return this.dialogForm.get('step1.reports').value;
  }

  getReports(): Observable<AttachedEvidence[]> {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loading = true;
      })
    );

    const networkElementIds = this.inputData.parentIds || [this.inputData.parentId];
    const projectId = this.inputData.projectId

    const reports = forkJoin(networkElementIds
      .map(
        (networkElementId) => this.networkRolloutService.getReportsOfProjectNetworkElement(projectId, networkElementId, 'SRS')
          .pipe(
            catchError((err) => {
              this.loading = false;
              console.error(err);
              if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
                this.notificationService.showNotification({
                  title: `Error getting reports in network element ${networkElementId} of project ${projectId}`,
                  description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
                }, true);
              } else {
                this.notificationService.showNotification({
                  title: `Error getting reports in network element ${networkElementId} of project ${projectId}`,
                  description: 'Click to open the FAQ doc for further steps.'
                }, true);
              }
              return of([]);
            }),
          )
      )
    )
      .pipe(
        map(x => x.flat()),
        tap(() => {
          this.loading = false;
        }),
        catchError(() => EMPTY),

      );

    return loadingStartFlagging.pipe(
      exhaustMap(() => reports),
      tap(reportList => this.reportList = reportList)
    );
  }

  onReportCheckboxChange(event): void {
    if (event.target.checked) {
      this.dialogForm.get('step1.reports').setValue([...this.selectedReports, event.target.value]);
    } else {
      this.dialogForm.get('step1.reports').setValue(this.selectedReports.filter((id => id !== event.target.value)));
    }
  }

  onCheckAllReports(event): void {
    if (event.target.checked) {
      this.dialogForm.get('step1.reports').setValue(this.reportList.map(report => report.internalId));
    } else {
      this.dialogForm.get('step1.reports').setValue([]);
    }
  }

  onSubmitAddReport(): void {
    this.submissionResult.emit(this.reportList.filter(report => this.selectedReports.find(selectedReportId => selectedReportId === report.internalId)));
  }

  cancel(): void {
    this.submissionResult.emit();
  }

}
