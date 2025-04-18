import { Component, effect, ElementRef, input, OnDestroy, output, signal, viewChild } from '@angular/core';
import { Pagination, Table } from '@eds/vanilla';
import { catchError, of, Subscription } from 'rxjs';
import { EvidenceEntry, EvidenceType, PageInfo } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import TableUtils from '../../table-utilities';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CommonModule } from '@angular/common';
import { updateNoDataRowInTable } from 'src/app/shared/table-utilities';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';

@Component({
  selector: 'app-transfer-evidences-table',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './transfer-evidences-table.component.html',
  styleUrl: './transfer-evidences-table.component.less'
})
export class TransferEvidencesTableComponent implements OnDestroy {
  readonly tableElementRef = viewChild.required<ElementRef<HTMLElement>>('table');

  readonly packageId = input<string>();
  readonly name = input<string>();
  readonly type = input<EvidenceType[]>();
  readonly onSelect = output<string[]>();

  private subscription: Subscription = new Subscription();
  private scripts: Scripts[] = [];
  private eventAbortController = new AbortController();

  private table: Table;
  private pagination: Pagination;
  tableElements: EvidenceEntry[] = [];
  selectedEvidences: string[] = [];

  loadingTableData = signal(false);

  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 10;
  offset: number = 0;
  totalRecords: number;

  private columnsProperties = [
    {
      key: 'name',
      title: 'File name',
    },
    {
      key: 'status',
      title: 'Status',
      cellClass: 'cell-nowrap',
      onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
        td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData, { big: true }));
      }
    },
    {
      key: 'size',
      title: 'File size',
    },
  ];

  private tableHeightStyleProp = 'calc(100vh - 500px)';

  constructor(
    private projectService: ProjectsService,
    private notificationService: NotificationService,
  ) {
    effect(() => {
      if (!this.table) {
        const tableDOM = this.tableElementRef().nativeElement;
        if (tableDOM) {
          const table = new Table(tableDOM, {
            data: this.tableElements || [],
            columns: this.columnsProperties,
            height: this.tableHeightStyleProp,
            selectable: 'multi',
            onCreatedHead: (thead: HTMLTableCellElement): void => {
              thead.querySelectorAll('tr:first-child th').forEach((th: HTMLTableCellElement) => {
                if (th.classList.contains('cell-select')) {
                  const dropdown = th.querySelector('.dropdown');
                  dropdown?.remove();
                }
              });
            },
            onCreatedRow: (tr: HTMLTableRowElement, rowData: EvidenceEntry): void => {
              rowData.selected = this.selectedEvidences.indexOf(rowData.internalId) > -1;

              const checkbox = tr.querySelector('input[type="checkbox"]') as HTMLInputElement;
              checkbox.checked = rowData.selected;
            },
          });

          table.init();
          TableUtils.overwriteEDSTableFeatureTableInfo(table, this);
          this.pagination = table['pagination'];
          if (this.pagination) {
            const paginationDom = this.pagination['dom'].paginationGroup;
            this.pagination.update(this.totalRecords);
            paginationDom.addEventListener('paginationChangePage', this.paginationChange, false);
            paginationDom.addEventListener('paginationChangeSelect', this.paginationChange, false);
          }
          table['pagination'] = undefined;
          this.table = table;
          this.fetchData();
          this.scripts.push(this.table);
          this.scripts.push(this.pagination);

          tableDOM.addEventListener('selectRow', (event: CustomEvent): void => {
            event.detail.data.selected = true;
            this.updateEvidenceSelection(event.detail.data);
          }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);

          tableDOM.addEventListener('unselectRow', (event: CustomEvent): void => {
            event.detail.data.selected = false;
            this.updateEvidenceSelection(event.detail.data);
          }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
        }
      }
    },
      {
        allowSignalWrites: true
      });
  }

  paginationChange = (event): void => {
    const setOffsetLimit = {
      offset: (event.detail.state.currentPage * event.detail.state.numPerPage) - event.detail.state.numPerPage,
      limit: event.detail.state.numPerPage,
    };
    if (this.limit !== setOffsetLimit.limit || this.offset !== setOffsetLimit.offset) {
      this.limit = setOffsetLimit.limit;
      this.offset = setOffsetLimit.offset;
      this.fetchData();
    }
  };

  ngOnDestroy(): void {
    this.subscription.unsubscribe();

    this.scripts.forEach((script) => {
      script.destroy();
    });

    this.eventAbortController.abort();
  }

  fetchData(): void {
    this.loadingTableData.set(true);
    if (this.table) updateNoDataRowInTable(this.table, 'Loading...');
    this.subscription.add(this.projectService.getPackageAllEvidences(this.packageId(), this.limit, this.offset, this.type().join()).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(error);
        this.loadingTableData.set(false);
        updateNoDataRowInTable(this.table, 'No data found.');
        const statusMessage = 'Error when retrieving the evidences!';
        if (error.status === HttpStatusCode.BadGateway || error.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification(
            {
              title: statusMessage,
              description:
                'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
            },
            true
          );
        } else {
          this.notificationService.showNotification(
            {
              title: statusMessage,
              description:
                'Please follow the FAQ doc for further steps.',
            },
            true
          );
        }
        return of([]);
      })
    ).subscribe((page: PageInfo & { results: EvidenceEntry[] }) => {
      this.totalRecords = page.totalRecords;
      this.tableElements = page.results;
      if (this.table) this.table.update(this.tableElements);
      if (this.pagination) this.pagination.update(this.totalRecords);
      this.loadingTableData.set(false);
      if (page.totalRecords === 0) {
        updateNoDataRowInTable(this.table, 'No data found.');
      }
    }));
  }

  private updateEvidenceSelection(data: EvidenceEntry): void {
    const selected = data.selected;
    const internalId = data.internalId;

    // if selected and not already in the array, add it
    if (selected && !this.selectedEvidences.includes(internalId)) {
      this.selectedEvidences.push(internalId);
    }

    // if not selected and in the array, remove it
    const index = this.selectedEvidences.indexOf(internalId);
    if (!selected && index > -1) {
      this.selectedEvidences.splice(index, 1);
    }

    this.onSelect.emit(Array.from(this.selectedEvidences));
  }
}
