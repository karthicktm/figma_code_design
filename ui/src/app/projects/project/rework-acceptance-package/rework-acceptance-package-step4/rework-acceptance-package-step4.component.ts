import { AfterViewInit, Component, effect, ElementRef, input, Input, OnDestroy, OnInit, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ControlModel, ReworkPackageControlService } from '../rework-acceptance-package-control.service';
import { CustomerAcceptanceStatus, Evidence, LineItem, MilestoneEvidenceRow, RelatedEvidence } from 'src/app/projects/projects.interface';
import { LineItemTableData } from '../rework-acceptance-package.component';
import { TabGroup, Table } from '@eds/vanilla';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { DataSourceTool } from '../../acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnail/evidence-thumbnail.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rework-acceptance-package-step4',
  templateUrl: './rework-acceptance-package-step4.component.html',
  styleUrls: ['./rework-acceptance-package-step4.component.less']
})
export class ReworkAcceptancePackageStep4Component implements OnInit, AfterViewInit, OnDestroy {
  @Input() packageForm: FormGroup<ControlModel>;
  @Input() packageId: string;
  @Input() projectId: string;
  @Input() readonly currentStep?: number = 4;
  @Input() lineItems: LineItem[];
  protected readonly milestoneEvidenceData = input<MilestoneEvidenceRow[]>();
  protected readonly isMilestoneAcceptance = input.required<boolean>();
  private subscription: Subscription = new Subscription();
  lineItemTotalRecords: number = 0;
  evidenceTotalRecords: number = 0;
  milestoneEvidenceTotalRecords: number = 0;
  evidences: Evidence[] = [];
  rejectedEvidences: Evidence[] = [];

  private readonly lineItemComponentTableElementRef = viewChild.required<ElementRef<HTMLElement>>('lineItemComponentTable');
  private readonly packageEvidenceTableElementRef = viewChild<ElementRef<HTMLElement>>('packageEvidenceTable');
  private readonly milestoneEvidenceTableElementRef = viewChild<ElementRef<HTMLElement>>('milestoneEvidenceTable');

  originalTabConfigs = [
    { name: 'Line item components', status: 'line-item-components' },
    { name: 'Package evidences', status: 'package-evidences' },
    { name: 'Milestone evidences', status: 'milestone-evidences' }
  ];
  tabConfigs = [];
  private packageComponentTable: Table;
  private packageEvidenceTable: Table;
  private milestoneEvidenceTable: Table;
  private scripts: Scripts[] = [];
  public targetTab: string;

  constructor(
    private reworkPackageControl: ReworkPackageControlService,
  ) {
    effect(() => {
      const isMilestoneAcceptance = this.isMilestoneAcceptance();
      if (isMilestoneAcceptance) {
        this.tabConfigs = this.originalTabConfigs.filter(config => config.status !== 'package-evidences');
      } else {
        this.tabConfigs = this.originalTabConfigs.filter(config => config.status !== 'milestone-evidences');
      }
      const targetStatus = this.originalTabConfigs[0].status;
      this.openTab(targetStatus);
    });
  }

  ngOnInit(): void {
    this.packageForm.controls.packageComponents.valueChanges.subscribe({
      next: (lineItemData) => {
        this.lineItemTotalRecords = lineItemData.length;
        this.evidences = lineItemData.flatMap(data => {
          return data.evidences;
        });
        this.rejectedEvidences = this.evidences.filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected);
        this.packageComponentTable.update(lineItemData);
      },
    })

    this.packageForm.controls.packageEvidences.valueChanges.subscribe({
      next: (packageEvidenceData) => {
        this.evidenceTotalRecords = packageEvidenceData.filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected).length;
        if (this.packageEvidenceTable) this.packageEvidenceTable.update(packageEvidenceData);
      },
    })

    this.packageForm.controls.milestoneEvidences.valueChanges.subscribe({
      next: (milestoneEvidenceData) => {
        this.milestoneEvidenceTotalRecords = milestoneEvidenceData.filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected).length;
        if (this.milestoneEvidenceTable) this.milestoneEvidenceTable.update(milestoneEvidenceData);
      },
    });
  }

  ngAfterViewInit(): void {
    const tabs = document.querySelectorAll('.tabs');
    if (tabs) {
      Array.from(tabs).forEach(tabsDom => {
        const tabGroup = new TabGroup(tabsDom as HTMLElement);
        tabGroup.init();
        this.scripts.push(tabGroup);
      });
    }
    const lineItemData = this.packageForm.controls.packageComponents.value;
    const columnsProperties = [
      {
        key: 'lineItemLinearId',
        title: 'Line item',
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          this.reworkPackageControl.handleLineItemIdCell(td, cellData, this.packageForm.controls.packageComponents.value, { lineItems: this.lineItems, packageId: this.packageId });
        },
      },
      {
        key: 'description',
        title: 'Line item description',
        sort: 'none',
      },
      {
        key: 'rejectedFiles',
        title: 'Rejected evidence',
        sort: 'none',
      },
    ];
    const tableHeightStyleProp = 'calc(100vh - 353px - 124px)';
    const lineItemComponentTableDOM = this.lineItemComponentTableElementRef().nativeElement;

    if (lineItemComponentTableDOM) {
      const table = new Table(lineItemComponentTableDOM, {
        data: lineItemData || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        scroll: true,
        actions: true,
        expandable: true,

        onCreatedDetailsRow: (td: HTMLTableCellElement, rowData: LineItemTableData, rowIndex: number): void => {
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

            if (evidence?.relatedEvidences?.length > 0) {
              const relatedEvidencesTable = this.createRelatedEvidencesTable(evidence.relatedEvidences);
              const tr = document.createElement('tr');
              const td = document.createElement('td');
              td.setAttribute('colspan', '10');
              td.appendChild(relatedEvidencesTable);
              tr.appendChild(td);
              tbody.appendChild(tr);
            }
          });

          table.appendChild(tbody);

          td.appendChild(table);
        }
      });
      table.init();
      this.packageComponentTable = table;
      this.scripts.push(this.packageComponentTable);
    }

    const evidenceColumnProperties = [
      {
        key: 'name',
        title: 'Evidence name',
        sort: 'none',
      },
      {
        key: 'tag',
        title: 'Tag',
        sort: 'none',
      },
      {
        key: 'remarks',
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
    const evidenceTableHeightStyleProp = 'calc(100vh - 351px - 124px)';
    const packageEvidenceTableDOM = this.packageEvidenceTableElementRef()?.nativeElement;
    if (packageEvidenceTableDOM) {
      const packageEvidenceData = this.packageForm.controls.packageEvidences.value;
      const evidenceTable = new Table(packageEvidenceTableDOM, {
        data: packageEvidenceData || [],
        columns: evidenceColumnProperties,
        height: evidenceTableHeightStyleProp,
        scroll: true,
        onCreatedRow: (tr: HTMLTableRowElement, rowData: Evidence): void => {
          const td = tr.querySelector('.comment');
          this.reworkPackageControl.updateCommentCell(td, rowData);
        },
        actions: true,
        onCreatedActionsCell: (td: HTMLTableCellElement, rowData: Evidence): void => {
          const eyeButton = document.createElement('button');
          eyeButton.classList.add('spacingIcon', 'btn-icon');
          eyeButton.setAttribute('title', 'View');
          const iconEye = document.createElement('i');
          iconEye.classList.add('icon', 'icon-eye');
          eyeButton.appendChild(iconEye);
          this.subscription.add(eyeButton.addEventListener('click', () => {
            this.maximizeScreen(rowData.internalId, DataSourceTool.ledger);
          }));
          td.appendChild(eyeButton);
        },

        expandable: true,
        onCreatedDetailsRow: (td: HTMLTableCellElement, rowData: Evidence, rowIndex: number): void => {
          if (rowData?.relatedEvidences?.length > 0) {
            const table = document.createElement('table');
            table.classList.add('evidence-table', 'table', 'tiny', `lineItemId-${rowData.lineItemId}`);
            const thead = this.createRelatedEvidenceHeader();
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            rowData.relatedEvidences.forEach(evidence => {
              const tr = this.createRelatedEvidenceRow(evidence);
              tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            td.appendChild(table);
          }
        },

      });
      evidenceTable.init();
      this.packageEvidenceTable = evidenceTable;
      this.scripts.push(this.packageEvidenceTable);
    }

    if (this.isMilestoneAcceptance()) {
      const tagIndex = evidenceColumnProperties.findIndex(property => property.title === 'Tag');
      if (tagIndex !== -1) {
        evidenceColumnProperties.splice(
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
    const milestoneEvidenceTableDOM = this.milestoneEvidenceTableElementRef()?.nativeElement;
    if (milestoneEvidenceTableDOM) {
      const milestoneEvidenceData = this.packageForm.controls.milestoneEvidences.value;
      const milestoneEvidenceTable = new Table(milestoneEvidenceTableDOM, {
        data: milestoneEvidenceData || [],
        columns: evidenceColumnProperties,
        height: evidenceTableHeightStyleProp,
        scroll: true,
        onCreatedRow: (tr: HTMLTableRowElement, rowData: MilestoneEvidenceRow): void => {
          const td = tr.querySelector('.comment');
          this.reworkPackageControl.updateCommentCell(td, rowData);
        },
        actions: true,
        onCreatedActionsCell: (td: HTMLTableCellElement, rowData: MilestoneEvidenceRow): void => {
          const eyeButton = document.createElement('button');
          eyeButton.classList.add('spacingIcon', 'btn-icon');
          eyeButton.setAttribute('title', 'View');
          const iconEye = document.createElement('i');
          iconEye.classList.add('icon', 'icon-eye');
          eyeButton.appendChild(iconEye);
          this.subscription.add(eyeButton.addEventListener('click', () => {
            this.maximizeScreen(rowData.internalId, DataSourceTool.ledger);
          }));
          td.appendChild(eyeButton);
        },
        expandable: true,
        onCreatedDetailsRow: (td: HTMLTableCellElement, rowData: MilestoneEvidenceRow, rowIndex: number): void => {
          if (rowData?.relatedEvidences?.length > 0) {
            const table = document.createElement('table');
            table.classList.add('evidence-table', 'table', 'tiny');
            const thead = this.createRelatedEvidenceHeader();
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            rowData.relatedEvidences.forEach(evidence => {
              const tr = this.createRelatedEvidenceRow(evidence);
              tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            td.appendChild(table);
          }
        },
      });
      milestoneEvidenceTable.init();
      this.milestoneEvidenceTable = milestoneEvidenceTable;
      this.scripts.push(this.milestoneEvidenceTable);
    }
  }

  private createRelatedEvidencesTable(evidences: (Evidence | RelatedEvidence)[]): HTMLTableElement {
    const headers = ['Evidence name', 'Remark', 'Last comment', 'Status', 'Action'];
    const thead = document.createElement('thead');
    headers.forEach(headerText => {
      const td = document.createElement('td');
      td.textContent = headerText;
      thead.appendChild(td);
    });

    const relatedEvidencesRows = evidences.map((evidence: Evidence) => {
      const tr = document.createElement('tr');
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
          const iconEye = document.createElement('i');
          iconEye.classList.add('icon', 'icon-eye');
          eyeButton.appendChild(iconEye);
          this.subscription.add(eyeButton.addEventListener('click', () => {
            this.maximizeScreen(evidence.internalId, DataSourceTool.nro);
          }));
          td.appendChild(eyeButton);
        }
        else if (columnIndex === 2) {
          this.reworkPackageControl.updateCommentCell(td, evidence);
        }
        else {
          td.textContent = columnText;
        }
        tr.appendChild(td);
      });

      return tr;
    });

    const table = document.createElement('table');
    table.classList.add('evidence-table', 'table', 'tiny');
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    relatedEvidencesRows.forEach(tr => tbody.appendChild(tr));
    table.appendChild(tbody);

    return table;
  }

  private createRelatedEvidenceHeader(): HTMLTableSectionElement {
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    let headers = ['Evidence name', 'Tag', 'Remark', 'Last comment', 'Status', 'Action'];
    if (this.isMilestoneAcceptance()) headers = ['Evidence name', 'Type', 'Remark', 'Last comment', 'Status', 'Action'];
    headers.forEach(headerText => {
      const th = document.createElement('td');
      th.textContent = headerText;
      trHead.appendChild(th);
    });

    thead.appendChild(trHead);

    return thead;
  }

  private createRelatedEvidenceRow(evidence: (Evidence | RelatedEvidence)): HTMLTableRowElement {
    const tr = document.createElement('tr');
    let columns = [evidence.name, evidence.tag, evidence.remarks || '--', '', AcceptancePackageUtils.getStatus(evidence.status), 'Action'];
    if (this.isMilestoneAcceptance()) columns = [evidence.name, evidence.type, evidence.remarks || '--', '', AcceptancePackageUtils.getStatus(evidence.status), 'Action'];
    columns.forEach((columnText, columnIndex) => {
      const td = document.createElement('td');
      if (columnText === AcceptancePackageUtils.getStatus(evidence.status)) {
        td.appendChild(AcceptancePackageUtils.getStatusTag(evidence.status));
      }
      else if (columnText === 'Action') {
        const eyeButton = document.createElement('button');
        eyeButton.classList.add('spacingIcon', 'btn-icon');
        eyeButton.setAttribute('title', 'View');
        const iconEye = document.createElement('i');
        iconEye.classList.add('icon', 'icon-eye');
        eyeButton.appendChild(iconEye);
        this.subscription.add(eyeButton.addEventListener('click', () => {
          this.maximizeScreen(evidence.internalId, DataSourceTool.nro);
        }));
        td.appendChild(eyeButton);
      }
      else if (columnIndex === 3) {
        this.reworkPackageControl.updateCommentCell(td, evidence);
      }
      else {
        td.textContent = columnText;
      }
      tr.appendChild(td);
    });
    return tr;
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  public openTab(acceptancePackageTab: string): void {
    this.targetTab = acceptancePackageTab;
  }

  maximizeScreen(internalId: string, dataSourceTool: DataSourceTool): void {
    this.reworkPackageControl.maximizeScreen(internalId, dataSourceTool);
  }

  download(evidence: Evidence): void {
    this.reworkPackageControl.download(evidence);
  }

}
