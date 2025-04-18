import { HttpStatusCode } from '@angular/common/http';
import { AfterViewInit, Component, EventEmitter, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Observable, forkJoin, of } from 'rxjs';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import { AttachedEvidence, NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { EvidenceParentType, ToolContext } from 'src/app/projects/projects.interface';

export interface ReportSelector {
  selection: string;
  attachedEvidence?: AttachedEvidence[];
}

@Component({
  selector: 'app-source-srs-report-dialog',
  templateUrl: './source-srs-report-dialog.component.html',
  styleUrls: ['./source-srs-report-dialog.component.less']
})
export class SourceSRSReportDialogComponent extends EDSDialogComponent implements AfterViewInit, OnDestroy {

  toolList = ['SRS', 'SDE'];

  dialogForm = new FormGroup({
    step1: new FormGroup({
      externalToolInput: new FormControl(this.toolList[0], [Validators.required])
    }),
    step2: new FormGroup({
      reports: new FormControl([], [
        Validators.required,
        Validators.minLength(1),
      ])
    }),
  });

  currentStep: number;
  loading = false;

  parentIds: string[];
  projectId: string;
  reportList: AttachedEvidence[] = [];
  public dialogResult: EventEmitter<ReportSelector> = new EventEmitter();
  reports: Observable<AttachedEvidence[]>;

  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      projectId: string,
      /** evidence to rework */
      parentEvidenceId: string,
      parentType?: EvidenceParentType,
      /** parent component to link with */
      parentId: string
      /** network element ids of the sites */
      parentIds?: string[],
      context?: ToolContext,
      isRework: boolean,
    },
    private networkRolloutService: NetworkRollOutService,
    private notificationService: NotificationService,
  ) {
    super();

    this.projectId = inputData.projectId;

    this.currentStep = 1;

    if (inputData.parentIds && inputData.parentIds.length > 0) {
      this.parentIds = inputData.parentIds;
      this.reports = this.getReports();
    }

    // Support only sourcing of SDE report in rework
    if (inputData.isRework) {
      this.toolList = ['SDE'];
      this.dialogForm.get('step1.externalToolInput').setValue(this.toolList[0]);
    }
  }

  get selectedTool(): string {
    return this.dialogForm.get('step1.externalToolInput').value;
  }

  get selectedReports(): string[] {
    return this.dialogForm.get('step2.reports').value;
  }

  onSelectExternalTool(toolName: string): void {
    this.dialogForm.get('step1.externalToolInput').setValue(toolName);
  }

  getReports(): Observable<AttachedEvidence[]> {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loading = true;
      })
    );

    const networkElementIds = this.inputData.parentIds;

    const reports = forkJoin(networkElementIds
      .map(
        (networkElementId) => this.networkRolloutService.getReportsOfProjectNetworkElement(this.projectId, networkElementId, 'SRS')
          .pipe(
            catchError((err) => {
              this.loading = false;
              console.error(err);
              if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
                this.notificationService.showNotification({
                  title: `Error getting reports in network element ${networkElementId} of project ${this.projectId}`,
                  description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
                }, true);
              } else {
                this.notificationService.showNotification({
                  title: `Error getting reports in network element ${networkElementId} of project ${this.projectId}`,
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
      this.dialogForm.get('step2.reports').setValue([...this.selectedReports, event.target.value]);
    } else {
      this.dialogForm.get('step2.reports').setValue(this.selectedReports.filter((id => id !== event.target.value)));
    }
  }

  onCheckAllReports(event): void {
    if (event.target.checked) {
      this.dialogForm.get('step2.reports').setValue(this.reportList.map(report => report.internalId));
    } else {
      this.dialogForm.get('step2.reports').setValue([]);
    }
  }

  onSubmitAddReport(): void {
    const dialogData: ReportSelector = {
      attachedEvidence: this.reportList.filter(report => this.selectedReports.find(selectedReportId => selectedReportId === report.internalId)),
      selection: this.selectedTool,
    }
    this.dialogResult.emit(dialogData);
    this.dialog.hide();
  }

  cancelDialog(): void {
    this.dialogResult.emit();
    this.dialog.hide();
  }

  onSubmitAddSDEProjectReport(event: AttachedEvidence[]): void {
    if (!event) {
      this.cancelDialog();
    }
    const dialogData: ReportSelector = {
      attachedEvidence: event,
      selection: this.selectedTool,
    };
    this.dialogResult.emit(dialogData);
    this.dialog.hide();
  }
}
