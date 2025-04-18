import { Component, effect, inject } from '@angular/core';
import { DonutChartComponent } from 'src/app/shared/donut-chart/donut-chart.component';
import { ProjectsService } from '../projects.service';
import { map, Observable } from 'rxjs';
import { DashboardAcceptanceTrendEntry, ChartData, DonutData, GetDashboardCertificatesCountResponse, GetDashboardEvidencesCountResponse, GetDashboardPackagesCountResponse, DashboardCertificationTrendEntry } from '../projects.interface';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { VerticalBarChartGroupedComponent } from 'src/app/shared/vertical-bar-chart-grouped/vertical-bar-chart-grouped.component';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { Props as DonutProps } from '@eds/vanilla/charts/donut/Donut';
import { Props as VerticalBarChartGroupedProps } from '@eds/vanilla/charts/bar-charts/VerticalBarChartGrouped';
import { ColorScale } from '@eds/vanilla';

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DonutChartComponent,
    VerticalBarChartGroupedComponent,
  ],
  templateUrl: './project-dashboard.component.html',
  styleUrl: './project-dashboard.component.less'
})
export class ProjectDashboardComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  private readonly datePipe = inject(NullStringDatePipe);
  private readonly paramMap = toSignal(this.activatedRoute.paramMap);

  protected packageCountProps: DonutProps;
  protected packageCountData: Observable<DonutData>;
  private readonly acceptanceStatusKeys = [
    'Approved',
    'Rejected',
    'Pending',
  ];

  protected evidenceCountProps: DonutProps;
  protected evidenceCountData: Observable<DonutData>;

  protected certificateCountProps: DonutProps;
  protected certificateCountData: Observable<DonutData>;
  private readonly certificateStatusKeys = [
    'Certified',
    'Rejected',
    'Pending',
  ];

  protected acceptanceTrendProps: VerticalBarChartGroupedProps;
  protected acceptanceTrendData: Observable<ChartData>;
  protected readonly acceptanceTrendNoDataMessage = 'No acceptance packages were submitted/approved/rejected/pending within this time window';
  private readonly acceptanceTrendKeys = [
    'Approved',
    'Rejected',
    'Pending',
    'Submitted',
  ];

  protected certificationTrendProps: VerticalBarChartGroupedProps;
  protected certificationTrendData: Observable<ChartData>;
  protected readonly certificationTrendNoDataMessage = 'No acceptance certificate requests were submitted/signed/rejected/pending within this time window';
  private readonly certificationTrendKeys = [
    'Certified',
    'Rejected',
    'Pending',
    'Submitted',
  ];

  protected donutColorScale: ColorScale;
  protected verticalBarColorScale: ColorScale;

  constructor() {
    // consistent color code of the charts
    // rely on the data series being presented in required order
    this.donutColorScale = new ColorScale({
      colors: [
        'color-data-3',
        'color-data-4',
        'color-data-2',
      ]
    });
    this.donutColorScale.init();

    this.verticalBarColorScale = new ColorScale({
      colors: [
        'color-data-3',
        'color-data-4',
        'color-data-2',
        'color-data-6',
      ]
    });
    this.verticalBarColorScale.init();

    this.packageCountProps = {
      data: undefined,
      element: undefined,
      showValue: true,
      showAbsoluteValue: true,
      unit: 'Total package',
      colorScale: this.donutColorScale,
    };

    this.evidenceCountProps = {
      data: undefined,
      element: undefined,
      showValue: true,
      showAbsoluteValue: true,
      unit: 'Total evidence',
      colorScale: this.donutColorScale,
    };

    this.certificateCountProps = {
      data: undefined,
      element: undefined,
      showValue: true,
      showAbsoluteValue: true,
      unit: 'Total request',
      colorScale: this.donutColorScale,
    };

    this.acceptanceTrendProps = {
      data: undefined,
      element: undefined,
      y: { unit: 'Number of packages' },
      colorScale: this.verticalBarColorScale,
    };

    this.certificationTrendProps = {
      data: undefined,
      element: undefined,
      y: { unit: 'Number of certificate requests' },
      colorScale: this.verticalBarColorScale,
    };

    effect(() => {
      const paramMap = this.paramMap();
      const projectId = paramMap?.get('id');

      this.packageCountData = this.projectsService.getDashboardPackagesCount(projectId).pipe(
        map(data => this.mapToDonutData(data, this.acceptanceStatusKeys))
      );

      this.evidenceCountData = this.projectsService.getDashboardEvidencesCount(projectId).pipe(
        map(data => this.mapToDonutData(data, this.acceptanceStatusKeys))
      );

      this.certificateCountData = this.projectsService.getDashboardCertificatesCount(projectId).pipe(
        map(data => this.mapToDonutData(data, this.certificateStatusKeys))
      );

      this.acceptanceTrendData = this.projectsService.getDashboardAcceptanceTrend(projectId).pipe(
        map(res => res.acceptancePackages),
        map(packageList => this.mapToTrendData(packageList, this.acceptanceTrendKeys))
      );

      this.certificationTrendData = this.projectsService.getDashboardCertificationTrend(projectId).pipe(
        map(res => res.certificates),
        map(certificateList => this.mapToTrendData(certificateList, this.certificationTrendKeys))
      );
    });
  }

  mapToDonutData(inputData: GetDashboardPackagesCountResponse | GetDashboardEvidencesCountResponse | GetDashboardCertificatesCountResponse, keys: string[]): DonutData {
    const series = keys.map(key => {
      const mappedEntry = Object.entries(inputData).find(entry => entry[0].toLowerCase() === key.toLowerCase());
      const mappedValue = mappedEntry ? mappedEntry[1] : 0;
      return {
        name: key,
        values: [mappedValue],
      }
    });
    return { series };
  }

  mapToTrendData(inputData: DashboardAcceptanceTrendEntry[] | DashboardCertificationTrendEntry[], keys: string[]): ChartData {
    const total = inputData.map(trendEntry => {
      return Object.entries(trendEntry).filter(attr => !(['fromDate', 'toDate'].includes(attr[0])))
        .map(attr => attr[1])
        .reduce((acc: number, curr: number) => acc + curr, 0);
    }).reduce((acc: number, curr: number) => acc + curr, 0);;
    if (total === 0) return { common: undefined, series: undefined };

    const common = inputData.map(trendEntry => {
      const dateFormat = 'MMM d';
      const from = this.datePipe.transform(trendEntry.fromDate, dateFormat);
      const to = this.datePipe.transform(trendEntry.toDate, dateFormat);
      return from + ' - ' + to;
    });
    const series = [];
    inputData.map(trendEntry => {
      keys.forEach(key => {
        let seriesItem = series.find(series => series.name.toLowerCase() === key.toLowerCase());
        if (!(seriesItem)) {
          seriesItem = {
            name: key,
            values: [],
          };
          series.push(seriesItem);
        }
        const mappedEntry = Object.entries(trendEntry).find(entry => entry[0].toLowerCase() === key.toLowerCase());
        const mappedValue = mappedEntry ? mappedEntry[1] : 0;
        seriesItem.values.push(mappedValue);
      })
    });
    return { common, series };
  }
}
