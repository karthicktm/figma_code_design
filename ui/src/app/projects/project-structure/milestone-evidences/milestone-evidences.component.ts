import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, ComponentRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Observable, PartialObserver, Subscription } from 'rxjs';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { CustomerAcceptanceStatus, GetMilestoneEvidencesResponse, MilestoneEvidenceRow } from '../../projects.interface';
import AcceptancePackageUtils from '../../project/acceptance-package-utilities';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { NotificationService } from 'src/app/portal/services/notification.service';
import TableUtils from '../../project/acceptance-package-details/table-utilities';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { EvidencesCarouselComponent } from '../evidences-carousel/evidences-carousel.component';
import { DetailsContextualService } from '../../project/acceptance-package-details/details-contextual.service';
import { Pagination } from '@eds/vanilla';
import { OverlayConfig } from '@angular/cdk/overlay';

const nameClassName = 'evidence-name';
const evidencePkgNameClassName = 'evidence-pkg-name';

@Component({
  selector: 'app-milestone-evidences',
  standalone: true,
  imports: [
    SharedModule,
    EvidencesCarouselComponent,
  ],
  providers: [DetailsContextualService],
  templateUrl: './milestone-evidences.component.html',
  styleUrl: './milestone-evidences.component.less'
})
export class MilestoneEvidencesComponent implements OnInit, OnDestroy {
  pageTitle = 'Milestone evidences';
  private eventAbortController = new AbortController();

  projectId: string;

  filterSortColumns: FilterSortConfiguration = {
    name: { columnName: 'Evidence name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    tag: { columnName: 'Tag', searchText: '', sortingIndex: 0, sortingOrder: '' },
    description: { columnName: 'Description', searchText: '', sortingIndex: 0, sortingOrder: '' },
    packageName: { columnName: 'Package name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: {
      columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '',
      options: Object.values(CustomerAcceptanceStatus).map((v) => {
        if (isNaN(Number(v))) return AcceptancePackageUtils.getStatus(v)
      }).filter((elem, index, arr) => index === arr.findIndex((t) => t === elem))
    },
    lastModifiedDate: { columnName: 'Last updated', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };

  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 25;
  columnsProperties = [
    {
      key: 'name',
      title: this.filterSortColumns.name.columnName,
      cellClass: nameClassName,
    },
    {
      key: 'tag',
      title: this.filterSortColumns.tag.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataDoubleDash,
    },
    {
      key: 'description',
      title: this.filterSortColumns.description.columnName,
      cellClass: 'detail-overflow',
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataDoubleDash,
    },
    {
      key: 'packageName',
      title: this.filterSortColumns.packageName.columnName,
      cellClass: evidencePkgNameClassName,
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
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    }
  ];
  @ViewChild(TableServerSidePaginationComponent) private readonly table!: TableServerSidePaginationComponent;
  tableHeightStyleProp = 'calc(100vh - 290px - 32px)';
  tableOptions: TableOptions = {
    actions: true,
    onCreatedRow: (tr: HTMLTableRowElement, rowData: MilestoneEvidenceRow): void => {
      this.replaceNameCellContentWithDetailsLink(nameClassName, rowData, tr);
      if (rowData.packageId && rowData.packageId !== 'NA') {
        const tdPkgId = tr.querySelector(`.${evidencePkgNameClassName}`);
        this.replacePackageNameCellWithLink(evidencePkgNameClassName, rowData, tdPkgId);
      }
    },
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: MilestoneEvidenceRow): void => {
      this.generateLineItemEvidencesDownloadButton(rowData, td);
    },
  }
  private subscription: Subscription = new Subscription();
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetMilestoneEvidencesResponse>;
  componentRef: ComponentRef<EvidencesCarouselComponent>;

  private get pagination(): Pagination {
    return this.table?.['pagination'];
  };

  constructor(
    private activeRoute: ActivatedRoute,
    private datePipe: NullStringDatePipe,
    private viewContainerRef: ViewContainerRef,
    private detailsService: DetailsContextualService,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.projectId = this.activeRoute.snapshot.parent.parent.paramMap.get('id');
    this.subscription.add(this.activeRoute.paramMap.subscribe((params: ParamMap) => {
      if (this.activeRoute.routeConfig.path === ':milestoneId') {
        const milestoneId = params.get('milestoneId');

        if (milestoneId) {
          this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<GetMilestoneEvidencesResponse> => {
            return this.networkRollOutService.getMilestoneEvidences(this.projectId, milestoneId, limit, offset, filterSort);
          }
        }
      }
      else {
        console.error('Component used in unknown route configuration.');
      }
    }));
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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

  /**
   * Download evidence.
   * @param id internal id of the evidence
   * @param targetElement
   */
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
          const filename = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replace('"', '') // replacing one " character
            .replace('"', ''); // replacing second " character
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
        const statusMessage = 'Error when downloading the report!';
        // push notification for the error message
        this.notificationService.showLogNotification({
          title: statusMessage,
          description: 'Please try again.'
        });
      },
    };
    this.networkRollOutService.downloadEvidenceFile(id).subscribe(downloadObserver);
  }

  private replacePackageNameCellWithLink(lineItemPkgClassName: string, rowData: MilestoneEvidenceRow, lineItemPkgNameCell: Element): void {
    const projectId = this.projectId;
    const packageId = rowData.packageId;
    const pkgRefLink = `/projects/${projectId}/acceptance-packages/${packageId}`;

    const anchorElement = document.createElement('a');
    anchorElement.classList.add(lineItemPkgClassName);
    anchorElement.addEventListener('click', (event) => {
      anchorElement.setAttribute('href', pkgRefLink);
      anchorElement.setAttribute('target', '_blank');
      anchorElement.setAttribute('rel', 'noopener noreferrer');
    });
    anchorElement.appendChild(document.createTextNode(lineItemPkgNameCell.textContent));
    lineItemPkgNameCell.replaceChildren(anchorElement);
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

  private setEvidencesPageInputs(componentRef: ComponentRef<EvidencesCarouselComponent>): void {
    componentRef.setInput('evidences', this.table.tableElements);
    componentRef.setInput('offset', this.table.offset);
    componentRef.setInput('limit', this.table.limit);
  }

  /**
   * Open dialog and display the evidence details carousel.
   * @param evidence to use
   */
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
