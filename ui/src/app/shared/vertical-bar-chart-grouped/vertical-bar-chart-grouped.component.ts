import { Component, effect, ElementRef, input, OnDestroy, viewChild } from '@angular/core';
import { VerticalBarChartGrouped } from '@eds/vanilla';
import { Props } from '@eds/vanilla/charts/bar-charts/VerticalBarChartGrouped';
import { ChartData } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-vertical-bar-chart-grouped',
  standalone: true,
  imports: [],
  templateUrl: './vertical-bar-chart-grouped.component.html',
  styleUrl: './vertical-bar-chart-grouped.component.less'
})
export class VerticalBarChartGroupedComponent implements OnDestroy {
  private readonly barChartElementRef = viewChild.required<ElementRef<HTMLElement>>('verticalBarChartGrouped');
  readonly props = input.required<Props>();
  readonly chartData = input.required<ChartData>();

  public chart: VerticalBarChartGrouped;

  constructor() {
    effect(() => {
      const barChartDom = this.barChartElementRef().nativeElement;
      const propsInput = this.props();
      if (!this.chart && barChartDom) {
        const data = this.chartData();
        const props: Props | any = {
          ...propsInput,
          // Always set
          ...{
            element: barChartDom,
            data: data,
          }
        };
        this.chart = new VerticalBarChartGrouped(props);
        this.chart.init();
      }
    })

    effect(() => {
      const data = this.chartData();
      if (data && this.chart) {
        this.chart.draw(data);
      }
    })
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
