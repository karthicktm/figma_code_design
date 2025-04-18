import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, SecurityContext, ViewChild } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { CertificateTemplate, GetCertificateTemplateResponse } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import TableUtils from '../../acceptance-package-details/table-utilities';
import { FilterSortAttr } from 'src/app/project-onboarding/project-onboarding.service';
import { CertificateTemplateCloneDialogComponent } from '../certificate-template-clone-dialog/certificate-template-clone-dialog.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { CertificateTemplateFormDialogComponent } from '../certificate-template-form-dialog/certificate-template-form-dialog.component';
import { HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { DeleteCertificateTemplateDialogComponent } from '../delete-certificate-template-dialog/delete-certificate-template-dialog.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CertificateTemplateEditFormDialogComponent } from '../certificate-template-edit-form-dialog/certificate-template-edit-form-dialog.component';
import { PreviewCertificateTemplateDialogComponent } from '../preview-certificate-template-dialog/preview-certificate-template-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';

export enum TemplateStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Default = 'Default',
};

@Component({
  selector: 'app-certificate-template-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
  ],
  templateUrl: './certificate-template-list.component.html',
  styleUrl: './certificate-template-list.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateTemplateListComponent implements OnInit, OnDestroy {
  @ViewChild(TableServerSidePaginationComponent) private readonly listTableRef!: TableServerSidePaginationComponent;

  private subscription: Subscription = new Subscription();
  private abortController: AbortController = new AbortController();

  filterSortColumns = {
    templateName: { columnName: 'Template name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdBy: { columnName: 'Created by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdDate: { columnName: 'Created date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedBy: { columnName: 'Last modified by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
    templateStatus: { columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.values(TemplateStatus) },
  };

  columnsProperties = [
    {
      key: 'templateName',
      title: 'Template name',
      cellClass: 'template-name-cell',
    },
    {
      key: 'createdBy',
      title: 'Created by',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.abortController);
      },
    },
    {
      key: 'createdDate',
      title: 'Created date',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    },
    {
      key: 'lastModifiedBy',
      title: 'Last modified by',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.abortController);
      },
    },
    {
      key: 'lastModifiedDate',
      title: 'Last modified date & time',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    },
    {
      key: 'templateStatus',
      title: 'Status',
      onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
        if (cellData === TemplateStatus.Active) {
          td.innerHTML = `<kbd class="tag big green">${TemplateStatus.Active}</kbd>`;
        } else if (cellData === TemplateStatus.Inactive) {
          td.innerHTML = `<kbd class="tag big red">${TemplateStatus.Inactive}</kbd>`;
        } else if (cellData === TemplateStatus.Default) {
          td.innerHTML = `<kbd class="tag big blue">${TemplateStatus.Default}</kbd>`;
        }
      },
    },
  ];

  projectId: string;
  limit = 10;
  offset = 0;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  tableHeightStyleProp = 'calc(100vh - 302px - 32px)';
  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<GetCertificateTemplateResponse>;

  tableOptions: TableOptions = {
    actions: true,
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: CertificateTemplate): void => {
      // no actions when inactive
      if (rowData.templateStatus === TemplateStatus.Inactive) return;

      if (rowData.templateStatus !== TemplateStatus.Default) {
        td.appendChild(this.generateEditButton(rowData));
      }

      const cloneButton = document.createElement('button');
      cloneButton.classList.add('btn-icon');
      cloneButton.title = 'Clone';
      const cloneIcon = document.createElement('i');
      cloneIcon.classList.add('icon', 'icon-copy');
      cloneButton.appendChild(cloneIcon);
      cloneButton.addEventListener('click', () => {
        const dialogRef = this.dialogService.createDialog(CertificateTemplateCloneDialogComponent, { projectId: this.projectId, originalTemplate: rowData });
        const dialogSubscription = dialogRef.instance.dialogResult.subscribe(result => {
          if (result) {
            this.listTableRef.fetchData();
          }
        });

        this.subscription.add(dialogSubscription);
      }, { signal: this.abortController.signal });
      td.appendChild(cloneButton);

      const downloadButton = document.createElement('button');
      downloadButton.classList.add('btn-icon');
      downloadButton.title = 'Download';
      const downloadIcon = document.createElement('i');
      downloadIcon.classList.add('icon', 'icon-download-save');
      downloadButton.appendChild(downloadIcon);
      downloadButton.addEventListener('click', () => {
        this.downloadTemplate(rowData.templateId, downloadButton);
      }, { signal: this.abortController.signal });
      td.appendChild(downloadButton);

      if (rowData.templateStatus !== TemplateStatus.Default) {
        td.appendChild(this.generateDeleteButton(rowData));
      }
    },
    onCreatedRow: (tr: HTMLTableRowElement, rowData: CertificateTemplate): void => {
      if (rowData.templateStatus !== TemplateStatus.Inactive) {
        const link = document.createElement('a');
        link.textContent = rowData.templateName;
        const td = tr.querySelector('.template-name-cell');
        td.replaceChildren(link);
        this.subscription.add(
          link.addEventListener('click', (event) => {
            this.openPreview(rowData);
          }, { signal: this.abortController.signal })
        );
      }
    },
  };

  constructor(
    private projectService: ProjectsService,
    private datePipe: NullStringDatePipe,
    private domSanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.subscription.add(this.route.params.subscribe(params => {
      this.projectId = params.id;
      this.fetchPageHandler = (limit, offset, filterSort): Observable<GetCertificateTemplateResponse> => {
        const filterSortAttr: FilterSortAttr[] = [];
        Object.keys(filterSort).forEach(filterKey => {
          if (filterSort[filterKey].searchText !== '') {
            let fValue = undefined;
            fValue = filterSort[filterKey].searchText;
            filterSortAttr.push({
              key: filterKey,
              value: fValue
            });
          }
          if (filterSort[filterKey].sortingOrder !== '') {
            const sortAttr = {
              key: 'sort',
              value: `${filterSort[filterKey].sortingOrder}(${filterKey})`
            };
            filterSortAttr.push(sortAttr);
          }
        });
        return this.projectService.getCertificateTemplates(this.projectId, limit, offset, filterSortAttr);
      };
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.abortController.abort();
  }

  createCertificateTemplate(): void {
    const dialog = this.dialogService.createDialog(CertificateTemplateFormDialogComponent, { projectId: this.projectId });
    const dialogSubscription = dialog.instance.dialogResult.subscribe(result => {
      if (result) {
        this.listTableRef.fetchData();
      }
    });

    this.subscription.add(dialogSubscription);
  }

  private openPreview(rowData: CertificateTemplate): void {
    const data = {
      certificateTemplate: rowData,
      certificatePreviewURL: of(rowData.templateData).pipe(
        map(templateData => {
          if (templateData === undefined) throw new Error(`Invalid template data.`);
          return this.domSanitizer.sanitize(SecurityContext.HTML, URL.createObjectURL(new Blob([templateData], { type: 'text/html' })));
        }),
        catchError(() => {
          const htmlString = '<!DOCTYPE html><html><body><p>Failed to load the preview. Please try again later.</p></body></html>';
          const blob = new Blob([htmlString], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          return of(url);
        }),
      ),
    }
    this.dialogService.createDialog(PreviewCertificateTemplateDialogComponent, data);
  }

  downloadTemplate(templateId: string, targetElement: HTMLButtonElement): void {
    targetElement.disabled = true;
    targetElement.classList.add('disabled');
    const downloadSubscription = this.projectService.downloadCertificateTemplate(this.projectId, templateId).subscribe({
      next: (response: HttpResponse<any>) => {
        const contentDisposition = response.headers.get('content-disposition');
        const filename: string = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
          .replace('"', '') // replacing one " character
          .replace('"', ''); // replacing second " character
        const blob = new Blob([response.body], { type: 'text/html' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'certificate-template.html';
        link.dispatchEvent(new MouseEvent('click'));
        window.URL.revokeObjectURL(downloadUrl);
        targetElement.classList.remove('disabled');
        targetElement.disabled = false;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: 'Error downloading the certificate template!',
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else {
          this.notificationService.showNotification({
            title: 'Error downloading the certificate template!',
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
        targetElement.classList.remove('disabled');
        targetElement.disabled = false;
      },
    });
    this.subscription.add(downloadSubscription);
  }

  private generateDeleteButton(template: CertificateTemplate): HTMLButtonElement {
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('btn-icon');
    deleteButton.title = 'Delete';
    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('icon', 'icon-trashcan');
    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener('click', () => {
      this.deleteTemplate(template);
    }, { signal: this.abortController.signal });

    return deleteButton;
  }

  private deleteTemplate(template: CertificateTemplate): void {
    const dialogRef = this.dialogService.createDialog(DeleteCertificateTemplateDialogComponent, { name: template.templateName });

    this.subscription.add(dialogRef.instance.dialogResult.subscribe((confirmed) => {
      if (confirmed) {
        this.projectService.deleteCertificateTemplate(this.projectId, template.templateId).subscribe({
          next: () => {
            this.listTableRef.fetchData();
          },
          error: (error) => {
            this.notificationService.showNotification({
              title: `Error when deleting certificate template '${template.templateName}'!`,
              description: 'Click to open the FAQ doc for further steps.'
            }, true);
          }
        });
      }
    }));
  }

  private generateEditButton(template: CertificateTemplate): HTMLButtonElement {
    const editButton = document.createElement('button');
    editButton.classList.add('btn-icon');
    editButton.title = 'Edit';
    const editIcon = document.createElement('i');
    editIcon.classList.add('icon', 'icon-edit');
    editButton.appendChild(editIcon);
    editButton.addEventListener('click', () => {
      this.editTemplate(template);
    }, { signal: this.abortController.signal });
    return editButton;
  }

  private editTemplate(template: CertificateTemplate): void {
    const dialog = this.dialogService.createDialog(CertificateTemplateEditFormDialogComponent, { projectId: this.projectId, template });
    const dialogSubscription = dialog.instance.dialogResult.subscribe(result => {
      if (result) {
        this.listTableRef.fetchData();
      }
    });

    this.subscription.add(dialogSubscription);
  }
}
