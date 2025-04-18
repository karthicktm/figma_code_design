import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, } from 'rxjs/operators';
import { FilterSortConfiguration } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { AuditElementType, AuditReportResponse } from './audit.interface';
import { AuditReportService } from './audit.service';
import TableUtils from '../projects/project/acceptance-package-details/table-utilities';
import { DialogService } from '../portal/services/dialog.service';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
})
export class AuditReportComponent implements OnInit, OnDestroy {
  private eventAbortController = new AbortController();
  columnsProperties = [
    {
      key: 'auditId',
      title: 'Audit ID',
    },
    {
      key: 'elementType',
      title: 'Audit type',
    },
    {
      key: 'oldValue',
      title: 'Old value',
    },
    {
      key: 'newValue',
      title: 'New value',
    },
    {
      key: 'createdBy',
      title: 'Created by',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
      },
    },
    {
      key: 'createdDate',
      title: 'Created date',
    }
  ];
  filterSortColumns = {
    auditId: { columnName: 'auditId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    elementType: { columnName: 'elementType', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.keys(AuditElementType).filter((v) => isNaN(Number(v))) },
    oldValue: { columnName: 'oldValue', searchText: '', sortingIndex: 0, sortingOrder: '' },
    newValue: { columnName: 'newValue', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdBy: { columnName: 'createdBy', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdDate: { columnName: 'createdDate', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };
  limit = 50;
  offset = 0;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  tableHeightStyleProp = 'calc(100vh - 290px - 32px)';
  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<AuditReportResponse>;

  constructor(
    private auditReportService: AuditReportService,
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.fetchPageHandler = (limit, offset, filterSortConfig): Observable<AuditReportResponse> => {
      let sortValue = '';
      const filterBody = {};

      if (filterSortConfig) {
        Object.keys(filterSortConfig).forEach(key => {
          if (filterSortConfig[key].sortingOrder !== '') {
            sortValue = `${filterSortConfig[key].sortingOrder}(${filterSortConfig[key].columnName})`;
          }

          if (!filterSortConfig[key].searchText || filterSortConfig[key].searchText.trim() === '') {
            return;
          }

          if (key === 'createdDate') {
            const startDate = new Date(filterSortConfig[key].searchText);
            const endDate = new Date(filterSortConfig[key].searchText);

            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);

            endDate.setHours(23);
            endDate.setMinutes(59);
            endDate.setSeconds(59);

            filterBody['minCreatedDate'] = startDate.toISOString();
            filterBody['maxCreatedDate'] = endDate.toISOString();
          } else if (key === 'elementType') {
            const enumNames = Object.keys(AuditElementType).filter((v) => isNaN(Number(v)));

            enumNames.forEach(eName => {
              if (eName.toLowerCase().includes(filterSortConfig[key].searchText.toLowerCase())) {
                filterBody['elementType'] = eName;
                return;
              }
            });
          } else {
            filterBody[key] = filterSortConfig[key].searchText;
          }
        });
      }

      return this.auditReportService.searchAudits(limit, offset, sortValue, filterBody).pipe(
        map((data: AuditReportResponse) => {
          return data;
        })
      );
    };
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
  }
}
