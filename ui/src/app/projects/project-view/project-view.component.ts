import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { catchError, exhaustMap, Observable, of, tap } from 'rxjs';
import { ComponentService } from 'src/app/shared/component.service';
import { FilterSortConfiguration, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { NetworkElementType, ProjectSite, ProjectSitesResponse } from '../projects.interface';
import { ProjectsService } from '../projects.service';
import { FilterSortAttr, NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';

type ColumnConfigOfProjectStructureData = {
  [K in keyof ProjectSite]?: FilterSortConfiguration['entry'];
};
@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    AsyncPipe,
    TableServerSidePaginationComponent,
  ],
  templateUrl: './project-view.component.html',
  styleUrl: './project-view.component.less'
})
export class ProjectViewComponent implements OnInit {
  initialHeaderData: Observable<string[]>;

  filterSortColumns: ColumnConfigOfProjectStructureData = {
    internalId: { columnName: 'Site ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteType: { columnName: 'Site type', searchText: '', sortingIndex: 0, sortingOrder: '' },
    networkElementType: { columnName: 'Network element type', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.values(NetworkElementType) },
    networkElementName: { columnName: 'Network element name', searchText: '', sortingIndex: 0, sortingOrder: '' },
  }
  columnsProperties: any[];

  loadingHeaderData: boolean;
  dataInitialized = false;
  limit = 50;
  offset = 0;
  tableSettingsStorageKey = 'project-view-site-structure-table-settings'
  tableLimitStorageKey = 'project-view-site-structure-page-limit'
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  tableHeightStyleProp = 'calc(100vh - 310px)';
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<ProjectSitesResponse>;
  @ViewChild(TableServerSidePaginationComponent) private tableComponent!: TableServerSidePaginationComponent;
  projectId: string;

  constructor(
    private projectsService: ProjectsService,
    private networkRollOutService: NetworkRollOutService,
    private activeRoute: ActivatedRoute,
    private componentService: ComponentService,
  ) { }

  ngOnInit(): void {
    this.projectId = this.activeRoute.snapshot.parent.paramMap.get('id');
    this.initialRetrieveHeader();
    this.fetchPageHandler = (limit, offset, filterSortConfig): Observable<ProjectSitesResponse> => {
      const filterSortAttr: FilterSortAttr[] = [];
      Object.keys(filterSortConfig).forEach(filterKey => {
        if (filterSortConfig[filterKey].searchText !== '') {
          filterSortAttr.push({
            key: filterKey,
            value: filterSortConfig[filterKey].searchText
          });
        }
        if (filterSortConfig[filterKey].sortingOrder !== '') {
          const sortAttr = {
            key: 'sort',
            value: `${filterSortConfig[filterKey].sortingOrder}(${filterKey})`
          };
          filterSortAttr.push(sortAttr);
        }
      });
      return this.projectsService.getSitesByProject(limit, offset, this.projectId, filterSortAttr).pipe(

      );
    }
  }

  private initialRetrieveHeader(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loadingHeaderData = true;
      })
    );
    const initialData = this.networkRollOutService.getProjectStructureHeader(this.projectId)
      .pipe(
        tap((neHeaders: Object) => {
          this.loadingHeaderData = false;
          this.columnsProperties = [
            {
              key: 'siteName',
              title: this.filterSortColumns.siteName.columnName,
              onCreatedCell: (td: HTMLTableCellElement, cellData: string, index: number): void => {
                const linkHostElement = document.createElement('ng-container');
                linkHostElement.classList.add('site-name');
                td.replaceChildren(linkHostElement);
                const rowData = this.tableComponent.table.data.at(index) as ProjectSite;
                this.componentService.createRouterLink({ text: rowData.siteName, link: ['/projects', this.projectId, 'project-view', rowData.internalId] }, linkHostElement);
              },
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
              key: 'networkElementType',
              title: this.filterSortColumns.networkElementType.columnName,
            },
            {
              key: 'networkElementName',
              title: this.filterSortColumns.networkElementName.columnName,
            }
          ];

          this.filterSortColumns.siteType = {
            ...this.filterSortColumns.siteType,
            options: neHeaders['siteTypes'] ? neHeaders['siteTypes'].split(',') : null
          };

          this.dataInitialized = true;
        }),
        catchError((err) => {
          this.loadingHeaderData = false;
          return [];
        }),
      );
    this.initialHeaderData = loadingStartFlagging.pipe(
      exhaustMap(() => initialData),
    );
  }
}
