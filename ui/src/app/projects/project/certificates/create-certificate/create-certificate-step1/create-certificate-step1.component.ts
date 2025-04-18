import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ProjectsService } from 'src/app/projects/projects.service';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { WorkplanSiteData, WorkplanSiteResponse } from 'src/app/projects/projects.interface';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { CertificateForm } from '../create-certificate.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { WorkPlanDialogComponent } from '../../certificate-work-plan-list/work-plan-dialog/work-plan-dialog.component';
import TableUtils from '../../../acceptance-package-details/table-utilities';
import { evidenceCountOptions } from '../../../status-mapping';


@Component({
  selector: 'app-create-certificate-step1',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule
  ],
  templateUrl: './create-certificate-step1.component.html',
  styleUrls: ['./create-certificate-step1.component.less']
})
export class CreateCertificateStep1Component implements OnInit {
  @Input() certificateForm: FormGroup<CertificateForm>;
  @Input() projectId: string;
  @ViewChild(TableServerSidePaginationComponent) private readonly workplansTable!: TableServerSidePaginationComponent;
  selectedOnly: boolean = false;
  loadingHeaderData: boolean = true;
  dataInitialized: boolean = false;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 10;
  offset: number = 0;
  columnsProperties = [];
  tableHeightStyleProp = 'calc(100vh - 520px)';
  private abortController: AbortController = new AbortController();
  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<WorkplanSiteResponse>;
  filterSortColumns = {
    workplanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: 'asc' },
    customerScopeId: { columnName: 'Customer scope id', searchText: '', sortingIndex: 0, sortingOrder: '' },
    category: { columnName: 'Category', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '', maxLength: 1000, infoText: 'Enter comma separated names to search multiple sites' },
    siteType: { columnName: 'Site type', searchText: '', sortingIndex: 0, sortingOrder: '', options: null },
    apApprovedCount: { columnName: 'Approved package', searchText: '', sortingIndex: 0, sortingOrder: '', options: null },
    apRejectedCount: { columnName: 'Rejected package', searchText: '', sortingIndex: 0, sortingOrder: '', options: null },
    apPendingCount: { columnName: 'Pending package', searchText: '', sortingIndex: 0, sortingOrder: '', options: null },
    siteIdByCustomer: { columnName: 'Site id by customer', searchText: '', sortingIndex: 0, sortingOrder: '', maxLength: 1000, infoText: 'Enter comma separated IDs to search multiple sites' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    milestoneNames: { columnName: 'Milestones', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  tableOptions: TableOptions = {
    selectable: 'multi',
    onSelectRow: (event: CustomEvent) => {
      event.detail.data.selected = true;
      this.updateWorkplanItem(event.detail.data);
    },
    onUnSelectRow: (event: CustomEvent) => {
      event.detail.data.selected = false;
      this.updateWorkplanItem(event.detail.data);
    },
    onCreatedRow: (tr: HTMLTableRowElement, rowData: WorkplanSiteData & { selected: boolean }): void => {
      const workplanIds = this.workplanIds;
      rowData.selected = workplanIds.value.indexOf(rowData.workplanId) > -1;

      const checkbox = tr.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.checked = rowData.selected;
      const apApprovedCount = rowData.apApprovedCount === -1 ? '-' : rowData.apApprovedCount;
      const apRejectedCount = rowData.apRejectedCount === -1 ? '-' : rowData.apRejectedCount;
      const apPendingCount = rowData.apPendingCount === -1 ? '-' : rowData.apPendingCount;
      if (apApprovedCount !== '-') {
        TableUtils.insertIconAndTextWithDialog(rowData, this.abortController, (rowData) => this.openWorkPlanDialog(rowData, 'Approved'), apApprovedCount, '.icon-approved-cell', tr);
      } else {
        const approvedCell = tr.querySelector('.icon-approved-cell');
        if (approvedCell) {
          approvedCell.textContent = '-';
        }
      }

      if (apRejectedCount !== '-') {
        TableUtils.insertIconAndTextWithDialog(rowData, this.abortController, (rowData) => this.openWorkPlanDialog(rowData, 'Rejected'), apRejectedCount, '.icon-rejected-cell', tr);
      } else {
        const rejectedCell = tr.querySelector('.icon-rejected-cell');
        if (rejectedCell) {
          rejectedCell.textContent = '-';
        }
      }

      if (apPendingCount !== '-') {
        TableUtils.insertIconAndTextWithDialog(rowData, this.abortController, (rowData) => this.openWorkPlanDialog(rowData, 'Pending'), apPendingCount, '.icon-pending-cell', tr);
      } else {
        const pendingCell = tr.querySelector('.icon-pending-cell');
        if (pendingCell) {
          pendingCell.textContent = '-';
        }
      }
    }
  };
  loadingHeaderDataError: string;

  private openWorkPlanDialog(rowData: WorkplanSiteData, filterBy: string): void {
    const data = {
      workPlan: rowData,
      projectId: this.projectId,
      filterBy: filterBy,
      isOnlyApDetails: true
    }
    this.dialogService.createDialog(WorkPlanDialogComponent, data);
  }

  constructor(
    private projectsService: ProjectsService,
    private networkRollOutService: NetworkRollOutService,
    private dialogService: DialogService,
  ) { }

  get workplanIds(): FormControl<string[]> {
    return this.certificateForm.controls.step1.controls.workplans;
  }

  get workplanSites(): FormControl<WorkplanSiteData[]> {
    return this.certificateForm.controls.step1.controls.workplanSites;
  }

  ngOnInit(): void {
    this.dataInitialized = false;
    this.networkRollOutService.getProjectStructureHeader(this.projectId).subscribe({
      next: (neHeaders: Object) => {
        this.loadingHeaderData = false;
        this.columnsProperties = [
          {
            key: 'workplanName',
            title: this.filterSortColumns.workplanName.columnName,
          },
          {
            key: 'customerScopeId',
            title: this.filterSortColumns.customerScopeId.columnName,
          },
          {
            key: 'category',
            title: this.filterSortColumns.category.columnName,
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
            key: 'siteType',
            title: this.filterSortColumns.siteType.columnName,
          },
          {
            key: 'apApprovedCount',
            title: this.filterSortColumns.apApprovedCount.columnName,
            cellClass: 'icon-approved-cell',
          },
          {
            key: 'apRejectedCount',
            title: this.filterSortColumns.apRejectedCount.columnName,
            cellClass: 'icon-rejected-cell',
          },
          {
            key: 'apPendingCount',
            title: this.filterSortColumns.apPendingCount.columnName,
            cellClass: 'icon-pending-cell',
          },
          {
            key: 'milestoneNames',
            title: this.filterSortColumns.milestoneNames.columnName,
          }
        ];

        this.filterSortColumns.siteType = {
          ...this.filterSortColumns.siteType,
          options: neHeaders['siteTypes'] ? neHeaders['siteTypes'].split(',') : null
        };

        this.filterSortColumns.apApprovedCount = {
          ...this.filterSortColumns.apApprovedCount,
          options: Object.keys(evidenceCountOptions.approvedEvidenceCount) || []
        };

        this.filterSortColumns.apPendingCount = {
          ...this.filterSortColumns.apPendingCount,
          options: Object.keys(evidenceCountOptions.pendingEvidenceCount) || []
        };

        this.filterSortColumns.apRejectedCount = {
          ...this.filterSortColumns.apRejectedCount,
          options: Object.keys(evidenceCountOptions.rejectedEvidenceCount) || []
        };



        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<WorkplanSiteResponse> => {
          const filterSortPostData: FilterSortConfiguration = { ...filterSort };
          const selectedPackageStatus = [];
          if (filterSortPostData.apApprovedCount.searchText != '' && evidenceCountOptions.approvedEvidenceCount[filterSortPostData.apApprovedCount.searchText]) {
            selectedPackageStatus.push(evidenceCountOptions.approvedEvidenceCount[filterSortPostData.apApprovedCount.searchText]);
          }
          if (filterSortPostData.apRejectedCount.searchText != '' && evidenceCountOptions.rejectedEvidenceCount[filterSortPostData.apRejectedCount.searchText]) {
            selectedPackageStatus.push(evidenceCountOptions.rejectedEvidenceCount[filterSortPostData.apRejectedCount.searchText]);
          }
          if (filterSortPostData.apPendingCount.searchText != '' && evidenceCountOptions.pendingEvidenceCount[filterSortPostData.apPendingCount.searchText]) {
            selectedPackageStatus.push(evidenceCountOptions.pendingEvidenceCount[filterSortPostData.apPendingCount.searchText]);
          }
          delete filterSortPostData.apApprovedCount;
          delete filterSortPostData.apRejectedCount;
          delete filterSortPostData.apPendingCount;
          if (this.selectedOnly) {
            return this.projectsService.getWorkplansWithSite(this.projectId, limit, offset, filterSortPostData, this.workplanIds.value, selectedPackageStatus);
          } else {
            return this.projectsService.getWorkplansWithSite(this.projectId, limit, offset, filterSortPostData, [], selectedPackageStatus);
          }
        }

        this.dataInitialized = true;
      },
      error: () => {
        this.loadingHeaderData = false;
        this.loadingHeaderDataError = 'Failed to load.';
      },
    });
  }

  updateWorkplanItem(data: WorkplanSiteData & { selected: boolean }): void {
    const workplanIds = this.workplanIds;
    const selected = data.selected;
    const workplanId = data.workplanId;

    // if selected and not already in the array, add it
    if (selected && !workplanIds.value.includes(workplanId)) {
      workplanIds.patchValue([...workplanIds.value, workplanId]);
      this.workplanSites.patchValue([...this.workplanSites.value, data]);
    }
    // if not selected and in the array, remove it
    if (!selected) {
      workplanIds.patchValue(workplanIds.value.filter(item => item !== workplanId));
      this.workplanSites.patchValue(this.workplanSites.value.filter(item => item.workplanId !== workplanId));
    }
  }

  toggleSelected(event): void {
    this.selectedOnly = event.target.checked;
    this.offset = 0;
    this.workplansTable.fetchData();
  }
}
