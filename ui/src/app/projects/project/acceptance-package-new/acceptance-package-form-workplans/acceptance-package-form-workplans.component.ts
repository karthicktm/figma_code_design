import { Component, computed, effect, inject, input } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ColumnsProps } from '@eds/vanilla/table/Table';
import { Observable, ReplaySubject } from 'rxjs';
import { NetworkElementType, WorkplanSiteData, WorkplanSiteResponse } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { FilterSortConfiguration, TableOptions } from 'src/app/shared/table-server-side-pagination/table-server-side-pagination.component';
import { FormDataService } from '../form-data.service';

type ColumnConfigOfWorkplanSiteData = {
  [K in keyof WorkplanSiteData]?: FilterSortConfiguration['entry'];
};

@Component({
  selector: 'app-acceptance-package-form-workplans',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './acceptance-package-form-workplans.component.html',
  styleUrl: './acceptance-package-form-workplans.component.less'
})
export class AcceptancePackageFormWorkplansComponent {
  isEdit = input<boolean>();
  packageForm = input.required<FormGroup>();
  doLITableReset = input.required<ReplaySubject<boolean>>();
  selectedOnly = input<boolean>();

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  private readonly sharedService = inject(FormDataService);

  private projectId = computed(() => {
    const isEdit = this.isEdit();
    if (this.isEdit) {
      return this.activatedRoute.snapshot.parent.paramMap.get('id');
    }
    else {
      return this.activatedRoute.snapshot.paramMap.get('id');
    }
  });

  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<WorkplanSiteResponse>;
  filterSortColumns: ColumnConfigOfWorkplanSiteData = {
    workplanName: { columnName: 'Workplan name', searchText: '', sortingIndex: 0, sortingOrder: '' },
    siteName: { columnName: 'Site name', searchText: '', sortingIndex: 0, sortingOrder: '', maxLength: 1000, infoText: 'Enter comma separated names to search multiple sites' },
    siteIdByCustomer: { columnName: 'Site ID by customer', searchText: '', sortingIndex: 0, sortingOrder: '', maxLength: 1000, infoText: 'Enter comma separated IDs to search multiple sites' },
    siteNameByCustomer: { columnName: 'Site name by customer', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerScopeId: { columnName: 'Customer scope ID', searchText: '', sortingIndex: 0, sortingOrder: '' },
    category: { columnName: 'Workplan category', searchText: '', sortingIndex: 0, sortingOrder: '' },
    networkElementType: { columnName: 'Network element type', searchText: '', sortingIndex: 0, sortingOrder: '', options: Object.values(NetworkElementType) },
    networkElementName: { columnName: 'Network element name', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };
  tableHeightStyleProp = 'calc(100vh - 400px - 100px)';
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  limit: number = 50;
  columnsProperties: (ColumnsProps & { key: keyof WorkplanSiteData, onCreatedCell?: (td: HTMLTableCellElement, cellData: unknown, index: number) => void })[] = [
      {
        key: 'workplanName',
        title: this.filterSortColumns.workplanName.columnName,
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
        key: 'customerScopeId',
        title: this.filterSortColumns.customerScopeId.columnName,
      },
      {
        key: 'category',
        title: this.filterSortColumns.category.columnName,
      },
      {
        key: 'networkElementType',
        title: this.filterSortColumns.networkElementType.columnName,
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          td.textContent = NetworkElementType[cellData] || cellData;
        },
      },
      {
        key: 'networkElementName',
        title: this.filterSortColumns.networkElementName.columnName,
      },
    ];

  tableOptions: TableOptions = {
    selectable: 'multi',
    onSelectRow: (event: CustomEvent) => {
      event.detail.data.selected = true;
      this.updateWorkplanSelection(event.detail.data);
    },
    onUnSelectRow: (event: CustomEvent) => {
      event.detail.data.selected = false;
      this.updateWorkplanSelection(event.detail.data);
    },
    onCreatedRow: (tr: HTMLTableRowElement, rowData: WorkplanSiteData & { selected: boolean }): void => {
      const step2FormGroup = this.packageForm().controls.step2 as FormGroup;
      const workplanIdsInForm = step2FormGroup.controls.multiWorkplans;
      const foundWorkplan = workplanIdsInForm.value.find(workplanId => workplanId === rowData.workplanId);
      if (foundWorkplan !== undefined) {
        rowData.selected = true;
      } else {
        rowData.selected = false;
      }

      const checkbox = tr.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.checked = rowData.selected;
      this.updateWorkplanSelection(rowData);
    }
  };

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      const isEdit = this.isEdit();
      const selectedOnly = this.selectedOnly();
      if (projectId) {
        this.fetchPageHandler = (limit: number, offset: number, filterSort: FilterSortConfiguration): Observable<WorkplanSiteResponse> => {
          const filterSortPostData: FilterSortConfiguration = { ...filterSort };
          if (filterSortPostData.networkElementType.searchText != '') {
            filterSortPostData.networkElementType.searchText = Object.keys(NetworkElementType).find(key => NetworkElementType[key] === filterSortPostData.networkElementType.searchText);
          }
          if (!isEdit) {
            filterSortPostData.lineItemStatus = { columnName: '', searchText: 'Ready', sortingIndex: 0, sortingOrder: '' };
          }
          let workplanIds: string[] = undefined;
          if (selectedOnly) {
            const step2FormGroup = this.packageForm().controls.step2 as FormGroup;
            workplanIds = step2FormGroup.controls.multiWorkplans.value;
          }
          return this.projectsService.getWorkplansWithSite(projectId, limit, offset, filterSortPostData, workplanIds);
        }
      }
    });

    effect(() => {
      const isEdit = this.isEdit();
      if (isEdit) {
        const step2FormGroup = this.packageForm().controls.step2 as FormGroup;
        const workplanIds = step2FormGroup.controls.multiWorkplans.value;
        this.sharedService.sendData(workplanIds);
      }
    });
  }

  private updateWorkplanSelection(data: WorkplanSiteData & { selected: boolean }): void {
    let isChanged = false;
    const selected = data.selected;
    const workplanId = data.workplanId;
    const step2FormGroup = this.packageForm().controls.step2 as FormGroup;
    const workplanIdsInForm = step2FormGroup.controls.multiWorkplans as FormControl<string[]>;

    // if selected and not already in the array, add it
    if (selected && !workplanIdsInForm.value.includes(workplanId)) {
      workplanIdsInForm.setValue([...workplanIdsInForm.value, workplanId]);
      isChanged = true;
    }

    // if not selected and in the array, remove it
    const workplanIdIndex = workplanIdsInForm.value.indexOf(workplanId);
    if (!selected && workplanIdIndex > -1) {
      workplanIdsInForm.value.splice(workplanIdIndex, 1);
      workplanIdsInForm.setValue([...workplanIdsInForm.value]);
      isChanged = true;

      const step3FormGroup = this.packageForm().controls.step3 as FormGroup;
      const lineItemIds = step3FormGroup.controls.lineItemIds as FormArray;

      if (lineItemIds.value.length > 0) { // In case of back navigation, old checklist line items should be cleared off when site(s) deselected
        lineItemIds.patchValue([]);
      }

      this.doLITableReset().next(true); // This is signalled to clear line item table in next step, next step should restart a fresh
    }

    if (isChanged) this.sharedService.sendData(workplanIdsInForm.value);
  }
}
