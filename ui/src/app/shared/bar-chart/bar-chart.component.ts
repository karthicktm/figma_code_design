import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { ColorScale, VerticalBarChartGrouped } from '@eds/vanilla'
import { ChartData } from 'src/app/projects/projects.interface';
@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.less']
})
export class BarChartComponent implements AfterViewInit, OnDestroy {
  @Input() chartData: ChartData;
  @Input() selector:string;
  @Input() unit: string;
  @Input() colorScale?: ColorScale;
  @Input() height?: number;

  private scripts: Scripts[] = [];
  constructor() { }

  ngAfterViewInit(): void {
    const chart = new VerticalBarChartGrouped({
      element: document.getElementById(this.selector),
      data: this.chartData,
      y: { unit: this.unit },
      height: this.height? this.height : 100
    });
    if (this.colorScale) {
      chart.colorScale = this.colorScale;
    }
    chart.init();
    this.scripts.push(chart);
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }
}
