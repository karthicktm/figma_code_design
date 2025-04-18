import { HttpErrorResponse, HttpEventType, HttpStatusCode } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, effect, input, signal } from '@angular/core';
import { Subscription, catchError, tap, throwError } from 'rxjs';
import { Table } from '@eds/vanilla';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import CertificateUtils from '../../certificate-utilities';
import { Certificate, CertificateRequestStatus } from 'src/app/projects/projects.interface';
import TableUtils from '../../../acceptance-package-details/table-utilities';
import { checkValueLength, updateNoDataRowInTable } from 'src/app/shared/table-utilities';
import { certificateStatusDataModelToViewModel } from '../../../status-mapping';
import { KeyValuePipe } from '@angular/common';

const defaultStatus = 'Certified';
@Component({
  selector: 'app-work-plan-certificate-requests',
  standalone: true,
  imports: [KeyValuePipe],
  templateUrl: './work-plan-certificate-requests.component.html',
  styleUrl: './work-plan-certificate-requests.component.less'
})
export class WorkPlanCertificateRequestsComponent implements OnInit, AfterViewInit, OnDestroy {
  projectId = input.required<string>();
  workPlanId = input.required<string>();
  @ViewChild('table') readonly tableElementRef: ElementRef<HTMLElement>;
  loadingTableData = signal(false);
  private tableElements: Pick<Certificate, 'certificateScope' | 'requestName' | 'status' | 'dateOfCertification' | 'signedBy'>[] = [];
  private table = signal<Table>(undefined);
  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();
  private abortController = new AbortController();
  statusMapCertificate = certificateStatusDataModelToViewModel;
  filterSortColumns = {
    requestName: { columnName: 'Request name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    certificateScope: { columnName: 'Scope', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: { columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '' },
    signedBy: { columnName: 'Signed by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    dateOfCertification: { columnName: 'Date of certification', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  private statusDropDownOptions = [];
  isFilter = false;
  private filterArray = [];

  constructor(
    private datePipe: NullStringDatePipe,
    private projectService: ProjectsService,
    private notificationService: NotificationService,
  ) {
    effect(() => {
      if (this.table() !== undefined) {
        if (this.loadingTableData()) updateNoDataRowInTable(this.table(), 'Loading...');
        if (!this.loadingTableData()) updateNoDataRowInTable(this.table(), 'No data found.');
      }
    });
  }

  ngOnInit(): void {
    try {
      this.loadingTableData.set(true);
      const getCertificateRequestsForWorkPlan = this.projectService.getCertificateRequestsForWorkPlan({
        projectId: this.projectId(),
        workPlanId: this.workPlanId(),
      }).pipe(
        tap((data: Certificate[]) => {
          this.tableElements = data.filter((elem) => elem.status !== CertificateRequestStatus.ready).map(obj => obj.status === CertificateRequestStatus.complete ? { ...obj, status: CertificateRequestStatus.certified } : obj);
          this.loadingTableData.set(false);
          if (this.table) this.refreshTableData();
          TableUtils.addStatusFilterForEDSTable(this.table(), defaultStatus);
        }),
        catchError((error: HttpErrorResponse) => {
          this.loadingTableData.set(false);
          let errorMessage = '';
          if (error.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // server-side error
            errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
            if (
              error.status === HttpStatusCode.BadGateway ||
              error.status === HttpStatusCode.ServiceUnavailable ||
              !navigator.onLine
            ) {
              // keep old data received from server, no op
            } else {
            }
          }
          return throwError(() => {
            return errorMessage;
          });
        })
      );
      this.subscription.add(getCertificateRequestsForWorkPlan.subscribe());
    } catch (err) {
      this.loadingTableData.set(false);
    }
  } 

  ngAfterViewInit(): void {
    const columnsProperties = [
      {
        key: 'requestName',
        title: this.filterSortColumns.requestName.columnName,
      },
      {
        key: 'certificateScope',
        title: this.filterSortColumns.certificateScope.columnName,
        sort: 'none',
        onCreatedCell: TableUtils.formatCellContentWithoutCellDataDoubleDash
      },
      {
        key: 'status',
        title: this.filterSortColumns.status.columnName,
        sort: 'none',
        cellStyle: 'white-space: nowrap',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          td.replaceChildren(CertificateUtils.getStatusTag(cellData, { big: true }));
        },
      },
      {
        key: 'signedBy',
        title: this.filterSortColumns.signedBy.columnName,
        sort: 'none',
        onCreatedCell: TableUtils.formatCellContentWithoutCellDataDoubleDash
      },
      {
        key: 'dateOfCertification',
        title: this.filterSortColumns.dateOfCertification.columnName,
        sort: 'none',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
        },
      },
    ];

    const tableHeightStyleProp = 'calc(100vh - 380px)';
    const groupUserTableDOM = this.tableElementRef.nativeElement as HTMLElement;
    if (groupUserTableDOM) {
      const table = new Table(groupUserTableDOM, {
        data: this.tableElements || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        scroll: true,
        actions: true,
        onCreatedActionsCell: (td: HTMLTableCellElement, rowData: Certificate): void => {
          if (rowData.status === CertificateRequestStatus.complete || rowData.status === CertificateRequestStatus.certified) {
            const downloadButton = document.createElement('button');
            downloadButton.classList.add('btn-icon');
            downloadButton.title = 'Download certificate';
            const downloadIcon = document.createElement('i');
            downloadIcon.classList.add('icon', 'icon-download-save', 'ml-bs');
            downloadButton.appendChild(downloadIcon);
            downloadButton.addEventListener('click', (event) => {
              this.onDownloadCertificate({ projectId: this.projectId(), certificate: rowData }, downloadButton);
            }, { signal: this.abortController.signal });
            td.appendChild(downloadButton);
          }
        },
        beforeCreatedBody: (): void => {
          const attrKey = 'data-key';
          table?.dom.table
            .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
            .forEach(cell => {
              const input = cell?.firstChild;
              const filterInputMarkerClass = 'filter-marker-certificate';
              if (input && !cell.classList.contains(filterInputMarkerClass)) {
                const attribute = cell.getAttribute(attrKey);
                if (attribute === 'status') {
                  const newInputElement = input as HTMLInputElement;
                  newInputElement.type = 'search';
                  newInputElement.setAttribute('list', 'table-filter-input-datalist-certificate-status');
                  const dataList = document.createElement('datalist');
                  dataList.setAttribute('id', 'table-filter-input-datalist-certificate-status');

                  this.statusDropDownOptions = [...this.statusMapCertificate.keys()];
                  this.statusDropDownOptions.filter((item, pos, self) => {
                    return self.indexOf(item) === pos;
                  }).forEach(opt => {
                    const option = document.createElement('option');
                    option.setAttribute('value', opt);
                    dataList.appendChild(option);
                  });

                  newInputElement.parentElement.appendChild(dataList);
                  newInputElement.addEventListener('keyup', (event) => {
                    const currVal = newInputElement.value;
                    let found = false;

                    for (let i = 0; i < this.statusDropDownOptions.length; i++) {
                      if (this.statusDropDownOptions[i].toLowerCase().includes(currVal.toLowerCase())) {
                        found = true;
                        break;
                      }
                    }

                    if (!found) {
                      newInputElement.value = '';
                    }
                  }, {});
                }
                input?.addEventListener(
                  'change',
                  (event: KeyboardEvent | CustomEvent) => {
                    const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                    const attributeValue = inputTarget.value || event.detail;
                    if (!checkValueLength(attributeValue, {}, this.notificationService)) {
                      return;
                    }

                    this.filterSortColumns[attribute].searchText = attributeValue;

                    Object.keys(this.filterSortColumns).forEach(filterKey => {
                      if (this.filterSortColumns[filterKey].searchText != '') {
                        this.isFilter = true;
                      }
                    });
                    this.loadCertificatesRequestsForWorkPlans();
                  },
                  {}
                );
                //}
                cell.classList.add(filterInputMarkerClass);
                if (!Object.keys(this.filterSortColumns).includes(cell?.getAttribute(attrKey)) && input) {
                  // No filtering if column is not specified in filterSortColumns
                  input.remove();
                  cell.removeAttribute(attrKey);
                }
              }
            });
          // Overwrite EDS table onChangedFilter to remove default filter behavior.
          // The signature of the assigned function must match with the original signature.
          if (table?.onChangedFilter) {
            table.onChangedFilter = (a: any, b: any): void => {
              /* do nothing */
            };
          }
        },
      });
      table.init();
      this.table.set(table);
      this.scripts.push(table);
    }
  }

  public loadCertificatesRequestsForWorkPlans(): void {
    this.isFilter = false;
    this.filterArray = [];
    Object.keys(this.filterSortColumns).forEach(filterKey => {
      if (this.filterSortColumns[filterKey].searchText != '') {
        this.isFilter = true;
      }
    });
    if (this.isFilter === false) {
      this.refreshTableData();
      return;
    }
    const searchedColumns = Object.entries(this.filterSortColumns).reduce((result, [key, value]) => {
      if (value.searchText !== '') {
        result[key] = value.searchText;
      }
      return result;
    }, {});
    this.filterArray = this.tableElements.filter((item) => {
      let flag;
      for (const key in searchedColumns) {
        // If item[key] doesn't contain this key search text then set flag false
        if (item[key]) {
          if (key === 'status') {
            const getStatus = this.statusMapCertificate.get(searchedColumns[key]);
            flag = getStatus.toUpperCase().indexOf(item[key].toUpperCase()) > -1;
          } else {
            flag = item[key].toUpperCase().indexOf(searchedColumns[key].toUpperCase()) > -1;
          }
        }
        else if (!item[key] && searchedColumns[key]) {
          flag = false;
        }
        if (flag === false) {
          break;
        }
      }
      if (flag === true) {
        return item;
      }
    });
    if (this.filterArray.length > 0) {
      this.table().update(this.filterArray);
    }
    else {
      this.table().update([]);
    }
  }

  public clearSelectedFilter(currentFilter: string): void {
    this.filterSortColumns[currentFilter].searchText = '';
    this.loadCertificatesRequestsForWorkPlans();
    const attrKey = 'data-key';
    this.table()?.dom.table
      .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach(filterCell => {
        if (currentFilter === filterCell.getAttribute(attrKey)) {
          filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
        }
      });
  }

  public clearAllFilters(): void {
    this.filterArray = [];
    this.refreshTableData();
    this.isFilter = false;
    Object.keys(this.filterSortColumns).forEach(filterKey => {
      this.filterSortColumns[filterKey].searchText = '';
    });
    const attrKey = 'data-key';
    this.table()?.dom.table
      .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach(filterCell => {
        filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
      });
  }

  private refreshTableData(): void {
    this.table().update(this.tableElements);
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.abortController.abort();
  }

  private onDownloadCertificate(identifier: { projectId: string, certificate: Certificate }, targetElement: HTMLButtonElement): void {
    const downloadObservable = this.projectService.downloadCertificate(identifier.projectId, identifier.certificate.certificateRequestId).pipe(
      tap(result => {
        targetElement.disabled = true;
        if (result.type === HttpEventType.Response) {
          targetElement.disabled = false;
          const contentDisposition = result.headers.get('content-disposition');
          // retrieve the file name and remove potential quotes from it
          const filename = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replace('"','') // replacing one " character
            .replace('"',''); // replacing second " character
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename || `certificate-${identifier.certificate.requestName}.pdf`;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showLogNotification({
            title: 'Certificate successfully downloaded!',
             description: `Downloading of the certificate ${identifier.certificate.requestName} completed successfully.`
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        targetElement.disabled = false;
        const statusMessage = 'Error when downloading the certificate!';
        this.notificationService.showNotification({
          title: statusMessage,
          description: 'Click to open the FAQ doc for further steps.'

        }, true);
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      }),
    );
    downloadObservable.subscribe();
  }

}
