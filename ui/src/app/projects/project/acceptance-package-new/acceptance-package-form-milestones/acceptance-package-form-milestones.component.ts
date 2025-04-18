import { Component, effect, input, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { CustomerAcceptanceStatus, MilestoneData, MilestoneResponse } from 'src/app/projects/projects.interface';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { SharedModule } from 'src/app/shared/shared.module';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import TableUtils from '../../acceptance-package-details/table-utilities';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-acceptance-package-form-milestones',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './acceptance-package-form-milestones.component.html',
  styleUrl: './acceptance-package-form-milestones.component.less'
})
export class AcceptancePackageFormMilestonesComponent implements OnInit {
  @ViewChild(TableServerSidePaginationComponent) private readonly table!: TableServerSidePaginationComponent;

  isEdit = input<boolean>();
  packageForm = input.required<FormGroup>();

  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<MilestoneResponse>;
  public filterSortColumns = {
    name: { columnName: 'Milestone', searchText: '', sortingIndex: 0, sortingOrder: '', maxLength: 1000, infoText: 'Enter comma separated names to search multiple milestones' },
    networkSiteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '', maxLength: 1000, infoText: 'Enter comma separated names to search multiple sites' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '', maxLength: 1000, infoText: 'Enter comma separated IDs to search multiple sites' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteType: { columnName: 'Site type', searchText: '', sortingIndex: 0, sortingOrder: '' },
    workPlanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    dateOfReadiness: { columnName: 'Released date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    status: { columnName: 'Status', searchText: '', sortingIndex: 0, sortingOrder: '' },
  }
  tableHeightStyleProp = 'calc(100vh - 494px)';
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 50;
  columnsProperties = [
    {
      key: 'name',
      title: this.filterSortColumns.name.columnName,
    },
    {
      key: 'networkSiteName',
      title: this.filterSortColumns.networkSiteName.columnName,
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
      key: 'siteType',
      title: this.filterSortColumns.siteType.columnName,
    },
    {
      key: 'workPlanName',
      title: this.filterSortColumns.workPlanName.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'customerScopeId',
      title: this.filterSortColumns.customerScopeId.columnName,
      onCreatedCell: TableUtils.formatCellContentWithoutCellDataNA,
    },
    {
      key: 'dateOfReadiness',
      title: this.filterSortColumns.dateOfReadiness.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    }
  ];

  tableOptions: TableOptions = {
    selectable: 'multi',
    onSelectRow: (event: CustomEvent) => {
      event.detail.data.selected = true;
      this.updateMilestoneSelection(event.detail.data);
    },
    onUnSelectRow: (event: CustomEvent) => {
      event.detail.data.selected = false;
      this.updateMilestoneSelection(event.detail.data);
    },
    onCreatedRow: (tr: HTMLTableRowElement, rowData: MilestoneData & { selected: boolean }): void => {
      const step2FormGroup = this.packageForm().controls.step2 as FormGroup;
      const milestoneIdsInForm = step2FormGroup.controls.milestoneIds;
      const foundMilestone = milestoneIdsInForm.value.find(milestoneId => milestoneId === rowData.internalId);
      if (foundMilestone !== undefined) {
        rowData.selected = true;
      } else {
        rowData.selected = false;
      }

      const checkbox = tr.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.checked = rowData.selected;
      this.updateMilestoneSelection(rowData);
    }
  };

  public projectId = signal<string>('');

  constructor(
    private activeRoute: ActivatedRoute,
    private datePipe: NullStringDatePipe,
    private networkRollOutService: NetworkRollOutService,
  ) {
    effect(() => {
      const projectId = this.projectId();
      const isEdit = this.isEdit();
      if (projectId) {
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<MilestoneResponse> => {
          const filterSortPostData: FilterSortConfiguration = JSON.parse(JSON.stringify(filterSort));
          if (isEdit) {
            filterSortPostData.status.searchText = [
              CustomerAcceptanceStatus.CustomerNew,
              CustomerAcceptanceStatus.CustomerRevision,
              CustomerAcceptanceStatus.Ready,
            ].join();
          } else {
            filterSortPostData.status.searchText = CustomerAcceptanceStatus.Ready;
          }
          return this.networkRollOutService.getMilestonesByProjectId(this.projectId(), limit, offset, filterSortPostData);
        }
      }
    });
  }

  ngOnInit(): void {
    this.projectId.set(this.activeRoute.snapshot.parent.parent.paramMap.get('id'));
  }

  private updateMilestoneSelection(data: MilestoneData & { selected: boolean }): void {
    const selected = data.selected;
    const milestoneId = data.internalId;
    const step2FormGroup = this.packageForm().controls.step2 as FormGroup;
    const milestoneIdsInForm = step2FormGroup.controls.milestoneIds as FormControl<string[]>;

    // if selected and not already in the array, add it
    if (selected && !milestoneIdsInForm.value.includes(milestoneId)) {
      milestoneIdsInForm.setValue([...milestoneIdsInForm.value, milestoneId]);
    }

    // if not selected and in the array, remove it
    const milestoneIdIndex = milestoneIdsInForm.value.indexOf(milestoneId);
    if (!selected && milestoneIdIndex > -1) {
      milestoneIdsInForm.value.splice(milestoneIdIndex, 1);
      milestoneIdsInForm.setValue([...milestoneIdsInForm.value]);
    }
  }
}

