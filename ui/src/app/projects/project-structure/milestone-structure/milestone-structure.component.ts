import { Component, OnInit, signal, viewChild } from '@angular/core';
import { FilterSortConfiguration, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { MilestoneData, MilestoneResponse, NetworkElementType } from '../../projects.interface';
import { catchError, exhaustMap, Observable, of, tap } from 'rxjs';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { ComponentService } from 'src/app/shared/component.service';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { ColumnsProps } from '@eds/vanilla/table/Table';
import TableUtils from '../../project/acceptance-package-details/table-utilities';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';

type ColumnConfigOfMilestoneData = {
  [K in keyof MilestoneData]?: FilterSortConfiguration['entry'];
};

@Component({
  selector: 'app-milestone-structure',
  standalone: true,
  imports: [TableServerSidePaginationComponent],
  templateUrl: './milestone-structure.component.html',
  styleUrl: './milestone-structure.component.less',
})
export class MilestoneStructureComponent implements OnInit {
  private readonly tableComponent = viewChild.required(TableServerSidePaginationComponent);

  loadingHeaderData = signal(false);
  dataInitialized = signal(false);
  initialHeaderData: Observable<any>;

  filterSortColumns: ColumnConfigOfMilestoneData = {
    name: { columnName: 'Milestone Name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    networkSiteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteType: { columnName: 'Site type', searchText: '', sortingIndex: 0, sortingOrder: '', options: null },
    workPlanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    dateOfReadiness: { columnName: 'Released date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    networkElementType: { columnName: 'Network element type', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.values(NetworkElementType) },
    networkElementName: { columnName: 'Network element name', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  limit = 50;
  offset = 0;
  tableSettingsStorageKey = 'milestone-structure-table-settings'
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  tableLimitStorageKey = 'milestone-structure-page-limit'
  tableHeightStyleProp = 'calc(100vh - 310px - 32px)';
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<MilestoneResponse>;
  columnsProperties: (ColumnsProps & { key: keyof MilestoneData, onCreatedCell?: (td: HTMLTableCellElement, cellData: unknown, index: number) => void })[]
  private projectId: string;

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private networkRollOutService: NetworkRollOutService,
    private datePipe: NullStringDatePipe,
    private componentService: ComponentService,
  ) { }

  ngOnInit(): void {
    this.projectId = this.activeRoute.snapshot.parent.paramMap.get('id');
    this.initialRetrieveHeader();
    this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<MilestoneResponse> => {
      const filterSortPostData: FilterSortConfiguration = { ...filterSort };
      if (filterSortPostData.networkElementType.searchText != '') {
        filterSortPostData.networkElementType.searchText = Object.keys(NetworkElementType).find(key => NetworkElementType[key] === filterSortPostData.networkElementType.searchText);
      }
      return this.networkRollOutService.getMilestonesByProjectId(this.projectId, limit, offset, filterSortPostData);
    }
    this.initialHeaderData.subscribe((headers: Object) => {
      this.loadingHeaderData.set(false);
      this.columnsProperties = [
        {
          key: 'name',
          title: this.filterSortColumns.name.columnName,
          onCreatedCell: (td: HTMLTableCellElement, _: string, index: number): void => {
            const linkHostElement = document.createElement('ng-container');
            td.replaceChildren(linkHostElement);
            const rowData = this.tableComponent().table.data.at(index) as MilestoneData;
            const urlTree: UrlTree = this.router.parseUrl(`/projects/${this.projectId}/project-structure/${rowData.siteId}/milestone/${rowData.internalId}?milestoneId=${rowData.internalId}`);
            this.componentService.createRouterLink({ text: rowData.name, link: urlTree }, linkHostElement);
          },
        },
        {
          key: 'networkSiteName',
          title: this.filterSortColumns.networkSiteName.columnName,
        },
        {
          key: 'siteIdByCustomer',
          title: this.filterSortColumns.siteIdByCustomer.columnName,
        },
        {
          key: 'siteNameByCustomer',
          title: this.filterSortColumns.siteNameByCustomer.columnName,
        },
        {
          key: 'siteType',
          title: this.filterSortColumns.siteType.columnName,
        },
        {
          key: 'workPlanName',
          title: this.filterSortColumns.workPlanName.columnName,
        },
        {
          key: 'dateOfReadiness',
          title: this.filterSortColumns.dateOfReadiness.columnName,
          onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
            TableUtils.formatDateCell(this.datePipe, cellData, td);
          },
        },
        {
          key: 'networkElementType',
          title: this.filterSortColumns.networkElementType.columnName,
          onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
            td.textContent = NetworkElementType[cellData] || cellData;
          },
        },
        {
          key: 'networkElementName',
          title: this.filterSortColumns.networkElementName.columnName,
        },
      ];

      this.filterSortColumns.siteType = {
        ...this.filterSortColumns.siteType,
        options: headers['siteTypes'] ? headers['siteTypes'].split(',') : null
      };

      this.dataInitialized.set(true);
    });
  }

  private initialRetrieveHeader(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loadingHeaderData.set(true);
      })
    );
    const initialData = this.networkRollOutService.getProjectStructureHeader(this.projectId)
      .pipe(
        catchError((err) => {
          this.loadingHeaderData.set(false);
          return undefined;
        }),
      );
    this.initialHeaderData = loadingStartFlagging.pipe(
      exhaustMap(() => initialData),
    );
  }
}
