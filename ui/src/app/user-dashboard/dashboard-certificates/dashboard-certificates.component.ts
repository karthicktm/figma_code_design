import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, ReplaySubject } from 'rxjs';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import { FilterSortConfiguration, TableType } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { GetDashboardCertificatesResponse } from '../dashboard.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { DashboardService } from '../dashboard.service';

@Component({
  selector: 'app-dashboard-certificates',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './dashboard-certificates.component.html',
  styleUrl: './dashboard-certificates.component.less'
})
export class DashboardCertificatesComponent implements OnInit {
  filterSortColumns: FilterSortConfiguration = {
    requestName: { columnName: 'Request name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    scope: { columnName: 'Scope', searchText: '', sortingIndex: 0, sortingOrder: '' },
    arrivalDate: { columnName: 'Arrival date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    decisionDate: { columnName: 'Signed/rejected date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    aging: { columnName: 'Aging(days)', searchText: '', sortingIndex: 0, sortingOrder: '' },
    multiLevelAcceptance: { columnName: 'Multi-level', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 25;
  tableType = TableType.Compact;

  columnsProperties = [
    {
      key: 'requestName',
      title: this.filterSortColumns.requestName.columnName,
    },
    {
      key: 'scope',
      title: this.filterSortColumns.scope.columnName,
    },
    {
      key: 'arrivalDate',
      title: this.filterSortColumns.arrivalDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    },
    {
      key: 'decisionDate',
      title: this.filterSortColumns.decisionDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    },
    {
      key: 'aging',
      title: this.filterSortColumns.aging.columnName,
    },
    {
      key: 'multiLevelAcceptance',
      title: this.filterSortColumns.multiLevelAcceptance.columnName,
    }
  ];

  tableHeightStyleProp = 'calc(100vh - 420px - 60px)';
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly parentParamMap = toSignal(this.activatedRoute.parent.paramMap);
  private projectId = computed<string>(() => {
    const paramMap = this.parentParamMap();
    return paramMap.get('id');
  });
  private readonly queryParamMap = toSignal(this.activatedRoute.queryParamMap);
  private status = computed<string>(() => {
    const queryParamMap = this.queryParamMap();
    const statusParam = queryParamMap.get('status');
    if (!statusParam) {
      console.error('Component used in unknown route configuration.');
    }
    return statusParam;
  });

  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetDashboardCertificatesResponse>;

  constructor(
    private datePipe: NullStringDatePipe,
    private dashboardService: DashboardService,
  ) {
    effect(() => {
      const projectId = this.projectId();
      const status = this.status();
      if (projectId && status) {
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<GetDashboardCertificatesResponse> => {
          return this.dashboardService.getDashboardCertificates(projectId, status, limit, offset, filterSort);
        }
      }
    });
  }

  ngOnInit(): void {
    Object.entries(this.filterSortColumns).forEach(filter => {
      const [key, value] = filter;
      if (!key.toLowerCase().includes('date')) {
        value.showFilter = new ReplaySubject(1);
        value.showFilter.next(false);
      }
    });
  }
}
