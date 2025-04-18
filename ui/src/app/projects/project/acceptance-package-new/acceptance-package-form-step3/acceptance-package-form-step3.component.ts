import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@eds/vanilla';
import { AttachedEvidence, NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { AddNewDocumentDialogComponent } from 'src/app/projects/details-dialog/add-new-document-dialog/add-new-document-dialog.component';
import { Evidence, ToolContext } from 'src/app/projects/projects.interface';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { SourceSRSReportDialogComponent } from '../../acceptance-package-details/attached-documents/source-srs-report-dialog/source-srs-report-dialog.component';
import TableUtils, { TableRowData } from '../../acceptance-package-details/table-utilities';
import { Subscription, catchError, tap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { resetOffsetValue } from 'src/app/shared/table-utilities';

@Component({
  selector: 'app-acceptance-package-form-step3',
  templateUrl: './acceptance-package-form-step3.component.html',
  styleUrls: ['./acceptance-package-form-step3.component.less']
})
export class AcceptancePackageFormStep3Component implements OnInit, AfterViewInit, OnDestroy {

  totalRecords: number;
  public targetStatus: string;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 10;
  offset: number = 0;
  @ViewChild('evidencesTable') private readonly tableElementRef: ElementRef<HTMLElement>;
  private table: Table;
  private tableData: Evidence[] = [];
  public showLoader: boolean;
  private scripts: Scripts[] = [];
  private readonly tableLimitStorageKey = 'evidence-table-limit';
  public projectId: string;
  public packageId: string;
  @Input() packageForm: FormGroup;
  @Input() evidences: Evidence[];
  @Input() isEdit: boolean = false;
  @Input() isMilestoneAcceptance: boolean;
  evidencesForm: FormGroup;
  private subscription = new Subscription();

  constructor(
    private datePipe: NullStringDatePipe,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    if (this.isEdit) {
      this.tableData = this.evidences;
      this.projectId = this.route.snapshot.parent.paramMap.get('id');
      this.packageId = this.route.snapshot.paramMap.get('id');
    } else {
      this.projectId = this.route.snapshot.paramMap.get('id');
    }
    const step4FormGroup = this.packageForm.controls.step4 as FormGroup;
    this.evidencesForm = step4FormGroup.controls.evidences as FormGroup;
    const loadedTableLimit = Number.parseInt(localStorage.getItem(this.tableLimitStorageKey));
    if (loadedTableLimit && this.limit !== loadedTableLimit) {
      this.limit = loadedTableLimit;
      if (!this.tableRowNumSelectOptions.includes(this.limit)) {
        if (this.limit < this.tableRowNumSelectOptions[0]) {
          this.tableRowNumSelectOptions.unshift(this.limit);
        } else if (this.limit > this.tableRowNumSelectOptions[this.tableRowNumSelectOptions.length - 1]) {
          this.tableRowNumSelectOptions.push(this.limit);
        } else {
          const index = this.tableRowNumSelectOptions.findIndex(item => item > this.limit);
          this.tableRowNumSelectOptions.splice(index, 0, this.limit);
        }
      }
    }
  }

  ngAfterViewInit(): void {
    const columnsProperties = [
      {
        key: 'name',
        title: 'Name',
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          td.innerHTML = `<a class="project-name">${cellData}</a> `;
        },
      },
      {
        key: 'tag',
        title: 'Tag',
        sort: 'none',
      },
      {
        key: 'createdDate',
        title: 'Created date',
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.formatDateCell(this.datePipe, cellData, td);
        },
      },
      {
        key: 'isAcceptanceRequired',
        title: 'Approval required',
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          td.innerHTML = `<label class="switch">
            <input type="checkbox">
            <i class="ball"></i>
            <span data-enabled="Yes" data-disabled="No"></span>
          </label>`
          const inputElement = td.querySelector('input')
          if (cellData) { inputElement.checked = true; }
          if (this.isMilestoneAcceptance) inputElement.disabled = true;
        },
      }
    ];
    // table height style properties
    const tableHeightStyleProp = 'calc(100vh - 290px - 32px)';

    // table for the tab 'All'
    const tableDOM = this.tableElementRef.nativeElement;
    if (tableDOM) {
      const table = new Table(tableDOM, {
        data: this.tableData || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        actions: true,
        onCreatedActionsCell: (td: HTMLTableCellElement, rowData: TableRowData & AttachedEvidence): void => {
          const icon = document.createElement('i');
          icon.classList.add('icon', 'icon-trashcan');
          const button = document.createElement('button');
          button.classList.add('btn-icon', 'delete');
          button.setAttribute('title', 'Delete');
          button.appendChild(icon);
          td.appendChild(button);

          button.addEventListener('click', () => {
            const isSRSEvidence = rowData?.tag?.toLowerCase().startsWith('site analysis report') || rowData?.tag?.toUpperCase().startsWith('SRS');
            const isSDEEvidence = rowData?.tag?.startsWith('site-design-and-engineering-reports');
            this.deleteEvidence(rowData, { referenceOnly: isSRSEvidence || isSDEEvidence });
          });
        },
        beforeCreatedBody: (): void => {
          TableUtils.addDateFilterForEDSTable(table);
          this.offset = resetOffsetValue;
        },
        onCreatedRow: (tr: HTMLTableRowElement, rowData: TableRowData & AttachedEvidence): void => {
          tr.querySelector('.switch input').addEventListener('click', (event) => {
            const decision = (event.target as HTMLInputElement).checked;
            this.updateApprovalRequirement(rowData, decision, event);
          });
        }
      });

      table.init();
      this.table = table;
      this.scripts.push(table);
    }

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Delete evidence
   * @param rowData complete details of the selected row from evidence table
   */
  public deleteEvidence(rowData: TableRowData & AttachedEvidence, options?: { referenceOnly?: boolean }): void {
    if (options?.referenceOnly !== true) {
      this.networkRollOutService.deleteEvidence(rowData.internalId).subscribe({
        error: (error) => {
          this.notificationService.showNotification({
            title: 'Error when deleting evidence!',
            description: 'Click to open the FAQ doc for further steps.'

          }, true);
        }
      });
    }

    const evidencesFormControl: AbstractControl<string[]> = this.evidencesForm.controls.file
    const index = evidencesFormControl.value.indexOf(rowData.internalId);
    if (index !== -1) {
      const newEvidences = evidencesFormControl.value.filter(id => id !== rowData.internalId);
      evidencesFormControl.patchValue(newEvidences);
    }
    this.table.delete(rowData);

  }


  /**
   * Add evidence popup
   */
  public addNewEvidence(): void {
    const dialogRef = this.dialogService.createDialog(
      AddNewDocumentDialogComponent,
      { projectId: this.projectId, packageId: this.packageId, isNewPackage: !this.isEdit, isViewOnly: this.isMilestoneAcceptance }
    );
    const responseSubscription = dialogRef.instance.fileUploadResponse.subscribe({
      next: (response: Evidence) => {
        if (response.internalId) {
          this.table.add(response);
          this.evidencesForm.controls.file.patchValue([...this.evidencesForm.controls.file.value, response.internalId]);
        }
      },
      error: () => {
        this.notificationService.showNotification({
          title: `Uploading evidence is failed`,
          description: `There was error while uploading new evidence.`
        }, true);
      }
    });

    this.subscription.add(responseSubscription);
  }

  public sourceReportAsEvidence(): void {
    const step2FormGroup = this.packageForm.controls.step2 as FormGroup;
    const multiSites = step2FormGroup.controls.multiSites.value;
    const dialogRef = this.dialogService.createDialog(SourceSRSReportDialogComponent, {
      projectId: this.projectId,
      parentIds: multiSites,
      context: ToolContext.nro,
    });

    const dialogSubscription = dialogRef.instance.dialogResult.subscribe((result) => {
      if (!!result.attachedEvidence && result.attachedEvidence.length > 0) {
        const alreadyAdded = this.table.data.map((entry: AttachedEvidence) => entry.internalId);
        const newToAdd = result.attachedEvidence.filter((evidence) => undefined === alreadyAdded.find(entry => entry === evidence.internalId));
        newToAdd.forEach(evidence => {
          this.table.add(evidence);
        });
        this.evidencesForm.controls.file.patchValue([...this.evidencesForm.controls.file.value, ...newToAdd.map(evidence => evidence.internalId)]);
      }
      dialogSubscription.unsubscribe();
    });
  }

  private updateApprovalRequirement(rowData: AttachedEvidence, decision: boolean, event: Event): void {
    const target = (event.target instanceof HTMLInputElement) ? event.target : undefined;
    if (target) target.disabled = true;
    this.networkRollOutService.updateEvidenceApprovalStatus(rowData.internalId, decision).pipe(
      tap(() => {
        if (target) target.disabled = false;
        this.notificationService.showNotification({
          title: 'Evidence updated successfully',
          description: ''
        }, true);
      }),
      catchError((error: HttpErrorResponse) => {
        if (target) {
          target.checked = !target.checked;
          target.disabled = false;
        }
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showNotification({
          title: 'Error when updating evidence!',
          description: 'Click to open the FAQ doc for further steps.'

        }, true);
        return throwError(() => {
          return errorMessage;
        });
      }),
    )
      .subscribe();
  }
}
