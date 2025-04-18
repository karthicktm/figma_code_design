import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, input } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { ColumnsProps, Table } from '@eds/vanilla/table/Table';
import { WorkPlanDetails } from 'src/app/projects/projects.interface';
import { TableOptions } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { WorkPlanDialogComponent } from './work-plan-dialog/work-plan-dialog.component';
import { DialogService } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-certificate-work-plan-list',
  standalone: true,
  imports: [],
  templateUrl: './certificate-work-plan-list.component.html',
  styleUrl: './certificate-work-plan-list.component.less'
})
export class CertificateWorkPlanListComponent implements OnInit, AfterViewInit, OnDestroy {
  workPlans = input.required<WorkPlanDetails[]>();
  projectId = input.required<string>();
  @ViewChild('table') readonly tableElementRef: ElementRef<HTMLElement>;

  private filterSortColumns = {
    name: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer Scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site id by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  private columnsProperties: (ColumnsProps & { onCreatedCell?: (td: HTMLTableCellElement, cellData: unknown) => void })[] = [
    {
      key: 'name',
      title: this.filterSortColumns.name.columnName,
      cellClass: 'name-cell',
    },
    {
      key: 'customerScopeId',
      title: this.filterSortColumns.customerScopeId.columnName,
      onCreatedCell:(td, cellData: string): void => {
        if (cellData?.length === 0) {          
          td.replaceChildren(document.createTextNode('-'));
          td.style.display = 'flex';
          td.style.justifyContent = 'center';
          td.style.alignItems = 'center';
        }
      },
    },
    {
      key: 'siteNameByCustomer',
      title: this.filterSortColumns.siteNameByCustomer.columnName,
    },
    {
      key: 'siteIdByCustomer',
      title: this.filterSortColumns.siteIdByCustomer.columnName,
    },
  ];

  private tableHeightStyleProp = 'calc(100vh - 273px)';

  private tableOptions: TableOptions = {
    onCreatedRow: (tr: HTMLTableRowElement, rowData: WorkPlanDetails): void => {
      const link = document.createElement('a');
      link.textContent = rowData.name;
      link.addEventListener('click', (event) => {
        this.openWorkPlanDialog(rowData);
      }, { signal: this.abortController.signal });
      const td = tr.querySelector('.name-cell');
      td.replaceChildren(link);
    },
  };

  private abortController: AbortController = new AbortController();
  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.subscription.add(this.route.paramMap.subscribe((params: ParamMap) => {
      const projectId = this.projectId();
    }));
  }

  ngAfterViewInit(): void {
    const tableDOM = this.tableElementRef.nativeElement as HTMLElement;
    if (tableDOM) {
      const tableOptions = {
        ...{
          data: this.workPlans() || [],
          columns: this.columnsProperties,
          height: this.tableHeightStyleProp,
          scroll: true,
        },
        ...this.tableOptions,
      }
      const table = new Table(tableDOM, tableOptions);
      table.init();
      this.scripts.push(table);
    }
  }

  ngOnDestroy(): void {
    this.abortController.abort();
    this.subscription.unsubscribe();
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  private openWorkPlanDialog(rowData: WorkPlanDetails): void {
    const data = {
      workPlan: rowData,
      projectId: this.projectId(),
    }
    this.dialogService.createDialog(WorkPlanDialogComponent, data);
  }
}
