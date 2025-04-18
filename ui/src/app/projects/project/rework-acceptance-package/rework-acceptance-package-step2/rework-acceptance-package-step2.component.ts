import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Table } from '@eds/vanilla';
import { CustomerAcceptanceStatus, Evidence, LineItem, PackageDetails, RelatedEvidence, ToolContext } from 'src/app/projects/projects.interface';
import { Observable, PartialObserver, Subscription, tap } from 'rxjs';
import { ControlModel, ReworkPackageControlService } from '../rework-acceptance-package-control.service';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { DataSourceTool } from '../../acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnail/evidence-thumbnail.component';
import { LineItemTableData } from '../rework-acceptance-package.component';
import { UploadReferencedEvidenceDialogComponent } from 'src/app/projects/upload-referenced-evidence-dialog/upload-referenced-evidence-dialog.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { FormGroup } from '@angular/forms';
import { Data, RaEvidenceDialogComponent } from '../ra-evidence-dialog/ra-evidence-dialog.component';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { SourceSRSReportDialogComponent } from '../../acceptance-package-details/attached-documents/source-srs-report-dialog/source-srs-report-dialog.component';
import { CommentLevel } from '../../acceptance-package-details/comment-history/comment-history.component';

@Component({
  selector: 'app-rework-acceptance-package-step2',
  templateUrl: './rework-acceptance-package-step2.component.html',
  styleUrls: ['./rework-acceptance-package-step2.component.less'],
})
export class ReworkAcceptancePackageStep2Component implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('packageComponentTable') private readonly packageComponentTableElementRef: ElementRef<HTMLElement>;
  @Input() packageForm: FormGroup<ControlModel>;
  @Input() lineItemData: LineItemTableData[];
  @Input() packageDetails: PackageDetails;
  @Input() lineItems: LineItem[];
  @Input() projectId: string;
  @Input() readonly currentStep?: number = 2;
  evidenceDetails: Evidence[] = [];
  private subscription: Subscription = new Subscription();
  private packageComponentTable: Table;
  private scripts: Scripts[] = [];

  constructor(
    private reworkPackageControl: ReworkPackageControlService,
    private el: ElementRef,
    private dialogService: DialogService,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.lineItemData
      && changes.lineItemData.previousValue !== changes.lineItemData.currentValue
    ) {
      this.packageComponentTable.update(this.lineItemData);
      this.switchButtonChange();
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
    const columnsProperties = [
      {
        key: 'lineItemLinearId',
        title: 'Line item',
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          this.reworkPackageControl.handleLineItemIdCell(td, cellData, this.lineItemData, {
            lineItems: this.lineItems,
            packageId: this.packageDetails.packageId,
            enableStatusIndicator: true,
            parentIsEvidenceControl: this.packageForm.controls.linkWithRejectedComponentEvidence,
            lineItemsControl: this.packageForm.controls.packageComponents,
          });
        },
      },
      {
        key: 'description',
        title: 'Line item description',
        sort: 'none',
      },
      {
        key: 'rejectedFiles',
        title: 'Rejected Evidence',
        sort: 'none',
      },
      {
        key: '',
        title: 'Action',
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string, index: number): void => {
          const rowData = this.packageComponentTable?.data[index] as unknown as LineItemTableData;
          const lineItemId = rowData.lineItemLinearId;
          td.appendChild(this.createUploadIconButton({ lineItemId }));
          td.appendChild(this.createSourceReportIconButton({ lineItemId }));
          td.appendChild(this.reworkPackageControl.createCommentIconButton({ 
            commentLevel: CommentLevel.lineItem,
            lineItemUniqueId: lineItemId,
            packageId: this.packageDetails.packageId,
            name: rowData.lineItemName,
            // package status that allows adding comments via comment history component
            packageStatus: CustomerAcceptanceStatus.CustomerNew
          }));
        },
      },
    ];
    const tableHeightStyleProp = 'calc(100vh - 345px - 124px)';
    const packageComponentTableDOM = this.packageComponentTableElementRef.nativeElement;

    if (packageComponentTableDOM) {
      const table = new Table(packageComponentTableDOM, {
        data: this.lineItemData || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        scroll: true,
        expandable: true,
        onCreatedDetailsRow: (tr: HTMLTableRowElement, rowData: LineItemTableData, rowIndex: number): void => {
          const table = document.createElement('table');
          table.classList.add('evidence-table', 'table', 'tiny', `lineItemId-${rowData.lineItemId}`);
          const thead = document.createElement('thead');
          const trHead = document.createElement('tr');
          const headers = ['Evidence name', 'Remark', 'Last comment', 'Status', 'Action'];
          headers.forEach(headerText => {
            const th = document.createElement('td');
            th.textContent = headerText;
            trHead.appendChild(th);
          });

          thead.appendChild(trHead);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          rowData.evidences.forEach(evidence => {
            const trBody = document.createElement('tr');
            trBody.classList.add(`id${evidence.internalId?.replace(/\s/g, '_')}`);
            if (evidence.status !== CustomerAcceptanceStatus.CustomerRejected && evidence.parentEvidenceId) trBody.style.display = 'none';
            const columns = [evidence.name, evidence.remarks || '--', '', AcceptancePackageUtils.getStatus(evidence.status), 'Action'];
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

                if (evidence.status === CustomerAcceptanceStatus.CustomerRejected) {
                  const attachButton = document.createElement('button');
                  attachButton.setAttribute('title', 'Link evidence');
                  attachButton.classList.add('spacingIcon', 'btn-icon');
                  if (this.packageForm.getRawValue().linkWithRejectedComponentEvidence === false) attachButton.classList.add('hide-button');
                  const iconLink = document.createElement('i');
                  iconLink.classList.add('icon', 'icon-link', 'evidence-level');
                  attachButton.appendChild(iconLink);
                  this.subscription.add(attachButton.addEventListener('click', () => {
                    this.raEvidence(
                      rowData.lineItemId,
                      evidence,
                      rowData.evidences.filter(evidence => evidence.status === CustomerAcceptanceStatus.Ready && !evidence.parentEvidenceId), // parentEvidenceId can be null or undefined
                      trBody,
                    );
                  }));

                  td.appendChild(attachButton);

                  td.appendChild(this.createUploadIconButton({ evidence }, trBody));

                  td.appendChild(this.createSourceReportIconButton({ evidence }, trBody));
                }

                if (evidence.status === CustomerAcceptanceStatus.Ready && evidence.isDeletionAllowed) {
                  const deleteButton = document.createElement('button');
                  deleteButton.setAttribute('title', 'Delete');
                  deleteButton.classList.add('spacingIcon', 'btn-icon');
                  const iconDelete = document.createElement('i');
                  iconDelete.classList.add('icon', 'icon-trashcan');
                  deleteButton.appendChild(iconDelete);
                  this.subscription.add(deleteButton.addEventListener('click', () => {
                    this.reworkPackageControl.delete(evidence, deleteButton).subscribe(() => {
                      const formValue = this.packageForm.controls.packageComponents.value;
                      const lineItem = formValue.find(lineItem => lineItem.lineItemLinearId === rowData.lineItemLinearId);
                      lineItem.evidences = lineItem.evidences.filter(e => e.internalId !== evidence.internalId);
                      this.packageForm.patchValue(this.packageForm.value);
                      this.packageComponentTable.update(formValue);
                      this.switchButtonChange();
                    });
                  }));

                  td.appendChild(deleteButton);
                }
              }
              else if (columnIndex === 2) {
                this.reworkPackageControl.updateCommentCell(td, evidence);
              }
              else {
                td.textContent = columnText;
              }
              trBody.appendChild(td);
            });

            tbody.appendChild(trBody);
            if (evidence.relatedEvidences && evidence.relatedEvidences?.length > 0) this.appendTableElement(evidence.relatedEvidences, evidence, trBody);
          });

          table.appendChild(tbody);

          tr.appendChild(table);
        }
      });
      table.init();
      this.packageComponentTable = table;
      this.switchButtonChange();
      this.scripts.push(this.packageComponentTable);
    }

    this.subscription.add(
      this.packageForm.controls.linkWithRejectedComponentEvidence.valueChanges.subscribe(value => {
        this.switchButtonChange();
      })
    );
  }

  switchButtonChange(): void {
    const isToLinkWithEvidence = this.packageForm.getRawValue().linkWithRejectedComponentEvidence;
    const tableElement = this.packageComponentTableElementRef?.nativeElement;
    tableElement.querySelectorAll('.evidence-table').forEach(data => {
      const iconOnEvidenceLevel = data.querySelectorAll('tbody .evidence-level');
      const classListMethod = isToLinkWithEvidence ? 'remove' : 'add';
      if (iconOnEvidenceLevel) {
        iconOnEvidenceLevel.forEach(btn => {
          btn?.parentElement?.classList[classListMethod]('hide-button');
        });
      }
    });
    tableElement.querySelectorAll('tbody .line-item-level').forEach(iconOnLineItemLevel => {
      const classListMethod = isToLinkWithEvidence ? 'add' : 'remove';
      iconOnLineItemLevel?.parentElement?.classList[classListMethod]('hide-button');
    });
  }

  maximizeScreen(evidenceId: string, dataSourceTool: DataSourceTool): void {
    this.reworkPackageControl.maximizeScreen(evidenceId, dataSourceTool);
  }

  download(evidence: Evidence): void {
    this.reworkPackageControl.download(evidence);
  }

  link(evidence: Evidence, parentEvidenceId: string): Observable<Evidence> {
    return this.networkRollOutService.patchEvidence(evidence.internalId, { parentEvidenceId });
  }

  unlink(evidence: Evidence): Observable<Evidence> {
    const requestBody = {
      parentEvidenceId: null
    };
    return this.networkRollOutService.patchEvidence(evidence.internalId, requestBody);
  }

  private patchEvidenceObserver: PartialObserver<Evidence> = {
    next: (): void => {
      this.notificationService.showNotification({
        title: 'Evidence updated successfully',
        description: ''
      }, true);
    },
    error: (): void => {
      this.notificationService.showNotification({
        title: 'Error when updating evidence!',
        description: 'Click to open the FAQ doc for further steps.'
      }, true);
    },
  }

  private createUploadIconButton(input: { evidence?: Evidence, lineItemId?: string }, tr?: HTMLTableRowElement): HTMLElement {
    const button = document.createElement('button');
    button.setAttribute('title', 'Upload');
    button.classList.add('spacingIcon', 'btn-icon');
    const iconUpload = document.createElement('i');
    iconUpload.classList.add('icon', 'icon-upload');
    if (input.lineItemId) {
      iconUpload.classList.add('line-item-level');
    } else {
      iconUpload.classList.add('evidence-level');
      button.classList.add('hide-button')
    }
    button.appendChild(iconUpload);
    this.subscription.add(button.addEventListener('click', () => {
      this.onUploadNewLineItemEvidence(input, tr);
    })
    );

    return button;
  }

  private onUploadNewLineItemEvidence(input: { evidence?: Evidence, lineItemId?: string }, tr?: HTMLTableRowElement): void {
    const isToLinkWithEvidence = this.packageForm.getRawValue().linkWithRejectedComponentEvidence;
    const dialogRef = this.dialogService.createDialog(UploadReferencedEvidenceDialogComponent, {
      projectId: this.projectId,
      lineItemId: isToLinkWithEvidence ? input.evidence.lineItemId : input.lineItemId,
      name: isToLinkWithEvidence ? input.evidence.lineItemId : input.lineItemId,
      parentEvidenceId: isToLinkWithEvidence ? input.evidence.internalId : undefined,
      evidence: isToLinkWithEvidence ? input.evidence : undefined,
      status: 'rework',
      type: 'package-component',
    });
    this.subscription.add(
      dialogRef.instance.dialogResult.subscribe((result: Evidence) => {
        if (!!result) {
          isToLinkWithEvidence
            ? this.appendTableElement([result], input.evidence, tr)
            : this.appendLineItemEvidence([result], input.lineItemId);
        }
      })
    );
  }

  appendLineItemEvidence(newEvidences: Evidence[], lineItemId: string): void {
    const packageComponentsControl = this.packageForm.controls.packageComponents;
    const lineItem = packageComponentsControl.value.find(lineItem => lineItem.lineItemLinearId === lineItemId);
    lineItem.evidences.push(...newEvidences);
    this.packageForm.patchValue(this.packageForm.value);

    this.packageComponentTable.update(packageComponentsControl.value);
    this.switchButtonChange();
  }

  private createSourceReportIconButton(input: { evidence?: Evidence, lineItemId?: string }, tr?: HTMLTableRowElement): HTMLElement {
    const button = document.createElement('button');
    button.setAttribute('title', 'Source report');
    button.classList.add('spacingIcon', 'btn-icon');
    const icon = document.createElement('i');
    icon.classList.add('icon', 'icon-hierarchy-chart');
    if (input.lineItemId) {
      icon.classList.add('line-item-level');
    } else {
      icon.classList.add('evidence-level');
      button.classList.add('hide-button')
    }
    button.appendChild(icon);
    button.addEventListener('click', () => {
      this.sourceReportAsEvidence(input, tr);
    });

    return button;
  }

  /**
   * Open dialog to source report from NRO tool as evidence
   */
  private sourceReportAsEvidence(input: { evidence?: Evidence, lineItemId?: string }, tr?: HTMLTableRowElement): void {
    const isToLinkWithEvidence = this.packageForm.getRawValue().linkWithRejectedComponentEvidence;
    const dialogRef = this.dialogService.createDialog(SourceSRSReportDialogComponent, {
      projectId: this.projectId,
      parentId: isToLinkWithEvidence ? input.evidence.lineItemId : input.lineItemId,
      parentType: 'LineItem',
      // TODO currently in rework wizard supports only sourcing of SDE report, so parentIds is not required.
      // TODO find out how to get list of network elements in the package
      // parentIds: this.packageDetails.networkElements.map(element => element.internalId),
      context: ToolContext.nro,
      isRework: true,
    });

    const dialogSubscription = dialogRef.instance.dialogResult.subscribe((result) => {
      if (!!result.attachedEvidence && result.attachedEvidence.length > 0) {

        const linkNewEvidences = (newToAdd: Evidence[]): void => {
          newToAdd.forEach(newEvidence => {
            const newE: Evidence = {
              ...newEvidence,
              status: CustomerAcceptanceStatus.Ready,
            } as any;
            this.link(
              newE,
              input.evidence.internalId
            ).subscribe(this.patchEvidenceObserver);
          });
        }

        if (isToLinkWithEvidence === true) {
          const alreadyAdded = input.evidence.relatedEvidences?.map((entry: Evidence) => entry.internalId) || [];
          const resultEvidences = result.attachedEvidence as any as Evidence[];
          const newToAdd: Evidence[] = resultEvidences.filter((evidence) => undefined === alreadyAdded.find(entry => entry === evidence.internalId));

          this.appendTableElement(newToAdd, input.evidence, tr);
          linkNewEvidences(newToAdd);
        } else {
          const lineItem = this.packageForm.controls.packageComponents.value.find(lineItem => lineItem.lineItemLinearId === input.lineItemId);
          const alreadyAdded = lineItem?.evidences?.map(evidence => evidence.internalId) || [];
          const resultEvidences = result.attachedEvidence as any as Evidence[];
          const newToAdd: Evidence[] = resultEvidences.filter((evidence) => undefined === alreadyAdded.find(entry => entry === evidence.internalId));

          this.appendLineItemEvidence(newToAdd, input.lineItemId);
        }
      }
      dialogSubscription.unsubscribe();
    });
  }

  appendTableElement(result: (Evidence | RelatedEvidence)[], parentEvidence: Evidence, tr: HTMLTableRowElement): void {
    if (parentEvidence.relatedEvidences === undefined) parentEvidence.relatedEvidences = [];
    const newRelatedEvidences = result.filter(
      evidence => !(parentEvidence.relatedEvidences as Evidence[]).find(alreadyRelatedEvidence => evidence.internalId === alreadyRelatedEvidence.internalId)
    );
    parentEvidence.relatedEvidences = parentEvidence.relatedEvidences.concat(newRelatedEvidences);
    const formValue = this.packageForm.controls.packageComponents.value;
    const formLineItemData = Object.values(formValue);
    const updatedEvidence = formLineItemData.find(data => data.lineItemLinearId === parentEvidence.lineItemId).evidences.find(data => data.internalId === parentEvidence.internalId);
    this.packageForm.patchValue(this.packageForm.value);
    if (this.packageForm.controls.linkWithRejectedComponentEvidence.value === true) {
      this.packageForm.controls.linkWithRejectedComponentEvidence.disable();
    }

    const table = document.createElement('table');
    table.classList.add('evidence-table', 'table', 'tiny');
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    const headers = ['Evidence name', 'Remark', 'Last comment', 'Status', 'Action'];
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
      const columns = [evidence.name, evidence.remarks || '--', '', AcceptancePackageUtils.getStatus(evidence.status), 'Action'];
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
          const attachButton = document.createElement('button');
          attachButton.setAttribute('title', 'Unlink evidence');
          attachButton.classList.add('spacingIcon', 'btn-icon');
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
          const iconLink = document.createElement('i');
          iconLink.classList.add('icon', 'icon-unlink');
          attachButton.appendChild(iconLink);
          this.subscription.add(attachButton.addEventListener('click', () => {
            this.unlink(evidence).pipe(
              tap(() => {
                updatedEvidence.relatedEvidences = updatedEvidence.relatedEvidences.filter(e => e.internalId !== evidence.internalId);
                evidence.parentEvidenceId = undefined;
                const className = evidence?.internalId?.replace(/\s/g, '_');
                const parentTBody = tr.parentElement?.querySelector(`.id${className}`) as HTMLElement;
                if (parentTBody) parentTBody.style.display = 'table-row';
                if (table.querySelectorAll('tbody > tr')?.length === 1) table.remove();
                else trBody.remove();
                this.packageForm.patchValue(this.packageForm.value);
              })
            ).subscribe(this.patchEvidenceObserver);
          })
          );
          td.appendChild(attachButton);

          if (evidence.status === CustomerAcceptanceStatus.Ready && evidence.isDeletionAllowed) {
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
                const parentTBody = tr.parentElement?.querySelector(`.id${className}`) as HTMLElement;
                if (parentTBody) parentTBody.remove();
                if (table.querySelectorAll('tbody > tr')?.length === 1) table.remove();
                else trBody.remove();

                const lineItem = formValue.find(lineItem => lineItem.lineItemLinearId === parentEvidence.lineItemId);
                lineItem.evidences = lineItem.evidences.filter(e => e.internalId !== evidence.internalId);
                this.packageForm.patchValue(this.packageForm.value);
              });
            }));

            td.appendChild(deleteButton);
          }
        }
        else if (columnIndex === 2) {
          this.reworkPackageControl.updateCommentCell(td, evidence);
        }
        else {
          td.textContent = columnText;
        }
        trBody.appendChild(td);
      })
      tbody.appendChild(trBody);
      const className = evidence?.internalId?.replace(/\s/g, '_');
      const parentTBody = tr.parentElement?.querySelector(`.id${className}`) as HTMLElement;
      if (parentTBody) parentTBody.style.display = 'none';

    });
    table.appendChild(tbody);

    const tdElements = document.createElement('td');
    tdElements.setAttribute('colspan', '5');
    tdElements.appendChild(table);

    if (tr.nextElementSibling && tr.nextElementSibling.classList.contains('related')) {
      tr.nextElementSibling.replaceChildren(tdElements);
    } else {
      const rowElement = document.createElement('tr');
      rowElement.classList.add('related');
      rowElement.appendChild(tdElements);
      tr.insertAdjacentElement('afterend', rowElement);
    }

  }

  raEvidence(
    lineItemId: string,
    evidence: Evidence,
    newEvidences: Evidence[] = [],
    tr: HTMLTableRowElement,
  ): void {
    const dialogData: Data = {
      evidence,
      lineItemId,
      newEvidences,
      packageId: this.packageDetails.packageId,
      projectId: this.projectId,
      resultHandler: (result) => {
        if (result && result.length > 0) {
          result.forEach(newEvidence => {
            this.link(newEvidence, evidence.internalId).pipe(
              tap(() => {
                newEvidence.parentEvidenceId = evidence.internalId;
                this.appendTableElement([newEvidence], evidence, tr);
              }),
            ).subscribe(this.patchEvidenceObserver);
          });
        }
      },
      openExpandedViewHandler: (evidenceId, sourceTool) => {
        this.reworkPackageControl.maximizeScreen(evidenceId, sourceTool);
      },
    }
    const dialogRef = this.dialogService.createDialog(RaEvidenceDialogComponent, dialogData);
  }
}
