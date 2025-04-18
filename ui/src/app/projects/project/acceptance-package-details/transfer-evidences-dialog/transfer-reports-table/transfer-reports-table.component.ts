import { Component, effect, ElementRef, input, output, viewChild, OnDestroy } from '@angular/core';
import { Table } from '@eds/vanilla';
import { TransferPackageReportType } from 'src/app/projects/projects.interface';

interface ReportEntry {
  name: string;
  type: TransferPackageReportType;
  selected: boolean;
}

@Component({
  selector: 'app-transfer-reports-table',
  standalone: true,
  imports: [],
  templateUrl: './transfer-reports-table.component.html',
  styleUrl: './transfer-reports-table.component.less'
})
export class TransferReportsTableComponent implements OnDestroy {
  protected readonly name = input<string>();
  protected readonly onSelect = output<TransferPackageReportType[]>();
  private readonly scripts: Scripts[] = [];
  private readonly eventAbortController = new AbortController();
  private readonly tableDOMRef = viewChild.required<ElementRef<HTMLTableElement>>('table');
  private table: Table;
  private readonly columnsProperties = [
    {
      key: 'name',
      title: 'File name',
    },
  ];
  private tableHeightStyleProp = 'calc(100vh - 500px + 54px)';

  constructor() {
    effect(() => {
      const tableDOM = this.tableDOMRef()?.nativeElement;
      const defaultEntry: Pick<ReportEntry, 'selected'> = {
        selected: false,
      };
      const entries: ReportEntry[] = [
        {
          ...defaultEntry,
          name: 'Full evidence report - HTML',
          type: TransferPackageReportType.FullEvidenceReportHtml,
        },
        {
          ...defaultEntry,
          name: 'Full evidence report - PDF',
          type: TransferPackageReportType.FullEvidenceReportPdf,
        },
        {
          ...defaultEntry,
          name: 'Approved evidence report - HTML',
          type: TransferPackageReportType.ApprovedEvidenceReportHtml,
        },
        {
          ...defaultEntry,
          name: 'Approved evidence report - PDF',
          type: TransferPackageReportType.ApprovedEvidenceReportPdf,
        }
      ];

      if (tableDOM) {
        const table = new Table(tableDOM, {
          data: entries,
          columns: this.columnsProperties,
          height: this.tableHeightStyleProp,
          selectable: 'multi',
        });

        table.init();
        this.scripts.push(table);

        this.table = table;
        tableDOM.addEventListener('toggleSelectRow', (event: CustomEvent): void => {
          this.updateSelection();
        }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);

        this.updateSelection();
      }
    }, {
      allowSignalWrites: true,
    });
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    this.eventAbortController.abort();
  }

  private updateSelection(): void {
    const selectedReportTypes = this.table.selected?.map((entry: ReportEntry) => entry.type);
    this.onSelect.emit(selectedReportTypes || []);
  }
}
