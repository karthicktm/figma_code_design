import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportUsageReportDirective } from './export-usage-report.directive';
import { ReportsComponent } from './reports.component';
import { SharedModule } from '../shared/shared.module';
import { ReportsRoutingModule } from './reports-routing.module';
import { FormsModule } from '@angular/forms';
import { ExportUsageReportDialogComponent } from './export-usage-report-dialog/export-usage-report-dialog.component';
import { DownloadProgressDialogComponent } from './download-progress-dialog/download-progress-dialog.component';
import { UsageDashboardComponent } from './usage-dashboard/usage-dashboard.component';
import { UsageDashboardFilterComponent } from './usage-dashboard-filter/usage-dashboard-filter.component';

@NgModule({
  declarations: [
    ReportsComponent,
    ExportUsageReportDirective,
    ExportUsageReportDialogComponent,
    DownloadProgressDialogComponent,
    UsageDashboardComponent,
    UsageDashboardFilterComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReportsRoutingModule,
  ]
})
export class ReportsModule { }
