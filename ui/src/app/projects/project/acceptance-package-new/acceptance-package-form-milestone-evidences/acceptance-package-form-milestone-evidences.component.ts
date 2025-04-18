import { Component, ComponentRef, effect, input, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { Observable, PartialObserver } from 'rxjs';
import { GetMilestoneEvidencesResponse, MilestoneEvidenceRow } from 'src/app/projects/projects.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { DetailsContextualService } from '../../acceptance-package-details/details-contextual.service';
import TableUtils from '../../acceptance-package-details/table-utilities';
import AcceptancePackageUtils from '../../acceptance-package-utilities';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { OverlayConfig } from '@angular/cdk/overlay';
import { Pagination } from '@eds/vanilla';
import { EvidencesCarouselComponent } from 'src/app/projects/project-structure/evidences-carousel/evidences-carousel.component';

const nameClassName = 'evidence-name';

@Component({
  selector: 'app-acceptance-package-form-milestone-evidences',
  standalone: true,
  imports: [
    SharedModule,
    EvidencesCarouselComponent,
  ],
  providers: [DetailsContextualService],
  templateUrl: './acceptance-package-form-milestone-evidences.component.html',
  styleUrl: './acceptance-package-form-milestone-evidences.component.less'
})
export class AcceptancePackageFormMilestoneEvidencesComponent implements OnDestroy {
  private eventAbortController = new AbortController();

  @ViewChild(TableServerSidePaginationComponent) private readonly table!: TableServerSidePaginationComponent;

  projectId = input.required<string>();
  milestoneIds = input.required<string[]>();

  filterSortColumns: FilterSortConfiguration = {
    name: { columnName: 'Evidence name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    description: { columnName: 'Description', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workplanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: {
      columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '',
      options: ['Draft', 'Ready']
    },
    lastModifiedDate: { columnName: 'Last updated date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };

  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 10;
  columnsProperties = [
    {
      key: 'name',
      title: this.filterSortColumns.name.columnName,
      cellClass: nameClassName,
    },
    {
      key: 'description',
      title: this.filterSortColumns.description.columnName,
      cellClass: 'detail-overflow',
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataDoubleDash,
    },
    {
      key: 'siteName',
      title: this.filterSortColumns.siteName.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'siteIdByCustomer',
      title: this.filterSortColumns.siteIdByCustomer.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'siteNameByCustomer',
      title: this.filterSortColumns.siteNameByCustomer.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'workplanName',
      title: this.filterSortColumns.workplanName.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'status',
      title: this.filterSortColumns.status.columnName,
      cellStyle: 'white-space: nowrap',
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData, { big: true }));
      },
    },
    {
      key: 'lastModifiedDate',
      title: this.filterSortColumns.lastModifiedDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    }
  ];
  tableHeightStyleProp = 'calc(100vh - 494px)';
  tableOptions: TableOptions = {
    actions: true,
    onCreatedRow: (tr: HTMLTableRowElement, rowData: MilestoneEvidenceRow): void => {
      this.replaceNameCellContentWithDetailsLink(nameClassName, rowData, tr);
    },
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: MilestoneEvidenceRow): void => {
      this.generateLineItemEvidencesDownloadButton(rowData, td);
    },
  }
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetMilestoneEvidencesResponse>;
  componentRef: ComponentRef<EvidencesCarouselComponent>;

  private get pagination(): Pagination {
    return this.table?.['pagination'];
  };

  constructor(
    private datePipe: NullStringDatePipe,
    private viewContainerRef: ViewContainerRef,
    private detailsService: DetailsContextualService,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
  ) {
    effect(() => {
      const projectId = this.projectId();
      const milestoneIds = this.milestoneIds();
      if (projectId && milestoneIds && milestoneIds.length > 0) {
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<GetMilestoneEvidencesResponse> => {
          return this.networkRollOutService.getMilestoneEvidencesByMilestoneIds(projectId, milestoneIds, limit, offset, filterSort);
        }
      } else {
        this.table.clearTable();
      }
    });
  }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
  }

  private generateLineItemEvidencesDownloadButton(rowData: MilestoneEvidenceRow, td: HTMLTableCellElement): void {
    const downloadButton = document.createElement('button');
    downloadButton.setAttribute('title', 'Download evidence');
    downloadButton.classList.add('btn-icon', 'download-evidence');
    const iconDownload = document.createElement('i');
    iconDownload.classList.add('icon', 'icon-download-save');
    downloadButton.appendChild(iconDownload);
    downloadButton.addEventListener('click', () => {
      this.downloadEvidence(rowData.internalId, downloadButton);
    }, { signal: this.eventAbortController.signal } as AddEventListenerOptions);
    td.appendChild(downloadButton);
  }

  private downloadEvidence(id: string, targetElement: HTMLButtonElement): void {
    const downloadObserver: PartialObserver<HttpEvent<Blob>> = {
      next: (result => {
        if (result.type === HttpEventType.Sent) {
          targetElement.disabled = true;
        }
        if (result.type === HttpEventType.Response) {
          targetElement.disabled = false;
          const contentDisposition = result.headers.get('content-disposition');
          // retrieve the file name and remove potential quotes from it
          const filename = contentDisposition?.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replaceAll('"', '');
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showLogNotification({
            title: `Evidence "${filename}" successfully downloaded!`,
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        targetElement.disabled = false;
        const statusMessage = 'Error when downloading the evidence file!';
        // push notification for the error message
        this.notificationService.showNotification(
          {
            title: statusMessage,
            description:
              'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
          },
          true
        );
      },
    };
    this.networkRollOutService.downloadEvidenceFile(id).subscribe(downloadObserver);
  }

  private replaceNameCellContentWithDetailsLink(nameClassName: string, rowData: MilestoneEvidenceRow, tr: HTMLTableRowElement): void {
    const td = tr.querySelector(`.${nameClassName}`);
    if (td) {
      const link = document.createElement('a');
      link.appendChild(document.createTextNode(rowData.name || 'Unknown'));
      link.addEventListener('click', (event) => {
        this.openEvidenceDetails(rowData);
      }, { signal: this.eventAbortController.signal });
      td.replaceChildren(link);
    }
  }

  openEvidenceDetails(evidence: MilestoneEvidenceRow): void {
    const componentRef = this.detailsService.open(
      EvidencesCarouselComponent,
      this.viewContainerRef,
      undefined,
      new OverlayConfig({
        width: '100%',
      }),
    ) as ComponentRef<EvidencesCarouselComponent>;
    componentRef.setInput('selectedEvidence', evidence);
    componentRef.setInput('totalRecords', this.table.totalRecords);
    this.setEvidencesPageInputs(componentRef);
    componentRef.instance.page.subscribe(change => this.onPageChangeRequest(change));
    this.componentRef = componentRef;
  }

  private setEvidencesPageInputs(componentRef: ComponentRef<EvidencesCarouselComponent>): void {
    componentRef.setInput('evidences', this.table.tableElements);
    componentRef.setInput('offset', this.table.offset);
    componentRef.setInput('limit', this.table.limit);
  }

  onPageChangeRequest(change: 'next' | 'prev'): void {
    const clickEvent = new CustomEvent('click');
    if (change === 'next') {
      const rightArrow = this.pagination?.['dom'].paginationGroup.querySelector('[data-value=right]');
      if (rightArrow.classList.contains('disabled')) {
        const first = this.pagination?.['dom'].paginationGroup.querySelector('[data-value=left]')?.nextElementSibling;
        first?.dispatchEvent(clickEvent);
      }
      else {
        rightArrow.dispatchEvent(clickEvent);
      }
    }
    else {
      const leftArrow = this.pagination?.['dom'].paginationGroup.querySelector('[data-value=left]');
      if (leftArrow.classList.contains('disabled')) {
        const last = this.pagination?.['dom'].paginationGroup.querySelector('[data-value=right]')?.previousElementSibling;
        last?.dispatchEvent(clickEvent);
      }
      else {
        leftArrow?.dispatchEvent(clickEvent);
      }
    }
  }

  updatePageInputs(isPageLoaded: boolean): void {
    if (this.componentRef && isPageLoaded) this.setEvidencesPageInputs(this.componentRef);
  }
}
