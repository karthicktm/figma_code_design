import { Component, computed, effect, inject, input, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SharedModule } from 'src/app/shared/shared.module';
import { FilterSortConfiguration, TableType } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { DashboardRoleType } from '../dashboard-packages/dashboard-packages.component';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import { Observable, ReplaySubject } from 'rxjs';
import { GetDashboardPackagesResponse } from '../dashboard.interface';
import { ActivatedRoute } from '@angular/router';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { DashboardService } from '../dashboard.service';

@Component({
  selector: 'app-observer-packages',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './observer-packages.component.html',
  styleUrl: './observer-packages.component.less'
})
export class ObserverPackagesComponent implements OnInit {
  readonly roleType = input.required<DashboardRoleType>();
  readonly status = input.required<string>();
  readonly slaOverdue = input<boolean>();
  filterSortColumns: FilterSortConfiguration = {
    packageName: { columnName: 'Package name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    scope: { columnName: 'Scope', searchText: '', sortingIndex: 0, sortingOrder: '' },
    arrivalDate: { columnName: '1st submission date by Ericsson', searchText: '', sortingIndex: 0, sortingOrder: '' },
    multiLevelAcceptance: { columnName: 'Multi-level', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedBy: { columnName: 'Last modified by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 25;
  tableType = TableType.Compact;

  columnsProperties = [
    {
      key: 'packageName',
      title: this.filterSortColumns.packageName.columnName,
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
      key: 'multiLevelAcceptance',
      title: this.filterSortColumns.multiLevelAcceptance.columnName,
    },
    {
      key: 'lastModifiedBy',
      title: this.filterSortColumns.lastModifiedBy.columnName,
    },
    {
      key: 'lastModifiedDate',
      title: this.filterSortColumns.lastModifiedDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    },
  ];

  tableHeightStyleProp = 'calc(100vh - 420px - 60px)';
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly parentParamMap = toSignal(this.activatedRoute.parent.paramMap);
  private projectId = computed<string>(() => {
    const paramMap = this.parentParamMap();
    return paramMap.get('id');
  });
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetDashboardPackagesResponse>;

  constructor(
    private datePipe: NullStringDatePipe,
    private dashboardService: DashboardService,
  ) {
    effect(() => {
      const projectId = this.projectId();
      const roleType = this.roleType();
      const status = this.status();
      const slaOverdue = this.slaOverdue();
      if (projectId && roleType && status) {
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<GetDashboardPackagesResponse> => {
          return this.dashboardService.getDashboardPackages(projectId, roleType, status, limit, offset, slaOverdue, filterSort);
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
