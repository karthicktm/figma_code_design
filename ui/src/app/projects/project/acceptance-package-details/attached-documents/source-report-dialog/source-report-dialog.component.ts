import { HttpStatusCode } from '@angular/common/http';
import { AfterViewInit, Component, EventEmitter, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PartialObserver } from 'rxjs';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { Evidence, EvidenceParentType, ToolContext } from 'src/app/projects/projects.interface';

export interface Data {
  projectId: string;
  /** Parent component to link with */
  parentId: string;
  /** Network element ids of the sites */
  parentIds?: string[];
  parentType: EvidenceParentType;
  parentEvidenceId?: string;
  context?: ToolContext;
}

@Component({
  selector: 'app-source-report-dialog',
  templateUrl: './source-report-dialog.component.html',
  styleUrls: ['./source-report-dialog.component.less']
})
export class SourceReportDialogComponent extends EDSDialogComponent implements AfterViewInit, OnDestroy {

  private eventAbortController = new AbortController();

  toolList = [
    'SRS',
    'SDE',
  ];

  dialogForm = new FormGroup({
    step1: new FormGroup({
      externalToolInput: new FormControl(this.toolList[0], [Validators.required])
    }),
  });

  currentStep: number;
  loading = false;
  public dialogResult: EventEmitter<boolean> = new EventEmitter();

  constructor(
    @Inject(DIALOG_DATA) public inputData: Data,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
  ) {
    super();
    this.currentStep = 1;
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
    super.ngOnDestroy();
  }

  get selectedTool(): string {
    return this.dialogForm.get('step1.externalToolInput').value;
  }

  public onSelectExternalTool(toolName: string): void {
    this.dialogForm.get('step1.externalToolInput').setValue(toolName);
  }

  onSubmitAddSRSProjectReports(evidences: { internalId: string }[]): void {
    evidences
      ? evidences.forEach(evidence => this.submitAddSRSProjectReport({ internalId: evidence.internalId }))
      : this.dialog.hide();
  }

  private submitAddSRSProjectReport(data: { internalId: string }): void {
    const target = {
      parentId: this.inputData.parentId,
      parentType: this.inputData.parentType,
      parentEvidenceId: this.inputData.parentEvidenceId,
    };
    const observer: PartialObserver<Evidence> = {
      next: () => {
        this.loading = false;
        this.dialogResult.emit(true);
        this.dialog.hide()
      },
      error: (err) => {
        this.loading = false;
        let additionalMessage = '';
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: 'Error when adding report!',
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);

          additionalMessage = `\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.`;
        } else {
          this.notificationService.showNotification({
            title: 'Error when adding report!',
            description: 'Click to open the FAQ doc for further steps.'
          }, true);

          additionalMessage = `\n Please follow the FAQ doc for further steps.`;
        }
      },
    }
    this.networkRollOutService.patchEvidence(data.internalId, target).subscribe(observer);
  }

  onSubmitAddSDEProjectReport(event: boolean): void {
    this.dialogResult.emit(event)
    if (!event) {
      this.dialog.hide();
    }
  }
}
