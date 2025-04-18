import { Component, OnDestroy, OnInit, ViewChild, effect, input } from '@angular/core';
import { NgIf } from '@angular/common';
import { Observable, Subscription, catchError, map, of } from 'rxjs';
import { ActionedByMe, Certificate, CertificateRequestStatus, CertificatesRequestQueryType, GetCertificatesResponse } from 'src/app/projects/projects.interface';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import TableUtils from '../../acceptance-package-details/table-utilities';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { ProjectsService } from 'src/app/projects/projects.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ColumnsProps } from '@eds/vanilla/table/Table';
import { CertificatePreviewDialogComponent } from '../certificate-preview-dialog/certificate-preview-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import CertificateUtils from '../certificate-utilities';
import { ComponentService } from 'src/app/shared/component.service';

@Component({
  selector: 'app-certificate-table',
  standalone: true,
  imports: [
    NgIf,
    SharedModule
  ],
  templateUrl: './certificate-table.component.html',
  styleUrl: './certificate-table.component.less'
})
export class CertificateTableComponent implements OnInit, OnDestroy {
  @ViewChild(TableServerSidePaginationComponent) private readonly certificateTable: TableServerSidePaginationComponent;
  projectId = input.required<string>();
  columnsToHide = input<string[]>();
  queryType = input<CertificatesRequestQueryType>();
  certificateStatusMap = new Map([
    ['Certified', [CertificateRequestStatus.complete]],
    ['Pending', [CertificateRequestStatus.ready, CertificateRequestStatus.inProgress]],
    ['Rejected', [CertificateRequestStatus.rejected]],
  ])
  filterSortColumns = {
    requestName: { columnName: 'Request name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    requestedBy: { columnName: 'Requested by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    requestedDate: { columnName: 'Requested date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    ericssonSignatoryCount: { columnName: 'Ericsson signatory', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerSignatoryCount: { columnName: 'Customer signatory', searchText: '', sortingIndex: 0, sortingOrder: '' },
    certificateScope: { columnName: 'Scope', searchText: '', sortingIndex: 0, sortingOrder: '' },
    actionedByMe: { columnName: 'Actioned by me', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.values(ActionedByMe) },
    lastModifiedDate: { columnName: 'Last modified date', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
    status: { columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '', options: [...this.certificateStatusMap.keys()] },
  };

  columnsProperties: (ColumnsProps & { onCreatedCell?: (td: HTMLTableCellElement, cellData: unknown) => void })[] = [
    {
      key: 'requestName',
      title: 'Request name',
      cellClass: 'name-cell',
    },
    {
      key: 'certificateScope',
      title: 'Scope',
    },
    {
      key: 'requestedBy',
      title: 'Requested by',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.abortController);
      },
    },
    {
      key: 'requestedDate',
      title: 'Requested date',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    },
    {
      key: 'ericssonSignatoryCount',
      title: 'Ericsson signatory'
    },
    {
      key: 'customerSignatoryCount',
      title: 'Customer signatory'
    },
    {
      key: 'actionedByMe',
      title: 'Actioned by me',
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        const kdb = CertificateUtils.getActionedByMeTag(cellData, { big: true });
        td.replaceChildren(kdb);
      },
    },
    {
      key: 'status',
      title: 'Status',
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        const kdb = CertificateUtils.getStatusTag(cellData, { big: true });
        td.replaceChildren(kdb);
      },
    },
    {
      key: 'lastModifiedDate',
      title: 'Last modified date & time',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    },
  ];

  limit = 10;
  offset = 0;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  // TODO: adjust on available space
  tableHeightStyleProp = 'calc(100vh - 302px - 64px)';
  fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetCertificatesResponse>;

  tableOptions: TableOptions = {
    actions: true,
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: Certificate): void => {
      const eyeButton = document.createElement('button');
      eyeButton.classList.add('spacingIcon', 'btn-icon');
      eyeButton.setAttribute('title', 'View');
      const downloadButton = document.createElement('button');
      downloadButton.setAttribute('title', 'Download');
      downloadButton.classList.add('btn-icon');
      const iconEye = document.createElement('i');
      iconEye.classList.add('icon', 'icon-eye');
      eyeButton.appendChild(iconEye);
      eyeButton.addEventListener('click', (event) => {
        this.openPreview(rowData);
      }, { signal: this.abortController.signal });
      td.appendChild(eyeButton);

      if (rowData.status === CertificateRequestStatus.complete) {
        const downloadButton = document.createElement('button');
        downloadButton.classList.add('btn-icon');
        downloadButton.title = 'Download';
        const downloadIcon = document.createElement('i');
        downloadIcon.classList.add('icon', 'icon-download-save', 'ml-bs');
        downloadButton.appendChild(downloadIcon);
        downloadButton.addEventListener('click', (event) => {
          this.downloadCertificate(rowData.certificateRequestId, downloadButton);
        }, { signal: this.abortController.signal });
        td.appendChild(downloadButton);
      }
    },
    onCreatedRow: (tr: HTMLTableRowElement, rowData: Certificate): void => {
      const td = tr.querySelector('.name-cell');
      const linkHostElement = document.createElement('ng-container');
      linkHostElement.classList.add('site-name');
      td.replaceChildren(linkHostElement);
      this.componentService.createRouterLink({ text: rowData.requestName, link: ['/projects', this.projectId(), 'certificates', rowData.certificateRequestId] }, linkHostElement);
    },
  };
  private prevProjectId: string;

  private abortController: AbortController = new AbortController();
  private subscription: Subscription = new Subscription();

  constructor(
    private datePipe: NullStringDatePipe,
    private projectService: ProjectsService,
    private domSanitizer: DomSanitizer,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private componentService: ComponentService,
  ) {
    effect(() => {
      const currentProjectId = this.projectId();
      if (this.certificateTable && !!this.prevProjectId && currentProjectId !== this.prevProjectId) this.certificateTable.fetchData();
      this.prevProjectId = currentProjectId;
    },
      {
        allowSignalWrites: true
      }
    );
  }

  ngOnInit(): void {
    this.columnsToHide()?.forEach(columnKey => {
      const columnProp = this.columnsProperties.find(columnProperty => columnProperty.key === columnKey);
      if (columnProp) columnProp.hidden = true;
    });
    this.fetchPageHandler = (limit, offset, filterSort): Observable<GetCertificatesResponse> => {
      const queryType = this.queryType();
      if (filterSort.status) {
        filterSort.status.searchText = this.certificateStatusMap.get(filterSort.status.searchText)?.toString() || filterSort.status.searchText;
      }
      return this.projectService.getCertificateList(this.projectId(), limit, offset, filterSort, queryType);
    };
  }

  ngOnDestroy(): void {
    this.abortController.abort();
    this.subscription.unsubscribe();
  }

  private openPreview(rowData: Certificate): void {
    const data = {
      certificate: rowData,
      previewURL: this.projectService.getCertificatePreview(this.projectId(), { id: rowData.certificateRequestId }).pipe(
        map(response => response.certificatePreview),
        map(htmlString => {
          if (htmlString === undefined) throw new Error(`Invalid preview data.`);
          const blob = new Blob([htmlString], { type: 'text/html' });
          return this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
        }),
        catchError(() => {
          const htmlString = '<!DOCTYPE html><html><body><p>Failed to load the preview. Please try again later.</p></body></html>';
          const blob = new Blob([htmlString], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          return of(this.domSanitizer.bypassSecurityTrustResourceUrl(url));
        }),
      ),
    }
    this.dialogService.createDialog(CertificatePreviewDialogComponent, data);
  }

  downloadCertificate(id: string, targetElement: HTMLButtonElement): void {
    targetElement.disabled = true;
    targetElement.classList.add('disabled');
    const downloadSubscription = this.projectService.downloadCertificate(this.projectId(), id).subscribe({
      next: (response: HttpResponse<any>) => {
        const contentDisposition = response.headers.get('content-disposition');
        const filename: string = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
          .replace('"', '') // replacing one " character
          .replace('"', ''); // replacing second " character
        const blob = new Blob([response.body], { type: 'application/pdf' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || `certificate-${id}.pdf`;
        link.dispatchEvent(new MouseEvent('click'));
        window.URL.revokeObjectURL(downloadUrl);
        targetElement.classList.remove('disabled');
        targetElement.disabled = false;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: 'Error downloading the certificate!',
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else {
          this.notificationService.showNotification({
            title: 'Error downloading the certificate!',
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
        targetElement.classList.remove('disabled');
        targetElement.disabled = false;
      },
    });
    this.subscription.add(downloadSubscription);
  }
}
