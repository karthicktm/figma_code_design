import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, ComponentRef, computed, inject, input, OnDestroy, viewChild, ViewContainerRef } from '@angular/core';
import { Observable, PartialObserver } from 'rxjs';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { NotificationService } from 'src/app/portal/services/notification.service';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import AcceptancePackageUtils from 'src/app/projects/project/acceptance-package-utilities';
import { GetMilestoneEvidencesResponse, ProjectSiteMilestoneEvidence as EvidenceRow } from 'src/app/projects/projects.interface';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { ColumnsProps } from '@eds/vanilla/table/Table';
import { EvidencesCarouselComponent } from 'src/app/projects/project-structure/evidences-carousel/evidences-carousel.component';
import { OverlayConfig } from '@angular/cdk/overlay';
import { DetailsContextualService } from 'src/app/projects/project/acceptance-package-details/details-contextual.service';
import { Pagination } from '@eds/vanilla';
import { ProjectsService } from 'src/app/projects/projects.service';
import { AsyncPipe } from '@angular/common';
import { evidenceStatusViewModelToDataModel } from 'src/app/projects/project/status-mapping';
import { DialogService } from 'src/app/portal/services/dialog.service';

const nameClassName = 'evidence-name';
const evidencePkgNameClassName = 'evidence-pkg-name';

@Component({
  selector: 'app-site-milestone-evidences',
  standalone: true,
  imports: [
    TableServerSidePaginationComponent,
    AsyncPipe,
  ],
  providers: [
    DetailsContextualService,
  ],
  templateUrl: './site-milestone-evidences.component.html',
  styleUrl: './site-milestone-evidences.component.less'
})
export class SiteMilestoneEvidencesComponent implements OnDestroy {
  private eventAbortController = new AbortController();
  protected readonly projectId = input.required<string>();
  protected readonly siteId = input.required<string>();
  private readonly projectsService = inject(ProjectsService);
  private readonly notificationService = inject(NotificationService);
  private readonly statusMap = evidenceStatusViewModelToDataModel;
  protected readonly fetchPageHandler = computed<(limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetMilestoneEvidencesResponse>>(() => {
    return (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<any> => {
      const filterSortToApply = JSON.parse(JSON.stringify(filterSort));
      if (filterSort && filterSort.status) {
        filterSortToApply.status.searchText = this.statusMap.get(filterSort.status.searchText);
      }
      return this.projectsService.getSiteMilestonesEvidences(this.projectId(), this.siteId(), { limit, offset }, filterSortToApply);
    };
  });
  protected readonly evidencesMetrics = computed(() => {
    return this.projectsService.getSiteMilestonesEvidencesMetrics(this.projectId(), this.siteId());
  });
  private readonly detailsService = inject(DetailsContextualService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private componentRef: ComponentRef<EvidencesCarouselComponent>;
  private readonly table = viewChild(TableServerSidePaginationComponent);
  private get pagination(): Pagination {
    return this.table()?.['pagination'];
  };
  protected tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  protected limit: number = 25;
  protected tableHeightStyleProp = 'calc(100vh - 393px - 32px)';

  protected readonly filterSortColumns: FilterSortConfiguration = {
    name: { columnName: 'Evidence name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    milestone: { columnName: 'Milestone', searchText: '', sortingIndex: 0, sortingOrder: '' },
    packageName: { columnName: 'Package name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    packageScope: { columnName: 'Package scope', searchText: '', sortingIndex: 0, sortingOrder: '' },
    myRole: { columnName: 'My role', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: {
      columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '',
      options: [...this.statusMap.keys()],
    },
    lastModifiedBy: { columnName: 'Last modified by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last updated', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };

  private datePipe = inject(NullStringDatePipe);
  protected columnsProperties: (ColumnsProps & { key: keyof EvidenceRow, onCreatedCell?: (td: HTMLTableCellElement, cellData: unknown, index: number) => void })[] = [
    {
      key: 'name',
      title: this.filterSortColumns.name.columnName,
      cellClass: nameClassName,
    },
    {
      key: 'customerScopeId',
      title: this.filterSortColumns.customerScopeId.columnName,
    },
    {
      key: 'milestone',
      title: this.filterSortColumns.milestone.columnName,
    },
    {
      key: 'packageName',
      title: this.filterSortColumns.packageName.columnName,
      cellClass: evidencePkgNameClassName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'packageScope',
      title: this.filterSortColumns.packageScope.columnName,
    },
    {
      key: 'myRole',
      title: this.filterSortColumns.myRole.columnName,
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
      key: 'lastModifiedBy',
      title: this.filterSortColumns.lastModifiedBy.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string, i: number): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
      }
    },
    {
      key: 'lastModifiedDate',
      title: this.filterSortColumns.lastModifiedDate.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    }
  ];

  protected tableOptions: TableOptions = {
    actions: true,
    onCreatedRow: (tr: HTMLTableRowElement, rowData: EvidenceRow): void => {
      this.replaceNameCellContentWithDetailsLink(nameClassName, rowData, tr);
      if (rowData.myRole && rowData.myRole !== 'NA' && rowData.packageId && rowData.packageId !== 'NA') {
        const tdPkgId = tr.querySelector(`.${evidencePkgNameClassName}`);
        this.replacePackageNameCellWithLink(evidencePkgNameClassName, rowData, tdPkgId);
      }
    },
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: EvidenceRow): void => {
      this.generateEvidenceDownloadButton(rowData, td);
    },
  }

  constructor(private dialogService: DialogService) { }

  ngOnDestroy(): void {
    this.eventAbortController.abort();
  }

  private generateEvidenceDownloadButton(rowData: EvidenceRow, td: HTMLTableCellElement): void {
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
    this.projectsService.downloadEvidence(id).subscribe(downloadObserver);
  }

  private replaceNameCellContentWithDetailsLink(nameClassName: string, rowData: EvidenceRow, tr: HTMLTableRowElement): void {
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

  private replacePackageNameCellWithLink(pkgClassName: string, rowData: EvidenceRow, pkgNameCell: Element): void {
    const projectId = this.projectId();
    const packageId = rowData.packageId;
    const pkgRefLink = `/projects/${projectId}/acceptance-packages/${packageId}`;

    const anchorElement = document.createElement('a');
    anchorElement.classList.add(pkgClassName);
    anchorElement.addEventListener('click', (event) => {
      anchorElement.setAttribute('href', pkgRefLink);
      anchorElement.setAttribute('target', '_blank');
      anchorElement.setAttribute('rel', 'noopener noreferrer');
    });
    anchorElement.appendChild(document.createTextNode(pkgNameCell.textContent));
    pkgNameCell.replaceChildren(anchorElement);
  }

  /**
   * Open dialog and display the evidence details carousel.
   * @param evidence to use
   */
  openEvidenceDetails(evidence: EvidenceRow): void {
    const componentRef = this.detailsService.open(
      EvidencesCarouselComponent,
      this.viewContainerRef,
      undefined,
      new OverlayConfig({
        width: '100%',
      }),
    ) as ComponentRef<EvidencesCarouselComponent>;
    componentRef.setInput('selectedEvidence', evidence);
    componentRef.setInput('totalRecords', this.table().totalRecords);
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

  private setEvidencesPageInputs(componentRef: ComponentRef<EvidencesCarouselComponent>): void {
    componentRef.setInput('evidences', this.table().tableElements.map(evidence => ({ internalId: evidence.internalId, toBeLoaded: true })));
    componentRef.setInput('offset', this.table().offset);
    componentRef.setInput('limit', this.table().limit);
  }
}
