import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HealthCheckService } from './health-check.service';
import { HealthCheckResponse } from './health-check.interface';
import { TabGroup, Table } from '@eds/vanilla';
import { ConfigurationService } from '../configuration-management/configuration.service';
import { Configuration } from '../configuration-management/configuration.interface';

@Component({
  selector: 'app-health-check',
  templateUrl: './health-check.component.html',
  styleUrls: ['./health-check.component.less'],
})
export class HealthCheckComponent implements AfterViewInit {
  @ViewChild('hcTableTabs')
  readonly hcTableTabsElementRef: ElementRef<HTMLElement>;
  @ViewChild('healthCheckTblSlowQuery')
  readonly queryTableElementRef: ElementRef<HTMLElement>;
  @ViewChild('healthCheckTblDeadlocks')
  readonly deadlocksTableElementRef: ElementRef<HTMLElement>;
  queryTable: Table;
  deadlocksTable: Table;
  queryTableColumns = [
    {
      key: 'pid',
      title: 'PID',
      sort: 'none',
    },
    {
      key: 'query',
      title: 'Query',
      sort: 'none',
    },
    {
      key: 'state',
      title: 'State',
      sort: 'none',
    },
    {
      key: 'duration',
      title: 'Duration',
      sort: 'none',
    },
  ];
  deadlocksTableColumns = [
    {
      key: 'blockedPid',
      title: 'Blocked PID',
      sort: 'none',
    },
    {
      key: 'blockedUser',
      title: 'Blocked user',
      sort: 'none',
    },
    {
      key: 'blockingPid',
      title: 'Blocking PID',
      sort: 'none',
    },
    {
      key: 'blockingUser',
      title: 'Blocking user',
      sort: 'none',
    },
    {
      key: 'lockedDatabase',
      title: 'Locked database',
      sort: 'none',
    },
    {
      key: 'lockedTable',
      title: 'Locked table',
      sort: 'none',
    },
    {
      key: 'blockedQuery',
      title: 'Blocked query',
      sort: 'none',
    },
    {
      key: 'blockingQuery',
      title: 'Blocking query',
      sort: 'none',
    },
  ];
  dbUptime = 'NA';
  dbCfgSize = 'NA';
  dbUsedSize = 'NA';
  dbMaxConns = 'NA';
  dbCurrConns = 'NA';
  dbActvConns = 'NA';
  dbCfgRAM = 'NA';
  dbUsedRAM = 'NA';
  ramUsedTBCLink = '';
  grafanaDashboardLink = '';
  tableHeightStyleProp = 'calc(100vh - 236px - 32px)';

  constructor(
    private healthCheckService: HealthCheckService,
    private configurationService: ConfigurationService,
  ) { }

  ngAfterViewInit(): void {
    const hcTabsDOM = this.hcTableTabsElementRef
      .nativeElement as HTMLElement;

    const tabGroup = new TabGroup(hcTabsDOM);
    tabGroup.init();

    const queryTableDOM = this.queryTableElementRef
      .nativeElement as HTMLElement;

    let table = new Table(queryTableDOM, {
      data: [],
      columns: this.queryTableColumns,
      resize: true,
      sortable: false,
      actions: false,
      height: this.tableHeightStyleProp,
    });
    table.init();
    this.queryTable = table;

    const deadlocksTableDOM = this.deadlocksTableElementRef
      .nativeElement as HTMLElement;

    table = new Table(deadlocksTableDOM, {
      data: [],
      columns: this.deadlocksTableColumns,
      resize: true,
      sortable: false,
      actions: false,
      height: this.tableHeightStyleProp,
    });
    table.init();
    this.deadlocksTable = table;

    this.healthCheckService.getHealth().subscribe({
      next: (data: HealthCheckResponse) => {
        if (data.database) {
          const dbData = data.database;
          this.dbUptime = dbData.uptime;
          this.dbCfgSize = dbData.dbSize.configured;
          this.dbUsedSize = dbData.dbSize.used;
          this.dbMaxConns = dbData.numberOfConnections.maxConnections;
          this.dbActvConns = dbData.numberOfConnections.activeConnections;
          this.dbCurrConns = dbData.numberOfConnections.currentConnections;
          this.dbCfgRAM = dbData.memory.configured;
          this.dbUsedRAM = dbData.memory.used;

          this.queryTable.update(dbData.longRunningQueries);
          this.deadlocksTable.update(dbData.deadlocks);
        }
      }
    });

    this.configurationService.getAllConfigurations().subscribe({
      next: (data: Configuration[]) => {
        if (data && data.length > 0) {
          const dbAzrDashboard = data.find(item => item.key === 'DatabaseMetricsAzureDashboard');
          const grafanaDashboard = data.find(item => item.key === 'GrafanaMetricsDashboard');

          if (dbAzrDashboard && dbAzrDashboard.value) {
            this.ramUsedTBCLink = dbAzrDashboard.value;
          }

          if (grafanaDashboard && grafanaDashboard.value) {
            this.grafanaDashboardLink = grafanaDashboard.value;
          }
        }
      }
    });
  }
}
