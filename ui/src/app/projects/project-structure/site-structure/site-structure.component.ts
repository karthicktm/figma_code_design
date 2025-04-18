import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, of, tap, catchError, exhaustMap } from 'rxjs';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { FilterSortAttr } from 'src/app/project-onboarding/project-onboarding.service';
import { ComponentService } from 'src/app/shared/component.service';
import { FilterSortConfiguration, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { ProjectStructureResponse, ProjectStructure } from '../../projects.interface';

@Component({
  selector: 'app-site-structure',
  standalone: true,
  imports: [TableServerSidePaginationComponent],
  templateUrl: './site-structure.component.html',
  styleUrl: './site-structure.component.less'
})
export class SiteStructureComponent implements OnInit, AfterViewInit {
  initialHeaderData: Observable<string[]>;
  columnsProperties: any[];

  filterSortColumns = {
    networkSiteId: { columnName: 'Site ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    networkSiteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteType: { columnName: 'Site type', searchText: '', sortingIndex: 0, sortingOrder: '', options: null },
    latitude: { columnName: 'Latitude', searchText: '', sortingIndex: 0, sortingOrder: '' },
    longitude: { columnName: 'Longitude', searchText: '', sortingIndex: 0, sortingOrder: '' },
  }

  loadingHeaderData: boolean;
  dataInitialized = false;
  limit = 50;
  offset = 0;
  tableSettingsStorageKey = 'site-structure-table-settings'
  tableLimitStorageKey = 'site-structure-page-limit'
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  tableHeightStyleProp = 'calc(100vh - 310px - 32px)';
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<ProjectStructureResponse>;
  @ViewChild(TableServerSidePaginationComponent) private tableComponent!: TableServerSidePaginationComponent;
  projectId: string;

  constructor(
    private networkRollOutService: NetworkRollOutService,
    private activeRoute: ActivatedRoute,
    private componentService: ComponentService,
  ) { }

  ngOnInit(): void {
    this.projectId = this.activeRoute.snapshot.parent.paramMap.get('id');
    this.initialRetrieveHeader();
    this.fetchPageHandler = (limit, offset, filterSortConfig): Observable<ProjectStructureResponse> => {
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
      return this.networkRollOutService.getProjectStructureShort(limit, offset, this.projectId, filterSortAttr).pipe(
        map((data: ProjectStructureResponse) => {
          const results = data.results;
          const extendProperties = results.map(data => data.extendedAttributes);
          extendProperties.forEach((attr, i) => {
            attr.forEach((element) => {
              const columnKey = element.attributeName;
              results[i][columnKey] = element.attributeValue;
            });
          })
          return { ...data, results };
        })
      );
    }
  }

  ngAfterViewInit(): void {
    this.initialHeaderData.subscribe((neHeaders: Object) => {
      this.loadingHeaderData = false;
      this.columnsProperties = [
        {
          key: 'networkSiteName',
          title: this.filterSortColumns.networkSiteName.columnName,
          onCreatedCell: (td: HTMLTableCellElement, cellData: string, index: number): void => {
            const linkHostElement = document.createElement('ng-container');
            linkHostElement.classList.add('site-name');
            td.replaceChildren(linkHostElement);
            const rowData = this.tableComponent.table.data.at(index) as ProjectStructure;
            this.componentService.createRouterLink({ text: rowData.networkSiteName, link: ['/projects', this.projectId, 'project-structure', rowData.internalId] }, linkHostElement);
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
          key: 'latitude',
          title: this.filterSortColumns.latitude.columnName,
        },
        {
          key: 'longitude',
          title: this.filterSortColumns.longitude.columnName,
        }
      ];

      this.filterSortColumns.siteType = {
        ...this.filterSortColumns.siteType,
        options: neHeaders['siteTypes'] ? neHeaders['siteTypes'].split(',') : null
      };
      const extendedAttributeNames = neHeaders['headers'] ? [...new Set(neHeaders['headers'].split(','))] : [];

      extendedAttributeNames.forEach((attributeName, index) => {
        const tableColumn = {
          key: attributeName,
          title: attributeName,
        };
        this.columnsProperties.push(tableColumn);
      });
      this.dataInitialized = true;
    });
  }

  private initialRetrieveHeader(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loadingHeaderData = true;
      })
    );
    const initialData = this.networkRollOutService.getProjectStructureHeader(this.projectId)
      .pipe(
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
