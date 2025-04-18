import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { VerticalBarChartStacked } from '@eds/vanilla';
import { ChartData } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-stacked-bar-chart',
  templateUrl: './stacked-bar-chart.component.html',
  styleUrls: ['./stacked-bar-chart.component.less']
})
export class StackedBarChartComponent implements AfterViewInit, OnDestroy {
  @Input() chartData: ChartData;
  @Input() selector:string;
  @Input() unit: string;
  private scripts: Scripts[] = [];
  constructor() { }

  ngAfterViewInit(): void {
    const chart = new VerticalBarChartStacked({
      element: document.getElementById(this.selector),
      data: this.chartData,
      y: { unit: this.unit },
      height:100
    });
    chart.init();
    this.scripts.push(chart);
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

}
