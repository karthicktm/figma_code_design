import { AfterViewInit, Component, effect, ElementRef, input, Input, OnChanges, OnDestroy, SimpleChanges, viewChild } from '@angular/core';
import { TabGroup, Table } from '@eds/vanilla';
import { CustomerAcceptanceStatus, Evidence, LineItem, MilestoneEvidenceRow } from 'src/app/projects/projects.interface';
import { ReworkPackageControlService } from '../rework-acceptance-package-control.service';
import { LineItemTableData } from '../rework-acceptance-package.component';
import { updateNoDataRowInTable } from 'src/app/shared/table-utilities';
@Component({
  selector: 'app-rework-acceptance-package-step1',
  templateUrl: './rework-acceptance-package-step1.component.html',
  styleUrls: ['./rework-acceptance-package-step1.component.less']
})
export class ReworkAcceptancePackageStep1Component implements AfterViewInit, OnChanges, OnDestroy {
  private readonly lineItemComponentTableElementRef = viewChild.required<ElementRef<HTMLElement>>('lineItemComponentTable');
  private readonly packageEvidenceTableElementRef = viewChild<ElementRef<HTMLElement>>('packageEvidenceTable');
  private readonly milestoneEvidenceTableElementRef = viewChild<ElementRef<HTMLElement>>('milestoneEvidenceTable');

  originalTabConfigs = [
    { name: 'Line item components', status: 'line-item-components' },
    { name: 'Package evidences', status: 'package-evidences' },
    { name: 'Milestone evidences', status: 'milestone-evidences' }
  ];
  tabConfigs = [];
  private scripts: Scripts[] = [];
  public targetTab: string;
  @Input() lineItemData: LineItemTableData[] = [];
  lineItemTotalRecords: number = 0;
  evidenceTotalRecords: number = 0;
  milestoneEvidenceTotalRecords: number = 0;
  @Input() evidenceData: Evidence[] = [];
  @Input() evidenceDetails: Evidence[] = [];
  @Input() packageId: string;
  @Input() lineItems: LineItem[];
  protected readonly milestoneEvidenceData = input<MilestoneEvidenceRow[]>();
  protected readonly isMilestoneAcceptance = input.required<boolean>();
  private lineItemComponentTable: Table;
  private packageEvidenceTable: Table;
  private milestoneEvidenceTable: Table;
  evidences: Evidence[] = [];


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

    effect(() => {
      const milestoneEvidenceData = this.milestoneEvidenceData();
      if (milestoneEvidenceData && milestoneEvidenceData.length > 0) {
        const milestoneEvidences = milestoneEvidenceData.filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected);
        this.milestoneEvidenceTotalRecords = milestoneEvidences.length;
        if (this.milestoneEvidenceTable) this.milestoneEvidenceTable.update(milestoneEvidences);
      } else {
        updateNoDataRowInTable(this.milestoneEvidenceTable, 'No data found.');
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.lineItemData
      && changes.lineItemData.previousValue !== changes.lineItemData.currentValue
    ) {
      if (this.lineItemData) {
        this.lineItemTotalRecords = this.lineItemData.length;
        this.evidences = this.lineItemData.flatMap(data => {
          return data.evidences.filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected);
        });
        this.lineItemComponentTable.update(this.lineItemData);
        if (this.lineItemTotalRecords === 0) {
          updateNoDataRowInTable(this.lineItemComponentTable, 'No data found.');
        }
      }

      if (this.evidenceData && this.evidenceData.length > 0) {
        const evidenceData = this.evidenceData.filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected);
        this.evidenceTotalRecords = evidenceData.length;
        if (this.packageEvidenceTable) this.packageEvidenceTable.update(evidenceData);
      } else {
        updateNoDataRowInTable(this.packageEvidenceTable, 'No data found.');
      }
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
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
    const columnsProperties = [
      {
        key: 'lineItemLinearId',
        title: 'Line item',
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          this.reworkPackageControl.handleLineItemIdCell(td, cellData, this.lineItemData, { lineItems: this.lineItems, packageId: this.packageId });
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
    const lineItemComponentTable = this.lineItemComponentTableElementRef().nativeElement;

    if (lineItemComponentTable) {
      const table = new Table(lineItemComponentTable, {
        data: this.lineItemData || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        scroll: true,
        expandable: true,
        onCreatedDetailsRow: (td: HTMLTableCellElement, data: LineItemTableData): void => {
          const table = document.createElement('table');
          table.classList.add('evidence-table', 'table', 'tiny');
          const thead = document.createElement('thead');
          const trHead = document.createElement('tr');
          const headers = ['Evidence name', 'Remark', 'Last comment'];
          headers.forEach(headerText => {
            const th = document.createElement('td');
            th.textContent = headerText;
            trHead.appendChild(th);
          });

          thead.appendChild(trHead);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          table.appendChild(tbody);
          this.evidenceDetails = data.evidences.filter(evidence => evidence.status === CustomerAcceptanceStatus.CustomerRejected);
          this.evidenceDetails.forEach(evidence => {
            const tr = document.createElement('tr');
            const nameTd = document.createElement('td');
            nameTd.appendChild(document.createTextNode(evidence.name));
            const remarksTd = document.createElement('td');
            remarksTd.appendChild(document.createTextNode(evidence.remarks));
            const lastCommentTd = document.createElement('td');
            this.reworkPackageControl.updateCommentCell(lastCommentTd, evidence);
            tr.replaceChildren(nameTd, remarksTd, lastCommentTd);
            tbody.appendChild(tr);
          });
          if (this.evidenceDetails.length === 0) {
            updateNoDataRowInTable(this.lineItemComponentTable, 'No data found.')
          }
          td.replaceChildren(table);
        }
      });
      table.init();
      this.lineItemComponentTable = table;
      updateNoDataRowInTable(this.lineItemComponentTable, 'Loading...');
      this.scripts.push(this.lineItemComponentTable);
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
      },
      {
        key: 'comment',
        title: 'Last comment',
        sort: 'none',
        cellClass: 'comment',
      },
    ];
    const evidenceTableHeightStyleProp = 'calc(100vh - 290px - 124px)';
    const packageEvidenceTableDOM = this.packageEvidenceTableElementRef()?.nativeElement;
    if (packageEvidenceTableDOM) {
      const evidenceTable = new Table(packageEvidenceTableDOM, {
        data: this.evidenceData || [],
        columns: evidenceColumnProperties,
        height: evidenceTableHeightStyleProp,
        scroll: true,
        onCreatedRow: (tr: HTMLTableRowElement, rowData: Evidence): void => {
          const td = tr.querySelector('.comment');
          this.reworkPackageControl.updateCommentCell(td, rowData);
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
      const milestoneEvidenceTable = new Table(milestoneEvidenceTableDOM, {
        data: this.milestoneEvidenceData() || [],
        columns: evidenceColumnProperties,
        height: evidenceTableHeightStyleProp,
        scroll: true,
        onCreatedRow: (tr: HTMLTableRowElement, rowData: MilestoneEvidenceRow): void => {
          const td = tr.querySelector('.comment');
          this.reworkPackageControl.updateCommentCell(td, rowData);
        },
      });
      milestoneEvidenceTable.init();
      this.milestoneEvidenceTable = milestoneEvidenceTable;
      this.scripts.push(this.milestoneEvidenceTable);
    }
  }

  public openTab(acceptancePackageTab: string): void {
    this.targetTab = acceptancePackageTab;
  }
}
