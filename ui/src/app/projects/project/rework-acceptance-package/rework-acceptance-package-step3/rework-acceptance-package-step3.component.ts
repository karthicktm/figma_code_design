import { AfterViewInit, Component, effect, ElementRef, input, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Table } from '@eds/vanilla';
import { Observable, PartialObserver, Subscription, tap } from 'rxjs';
import { ControlModel, ReworkPackageControlService } from '../rework-acceptance-package-control.service';
import { CustomerAcceptanceStatus, Evidence, MilestoneEvidenceRow, PackageDetails, ToolContext } from 'src/app/projects/projects.interface';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { DataSourceTool } from '../../acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnail/evidence-thumbnail.component';
import { UploadReferencedEvidenceDialogComponent } from 'src/app/projects/upload-referenced-evidence-dialog/upload-referenced-evidence-dialog.component';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { SourceSRSReportDialogComponent } from '../../acceptance-package-details/attached-documents/source-srs-report-dialog/source-srs-report-dialog.component';

@Component({
  selector: 'app-rework-acceptance-package-step3',
  templateUrl: './rework-acceptance-package-step3.component.html',
  styleUrls: ['./rework-acceptance-package-step3.component.less']
})
export class ReworkAcceptancePackageStep3Component implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('packageEvidenceTable') private readonly packageEvidenceTableElementRef: ElementRef<HTMLElement>;
  @Input() packageForm: FormGroup<ControlModel>;
  @Input() packageEvidenceData: Evidence[];
  @Input() packageDetails: PackageDetails;
  @Input() projectId: string;
  @Input() readonly currentStep?: number = 3;
  protected readonly milestoneEvidenceData = input<MilestoneEvidenceRow[]>();
  protected readonly isMilestoneAcceptance = input.required<boolean>();

  private subscription: Subscription = new Subscription();
  private packageEvidenceTable: Table;
  private scripts: Scripts[] = []

  constructor(
    private reworkPackageControl: ReworkPackageControlService,
    private el: ElementRef,
    private dialogService: DialogService,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
  ) {
    effect(() => {
      const milestoneEvidenceData = this.milestoneEvidenceData();
      const isMilestoneAcceptance = this.isMilestoneAcceptance();
      if (isMilestoneAcceptance && this.packageEvidenceTable) this.packageEvidenceTable.update(milestoneEvidenceData);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.packageEvidenceData
      && changes.packageEvidenceData.previousValue !== changes.packageEvidenceData.currentValue
      && !this.isMilestoneAcceptance()
      && this.packageEvidenceTable
    ) {
      this.packageEvidenceTable.update(this.packageEvidenceData);
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    const columnIdClass = {
      name: 'evidence-name',
    };
    const columnsProperties = [
      {
        key: 'name',
        title: 'Evidence name',
        sort: 'none',
        cellClass: columnIdClass.name,
      },
      {
        key: 'tag',
        title: 'Tag',
        sort: 'none',
      },
      {
        key: 'remark',
        title: 'Remark',
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          if (!cellData) td.replaceChildren(document.createTextNode('--'));
        },
      },
      {
        key: 'comment',
        title: 'Last comment',
        sort: 'none',
        cellClass: 'comment',
      },
      {
        key: 'status',
        title: 'Status',
        sort: 'none',
        cellStyle: 'white-space: nowrap',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData));
        },
      },
    ];
    if (this.isMilestoneAcceptance()) {
      const tagIndex = columnsProperties.findIndex(property => property.title === 'Tag');
      if (tagIndex !== -1) {
        columnsProperties.splice(
          tagIndex,
          1,
          {
            key: 'type',
            title: 'Type',
            sort: 'none',
          }
        );
      }
    }
    const tableHeightStyleProp = 'calc(100vh - 345px - 124px)';
    const packageEvidenceTableDOM = this.packageEvidenceTableElementRef.nativeElement;
    if (packageEvidenceTableDOM) {
      const data = this.isMilestoneAcceptance() ? this.milestoneEvidenceData() : this.packageEvidenceData;
      const table = new Table(packageEvidenceTableDOM, {
        data: data || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        scroll: true,
        actions: true,
        onCreatedActionsCell: (td: HTMLTableCellElement, rowData: Evidence | MilestoneEvidenceRow): void => {
          const eyeButton = document.createElement('button');
          eyeButton.classList.add('spacingIcon', 'btn-icon');
          eyeButton.setAttribute('title', 'View');
          const downloadButton = document.createElement('button');
          downloadButton.setAttribute('title', 'Download');
          downloadButton.classList.add('spacingIcon', 'btn-icon');

          const iconEye = document.createElement('i');
          iconEye.classList.add('icon', 'icon-eye');
          eyeButton.appendChild(iconEye);
          this.subscription.add(eyeButton.addEventListener('click', () => {
            this.maximizeScreen(rowData.internalId, DataSourceTool.ledger);
          }));
          td.appendChild(eyeButton);
          const iconDownload = document.createElement('i');
          iconDownload.classList.add('icon', 'icon-download-save');
          downloadButton.appendChild(iconDownload);
          this.subscription.add(downloadButton.addEventListener('click', () => {
            this.download(rowData);
          })
          );
          td.appendChild(downloadButton);

          if (!this.isMilestoneAcceptance()) {
            // Uploading new file or adding evidence via souring report is not allowed while reworking milestone evidences
            const uploadButton = document.createElement('button');
            uploadButton.setAttribute('title', 'Upload');
            uploadButton.classList.add('spacingIcon', 'btn-icon');
            const iconUpload = document.createElement('i');
            iconUpload.classList.add('icon', 'icon-upload');
            uploadButton.appendChild(iconUpload);
            this.subscription.add(uploadButton.addEventListener('click', () => {
              this.onUploadNewLineItemEvidence(rowData as Evidence);
            })
            );
            td.appendChild(uploadButton);

            td.appendChild(this.createSourceReportIconButton(rowData as Evidence));
          }

          if (!this.isMilestoneAcceptance() && rowData.status === CustomerAcceptanceStatus.Ready && (rowData as Evidence).isDeletionAllowed) {
          // Deleting of milestone evidences is not allowed
            const deleteButton = document.createElement('button');
            deleteButton.setAttribute('title', 'Delete');
            deleteButton.classList.add('spacingIcon', 'btn-icon');
            const iconDelete = document.createElement('i');
            iconDelete.classList.add('icon', 'icon-trashcan');
            deleteButton.appendChild(iconDelete);
            this.subscription.add(deleteButton.addEventListener('click', () => {
              this.reworkPackageControl.delete(rowData as Evidence, deleteButton).subscribe(() => {
                let formValue = this.packageForm.controls.packageEvidences.value;
                formValue = formValue.filter(e => e.internalId !== rowData.internalId);
                this.packageForm.controls.packageEvidences.patchValue(formValue);
                this.packageEvidenceTable.update(formValue);
              });
            }));

            td.appendChild(deleteButton);
          }
        },
        onCreatedRow: (tr: HTMLTableRowElement, rowData: Evidence | MilestoneEvidenceRow): void => {
          const td = tr.querySelector(`.${columnIdClass.name}`);
          if (td) {
            if (rowData?.status === CustomerAcceptanceStatus.CustomerRejected) {
              const isCompleted: boolean = this.reworkPackageControl.isEvidenceReworkCompleted(rowData);
              const status = document.createElement('i');
              status.classList.add('status', 'icon', 'icon-alarm-level6', `color-${isCompleted ? 'green' : 'red'}`, 'mr-sm');
              const observer: PartialObserver<Evidence[] | MilestoneEvidenceRow[]> = {
                next: evidences => {
                  const relatedEvidences = evidences.find(evidence => rowData.internalId === evidence.internalId)?.relatedEvidences;
                  if (relatedEvidences && relatedEvidences?.length > 0) {
                    status.classList.add('color-green');
                    status.classList.remove('color-red');
                  } else {
                    status.classList.add('color-red');
                    status.classList.remove('color-green');
                  }
                },
              };
              if (this.isMilestoneAcceptance()) this.subscription.add(this.packageForm.controls.milestoneEvidences.valueChanges.subscribe(observer));
              else this.subscription.add(this.packageForm.controls.packageEvidences.valueChanges.subscribe(observer));
              td.prepend(status);
            }
          }

          const commentTd = tr.querySelector('.comment');
          this.reworkPackageControl.updateCommentCell(commentTd, rowData);
        },
        expandable: true,
        onCreatedDetailsRow: (td: HTMLTableCellElement, rowData: Evidence | MilestoneEvidenceRow, rowIndex: number): void => {
          td.classList.add('related');
          td.classList.add(`id${rowData.internalId?.replace(/\s/g, '_')}`);
          if (rowData.relatedEvidences && rowData.relatedEvidences.length > 0) this.appendTableElement(rowData);
        },
      });
      table.init();
      this.packageEvidenceTable = table;
      this.scripts.push(this.packageEvidenceTable);
    }
  }

  private createSourceReportIconButton(rowData: Evidence): HTMLElement {
    const button = document.createElement('button');
    button.setAttribute('title', 'Source report');
    button.classList.add('spacingIcon', 'btn-icon');
    const icon = document.createElement('i');
    icon.classList.add('icon', 'icon-hierarchy-chart');
    button.appendChild(icon);
    button.addEventListener('click', () => {
      this.sourceReportAsEvidence(rowData);
    });

    return button;
  }

  /**
   * Open dialog to source report from NRO tool as evidence
   */
  private sourceReportAsEvidence(evidence: Evidence): void {
    const formValue = this.packageForm.controls.packageEvidences.value;
    const updatedEvidence: Evidence = formValue.find(data => data.internalId === evidence.internalId);
    const dialogRef = this.dialogService.createDialog(SourceSRSReportDialogComponent, {
      projectId: this.projectId,
      // TODO currently in rework wizard supports only sourcing of SDE report, so parentIds is not required.
      // TODO find out how to get list of network elements in the package
      // parentIds: this.packageDetails.networkElements.map(element => element.internalId),
      context: ToolContext.nro,
      isRework: true,
    });

    const dialogSubscription = dialogRef.instance.dialogResult.subscribe((result) => {
      if (!!result.attachedEvidence && result.attachedEvidence.length > 0) {
        const alreadyAdded = updatedEvidence.relatedEvidences?.map((entry: Evidence) => entry.internalId) || [];
        const newToAdd: Evidence[] = result.attachedEvidence.filter((evidence) => undefined === alreadyAdded.find(entry => entry === evidence.internalId))
          .map(entry => entry as unknown as Evidence);

        updatedEvidence.relatedEvidences = updatedEvidence.relatedEvidences.concat(newToAdd);
        const formData = Object.values(this.packageForm.controls.packageEvidences.value);
        const updatedFormData = formData.map((data) => {
          if (data.internalId === updatedEvidence.internalId) {
            return updatedEvidence; // Replace the matching element with the 'evidence' object
          }
          return data; // Keep the original 'data' element if it doesn't match
        });
        this.packageForm.controls.packageEvidences.patchValue(updatedFormData);
        this.appendTableElement(updatedEvidence)
      }
      dialogSubscription.unsubscribe();
    });
  }

  maximizeScreen(evidenceId: string, dataSourceTool: DataSourceTool): void {
    this.reworkPackageControl.maximizeScreen(evidenceId, dataSourceTool);
  }

  download(evidence: Evidence | MilestoneEvidenceRow): void {
    this.reworkPackageControl.download(evidence);
  }

  /**
   * open dialog to upload multiple evidences
   */
  public onUploadNewLineItemEvidence(evidence: Evidence): void {
    const formValue = this.packageForm.controls.packageEvidences.value;
    const updatedEvidence: Evidence = formValue.find(data => data.internalId === evidence.internalId);
    const dialogRef = this.dialogService.createDialog(UploadReferencedEvidenceDialogComponent, {
      projectId: this.projectId,
      lineItemId: updatedEvidence.lineItemId,
      name: updatedEvidence.lineItemId,
      parentEvidenceId: updatedEvidence.internalId,
      evidence: updatedEvidence,
      status: 'rework',
      type: 'package-evidence',
    });
    this.subscription.add(
      dialogRef.instance.dialogResult.subscribe((result: Evidence) => {
        if (!!result) {
          updatedEvidence.relatedEvidences.push(result);

          const formData = Object.values(this.packageForm.controls.packageEvidences.value);
          const updatedFormData = formData.map((data) => {
            if (data.internalId === updatedEvidence.internalId) {
              return updatedEvidence; // Replace the matching element with the 'evidence' object
            }
            return data; // Keep the original 'data' element if it doesn't match
          });
          this.packageForm.controls.packageEvidences.setValue(updatedFormData);
          this.appendTableElement(updatedEvidence);
        }
      })
    );
  }

  appendTableElement(parentEvidence: Evidence | MilestoneEvidenceRow): void {
    const parentElement = this.packageEvidenceTableElementRef.nativeElement.querySelector('tbody');
    const className = parentEvidence.internalId?.replace(/\s/g, '_');
    const parentTd = parentElement?.querySelector(`.id${className}`) as HTMLElement;
    if (parentTd) {
      parentTd.childNodes.forEach(item => {
        if (item.nodeType === Node.ELEMENT_NODE && (item as HTMLElement).tagName === 'TABLE') {
          item.remove();
        }
      })
    }

    const formValue = this.isMilestoneAcceptance() ? this.packageForm.controls.milestoneEvidences.value : this.packageForm.controls.packageEvidences.value;
    const updatedEvidence: Evidence | MilestoneEvidenceRow = formValue.find(data => data.internalId === parentEvidence.internalId);
    if (updatedEvidence && updatedEvidence.relatedEvidences?.length > 0) {
      const table = document.createElement('table');
      table.classList.add('evidence-table', 'table', 'tiny');
      const thead = document.createElement('thead');
      const trHead = document.createElement('tr');
      let headers = ['Evidence name', 'Remark', 'Last comment', 'Status', 'Action'];
      if (this.isMilestoneAcceptance()) headers = ['Evidence name', 'Type', 'Remark', 'Last comment', 'Status', 'Action'];
      headers.forEach(headerText => {
        const th = document.createElement('td');
        th.textContent = headerText;
        trHead.appendChild(th);
      });

      thead.appendChild(trHead);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      updatedEvidence.relatedEvidences.forEach((evidence: Evidence) => {
        const trBody = document.createElement('tr');
        let columns = [evidence.name, evidence.remarks || '--', '', AcceptancePackageUtils.getStatus(evidence.status), 'Action'];
        if (this.isMilestoneAcceptance()) columns = [evidence.name, evidence.type, evidence.remarks || '--', 'Comment', AcceptancePackageUtils.getStatus(evidence.status), 'Action'];
        columns.forEach((columnText, columnIndex) => {
          const td = document.createElement('td');
          if (columnText === AcceptancePackageUtils.getStatus(evidence.status)) {
            td.appendChild(AcceptancePackageUtils.getStatusTag(evidence.status));
          }
          else if (columnText === 'Action') {
            const eyeButton = document.createElement('button');
            eyeButton.classList.add('spacingIcon', 'btn-icon');
            eyeButton.setAttribute('title', 'View');
            const downloadButton = document.createElement('button');
            downloadButton.setAttribute('title', 'Download');
            downloadButton.classList.add('spacingIcon', 'btn-icon');
            const iconEye = document.createElement('i');
            iconEye.classList.add('icon', 'icon-eye');
            eyeButton.appendChild(iconEye);
            this.subscription.add(eyeButton.addEventListener('click', () => {
              this.maximizeScreen(evidence.internalId, DataSourceTool.ledger);
            }));
            td.appendChild(eyeButton);
            const iconDownload = document.createElement('i');
            iconDownload.classList.add('icon', 'icon-download-save');
            downloadButton.appendChild(iconDownload);
            this.subscription.add(downloadButton.addEventListener('click', () => {
              this.download(evidence);
            })
            );
            td.appendChild(downloadButton);
            if (!this.isMilestoneAcceptance()) {
              // Unlinking is not allowed while reworking milestone evidence
              const attachButton = document.createElement('button');
              attachButton.setAttribute('title', 'Unlink evidence');
              attachButton.classList.add('spacingIcon', 'btn-icon');
              const iconLink = document.createElement('i');
              iconLink.classList.add('icon', 'icon-unlink');
              attachButton.appendChild(iconLink);
              this.subscription.add(attachButton.addEventListener('click', () => {
                this.unlink(evidence).pipe(
                  tap(() => {
                    updatedEvidence.relatedEvidences = updatedEvidence.relatedEvidences.filter(e => e.internalId !== evidence.internalId);
                    evidence.parentEvidenceId = undefined;
                    const className = evidence?.internalId?.replace(/\s/g, '_');
                    const parentTBody = trBody.parentElement?.querySelector(`.id${className}`) as HTMLElement;
                    if (parentTBody) parentTBody.style.display = 'table-row';
                    if (table.querySelectorAll('tbody > tr')?.length === 1) table.remove();
                    else trBody.remove();
                    this.packageForm.patchValue(this.packageForm.value);
                  })
                ).subscribe({
                  next: (response) => {
                    this.notificationService.showNotification({
                      title: 'Evidence updated successfully',
                      description: ''
                    }, true);
                  },
                  error: (error) => {
                    this.notificationService.showNotification({
                      title: 'Error when updating evidence!',
                      description: 'Please follow the FAQ doc for further steps.'

                    }, true);
                  }
                });
                iconLink.classList.add('icon', 'icon-link');
                attachButton.appendChild(iconLink);
              })
              );
              td.appendChild(attachButton);
            }

            if (!this.isMilestoneAcceptance() && evidence.status === CustomerAcceptanceStatus.Ready && evidence.isDeletionAllowed) {
            // Deleting of milestone evidences is not allowed
              const deleteButton = document.createElement('button');
              deleteButton.setAttribute('title', 'Delete');
              deleteButton.classList.add('spacingIcon', 'btn-icon');
              const iconDelete = document.createElement('i');
              iconDelete.classList.add('icon', 'icon-trashcan');
              deleteButton.appendChild(iconDelete);
              this.subscription.add(deleteButton.addEventListener('click', () => {
                this.reworkPackageControl.delete(evidence, deleteButton).subscribe(() => {
                  updatedEvidence.relatedEvidences = updatedEvidence.relatedEvidences.filter(e => e.internalId !== evidence.internalId);
                  const className = evidence?.internalId?.replace(/\s/g, '_');
                  const parentTBody = trBody.parentElement?.querySelector(`.id${className}`) as HTMLElement;
                  if (parentTBody) parentTBody.style.display = 'table-row';
                  if (table.querySelectorAll('tbody > tr')?.length === 1) table.remove();
                  else trBody.remove();

                  this.packageForm.patchValue(this.packageForm.value);
                });
              }));

              td.appendChild(deleteButton);
            }
          }
          else if (columnText === 'Comment') {
            this.reworkPackageControl.updateCommentCell(td, evidence);
          }
          else {
            td.textContent = columnText;
          }
          trBody.appendChild(td);
        })
        tbody.appendChild(trBody);
      });
      table.appendChild(tbody);
      if (parentTd) {
        parentTd.appendChild(table);
      }
    }
  }

  unlink(evidence: Evidence): Observable<Evidence> {
    const requestBody = {
      parentEvidenceId: null
    };
    return this.networkRollOutService.patchEvidence(evidence.internalId, requestBody);
  }
}
