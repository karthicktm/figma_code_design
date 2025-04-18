import { Component, OnInit, viewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterSortConfiguration, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { ProjectsService } from '../../projects.service';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { NetworkElementType, WorkplanSiteData, WorkplanSiteResponse } from '../../projects.interface';
import { ComponentService } from 'src/app/shared/component.service';
import { ColumnsProps } from '@eds/vanilla/table/Table';

type ColumnConfigOfWorkplanSiteData = {
  [K in keyof WorkplanSiteData]?: FilterSortConfiguration['entry'];
};

@Component({
  selector: 'app-workplan-structure',
  standalone: true,
  imports: [TableServerSidePaginationComponent],
  templateUrl: './workplan-structure.component.html',
  styleUrl: './workplan-structure.component.less'
})
export class WorkplanStructureComponent implements OnInit {
  private readonly tableComponent = viewChild.required(TableServerSidePaginationComponent);

  filterSortColumns: ColumnConfigOfWorkplanSiteData = {
    workplanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: 'asc' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanType: { columnName: 'Workplan type', searchText: '', sortingIndex: 0, sortingOrder: '', options: null },
    category: { columnName: 'Category', searchText: '', sortingIndex: 0, sortingOrder: '' },
    fasId: { columnName: 'FAS ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    networkElementType: { columnName: 'Network element type', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.values(NetworkElementType) },
    networkElementName: { columnName: 'Network element name', searchText: '', sortingIndex: 0, sortingOrder: '' },
  }

  columnsProperties: (ColumnsProps & { key: keyof WorkplanSiteData, onCreatedCell?: (td: HTMLTableCellElement, cellData: unknown, index: number) => void })[] = [
    {
      key: 'workplanName',
      title: this.filterSortColumns.workplanName.columnName,
      onCreatedCell: (td, _: string, index): void => {
        const linkHostElement = document.createElement('ng-container');
        td.replaceChildren(linkHostElement);
        const rowData = this.tableComponent().table.data.at(index) as WorkplanSiteData;
        const urlTree: UrlTree = this.router.parseUrl(`/projects/${this.projectId}/project-structure/${rowData.siteId}/workplan/${rowData.workplanId}?workplanId=${rowData.workplanId}`);
        this.componentService.createRouterLink({ text: rowData.workplanName, link: urlTree }, linkHostElement);
      },
    },
    {
      key: 'siteName',
      title: this.filterSortColumns.siteName.columnName,
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
      key: 'customerScopeId',
      title: this.filterSortColumns.customerScopeId.columnName,
    },
    {
      key: 'workplanType',
      title: this.filterSortColumns.workplanType.columnName,
    },
    {
      key: 'category',
      title: this.filterSortColumns.category.columnName,
    },
    {
      key: 'fasId',
      title: this.filterSortColumns.fasId.columnName,
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

  limit = 50;
  offset = 0;
  tableSettingsStorageKey = 'workplan-structure-table-settings'
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  tableLimitStorageKey = 'workplan-structure-page-limit'
  tableHeightStyleProp = 'calc(100vh - 310px - 32px)';
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<WorkplanSiteResponse>;
  private projectId: string;

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private componentService: ComponentService,
  ) { }

  ngOnInit(): void {
    this.projectId = this.activeRoute.snapshot.parent.paramMap.get('id');
    this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<WorkplanSiteResponse> => {
      const filterSortPostData: FilterSortConfiguration = { ...filterSort };
      if (filterSortPostData.networkElementType.searchText != '') {
        filterSortPostData.networkElementType.searchText = Object.keys(NetworkElementType).find(key => NetworkElementType[key] === filterSortPostData.networkElementType.searchText);
      }
      return this.projectsService.getWorkplansWithSite(this.projectId, limit, offset, filterSortPostData);
    }
  }
}
