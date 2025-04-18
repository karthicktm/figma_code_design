import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { WorkflowsService } from './workflows.service';
import { Table } from '@eds/vanilla';
import { TabGroup } from '@eds/vanilla';
import { SelectComponent } from '../shared/select/select.component';
import { AcceptanceRuleListResponse, RuleItemRequest, RuleSetInfo, WorkflowInfo, WorkflowsListResponse } from './workflows.interface';
import { OptionWithValue } from '../shared/select/select.interface';
import RoleTitleMapping from '../auth/role-mapping.utils';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { updateNoDataRowInTable } from '../shared/table-utilities';
import { NotificationService } from '../portal/services/notification.service';


@Component({
  selector: 'app-workflows',
  templateUrl: './workflows.component.html',
  styleUrls: ['./workflows.component.less'],
})
export class WorkflowsComponent implements AfterViewInit {
  @ViewChild('workflowTabs')
  readonly workflowTabsElementRef: ElementRef<HTMLElement>;
  @ViewChild('workflowSelection')
  readonly workflowSelectionElementRef: SelectComponent;
  @ViewChild('workflowDetails')
  readonly workflowDetailsElementRef: ElementRef<HTMLElement>;
  workflowSelector: SelectComponent;
  @ViewChild('accRulesSelection')
  readonly accRulesSelectionElementRef: SelectComponent;
  @ViewChild('accRulesDetails')
  readonly accRulesDetailsElementRef: ElementRef<HTMLElement>;
  accRulesSelector: SelectComponent;
  detailsTable: Table;
  accRulesTable: Table;
  detailsTableColumns = [
    {
      key: 'id',
      title: 'ID',
      sort: 'none',
    },
    {
      key: 'roleId',
      title: 'Role ID',
      sort: 'none',
    },
    {
      key: 'roleName',
      title: 'Role name',
      sort: 'none',
      onCreatedCell : (td : HTMLTableCellElement, cellData: any): void => {
        RoleTitleMapping.assignTitleForGivenRole(cellData, td);
      }
    },
    {
      key: 'stateFrom',
      title: 'State from',
      sort: 'none',
    },
    {
      key: 'stateTo',
      title: 'State to',
      sort: 'none',
    },
    {
      key: 'itemType',
      title: 'Item type',
      sort: 'none',
    },
  ];

  accRulesTableColumns = [
    {
      key: 'id',
      title: 'ID',
      sort: 'none',
    },
    {
      key: 'packageStatus',
      title: 'Package status',
      sort: 'none',
    },
    {
      key: 'itemType',
      title: 'Item type',
      sort: 'none',
    },
    {
      key: 'itemCapacity',
      title: 'Item capacity',
      sort: 'none',
    },
    {
      key: 'itemStatus',
      title: 'Item status',
      sort: 'none',
    },
  ];

  worflowDescription = '';
  lastModifiedBy = '';
  lastModifiedDate = '';
  isSoftDeleted = '';
  workflowsOpts: OptionWithValue[] = [];
  selectedWorkflowId = null;
  workflowData: WorkflowInfo[] = [];

  accRulesDescription = '';
  accRulesLastModifiedBy = '';
  accRulesLastModifiedDate = '';
  accRulesIsSoftDeleted = '';
  accRulesOpts: OptionWithValue[] = [];
  selectedAccRuleId = null;
  accRulesData: RuleSetInfo[] = [];
  tableHeightStyleProp = 'calc(100vh - 408px - 32px)';

  constructor(
    private workflowsService: WorkflowsService,
    private notificationService: NotificationService
  ) { }

  onSelectWorkflowHandler(event: string): void {
    this.selectedWorkflowId = event;
    this.updateDetailsTable(event);
  }

  updateDetailsTable(wflowId: string, wflow?: WorkflowInfo): void {
    if (wflow && this.detailsTable) {
      this.detailsTable.update(wflow.details);
      this.worflowDescription = wflow.description;
      this.lastModifiedBy = wflow.lastModifiedBy || wflow.createdBy;
      this.lastModifiedDate = wflow.lastModifiedDate || wflow.createdDate;
      this.isSoftDeleted = wflow.isSoftDeleted ? 'True' : 'False';
    } else if (this.workflowData && this.workflowData.length > 0 && this.detailsTable) {
      const filteredWFlow = this.workflowData.find(wItem => wItem.workflowId === wflowId);

      if (filteredWFlow) {
        this.detailsTable.update(filteredWFlow.details);
        this.worflowDescription = filteredWFlow.description;
        this.lastModifiedBy = filteredWFlow.lastModifiedBy || filteredWFlow.createdBy;
        this.lastModifiedDate = filteredWFlow.lastModifiedDate || filteredWFlow.createdDate;
        this.isSoftDeleted = filteredWFlow.isSoftDeleted ? 'True' : 'False';
      }
    }

    this.workflowSelectionElementRef.resetInput();
  }

  onSelectAccRulesHandler(event: string): void {
    this.selectedAccRuleId = event;
    this.updateAccRulesTable(event);
  }

  parseRuleSet(ruleSet: RuleItemRequest[]): Object[] {
    const result: Object[] = [];

    ruleSet.map(rsItem => {
      if (!rsItem.definition || rsItem.definition.length == 0) {
        return;
      }

      rsItem.definition.map(defItem => {
        const newRow = {};

        newRow['id'] = rsItem.id;
        newRow['packageStatus'] = rsItem.packageStatus;
        newRow['itemType'] = defItem.itemType;
        newRow['itemCapacity'] = defItem.itemCapacity;
        newRow['itemStatus'] = defItem.itemStatus && defItem.itemStatus.length > 0 ? defItem.itemStatus.join(', ') : '';

        result.push(newRow);
      });
    });

    return result;
  }

  updateAccRulesTable(rulesetId: string, accRule?: RuleSetInfo): void {
    if (accRule && this.accRulesTable) {
      this.accRulesTable.update(this.parseRuleSet(accRule.ruleSet));
      this.accRulesDescription = accRule.description;
      this.accRulesLastModifiedBy = accRule.lastModifiedBy || accRule.createdBy;
      this.accRulesLastModifiedDate = accRule.lastModifiedDate || accRule.createdDate;
      this.accRulesIsSoftDeleted = accRule.isSoftDeleted ? 'True' : 'False';
    } else if (this.accRulesData && this.accRulesData.length > 0 && this.accRulesTable) {
      const filteredRule = this.accRulesData.find(wItem => wItem.rulesetId === rulesetId);

      if (filteredRule) {
        this.accRulesTable.update(this.parseRuleSet(filteredRule.ruleSet));
        this.accRulesDescription = filteredRule.description;
        this.accRulesLastModifiedBy = filteredRule.lastModifiedBy || filteredRule.createdBy;
        this.accRulesLastModifiedDate = filteredRule.lastModifiedDate || filteredRule.createdDate;
        this.accRulesIsSoftDeleted = filteredRule.isSoftDeleted ? 'True' : 'False';
      }
    }

    this.accRulesSelectionElementRef.resetInput();
  }

  ngAfterViewInit(): void {
    const wfTabsDOM = this.workflowTabsElementRef
      .nativeElement as HTMLElement;

    const detailsTableDOM = this.workflowDetailsElementRef
      .nativeElement as HTMLElement;

    const accRulesTableDOM = this.accRulesDetailsElementRef
      .nativeElement as HTMLElement;

    const tabGroup = new TabGroup(wfTabsDOM);
    tabGroup.init();

    let table = new Table(detailsTableDOM, {
      data: [],
      columns: this.detailsTableColumns,
      resize: true,
      sortable: true,
      actions: false,
      height: this.tableHeightStyleProp,
    });
    table.init();
    this.detailsTable = table;
    updateNoDataRowInTable(this.detailsTable, 'Loading...');

    table = new Table(accRulesTableDOM, {
      data: [],
      columns: this.accRulesTableColumns,
      resize: true,
      sortable: true,
      actions: false,
      height: this.tableHeightStyleProp,
    });
    table.init();
    this.accRulesTable = table;
    updateNoDataRowInTable(this.accRulesTable, 'Loading...');

    this.workflowsService.getAllWorkflows().subscribe({
      next: (data: WorkflowInfo[]) => {
        if (data && data.length > 0) {
          this.workflowData = data;
          const optList: OptionWithValue[] = [];

          data.map(wflow => {
            const opt: OptionWithValue = { option: wflow.name, optionValue: wflow.workflowId };
            optList.push(opt);
          });

          this.selectedWorkflowId = data[0].workflowId;
          this.workflowsOpts = optList;
          this.updateDetailsTable(null, data[0]);
        } else {
          updateNoDataRowInTable(this.detailsTable, 'No data found.');
        }
      }, error: (error: HttpErrorResponse) => {
        if (
          error.status === HttpStatusCode.BadGateway ||
          error.status === HttpStatusCode.ServiceUnavailable ||
          !navigator.onLine
        ) {
          this.notificationService.showNotification(
            {
              title: `Error while loading data`,
              description:
                'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
            },
            true
          );
        } else {
          updateNoDataRowInTable(this.detailsTable, 'No data found.');
        }
      }
    });

    this.workflowsService.getAllAcceptanceRules().subscribe({
      next: (data: RuleSetInfo[]) => {
        if (data && data.length > 0) {
          this.accRulesData = data;
          const optList: OptionWithValue[] = [];

          data.map(rule => {
            const opt: OptionWithValue = { option: rule.name, optionValue: rule.rulesetId };
            optList.push(opt);
          });

          this.selectedAccRuleId = data[0].rulesetId;
          this.accRulesOpts = optList;
          this.updateAccRulesTable(null, data[0]);
        } else {
          updateNoDataRowInTable(this.accRulesTable, 'No data found.');
        }
      }, error: (error: HttpErrorResponse) => {
        if (
          error.status === HttpStatusCode.BadGateway ||
          error.status === HttpStatusCode.ServiceUnavailable ||
          !navigator.onLine
        ) {
          this.notificationService.showNotification(
              {
                title: `Error while loading data`,
                description:
                  'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
              },
              true
            );
        } else {
          updateNoDataRowInTable(this.accRulesTable, 'No data found.');
        }
      }
    });
  }
}
