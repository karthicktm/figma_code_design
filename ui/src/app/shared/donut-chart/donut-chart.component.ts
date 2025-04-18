import { Component, effect, ElementRef, input, OnDestroy, viewChild } from '@angular/core';
import { Donut } from '@eds/vanilla';
import { Props } from '@eds/vanilla/charts/donut/Donut';
import { DonutData } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [],
  templateUrl: './donut-chart.component.html',
  styleUrls: ['./donut-chart.component.less']
})
export class DonutChartComponent implements OnDestroy {
  private readonly donutElementRef = viewChild.required<ElementRef<HTMLElement>>('donutChart');
  readonly props = input.required<Props>();
  readonly chartData = input.required<DonutData>();

  public chart: Donut;

  constructor() {
    effect(() => {
      const donutDom = this.donutElementRef().nativeElement;
      const propsInput = this.props();
      if (!this.chart && donutDom) {
        const data = this.chartData();
        const props: Props | any = {
          // Default
          ...{
            margin: { top: 100 },
          },
          ...propsInput,
          // Always set
          ...{
            element: donutDom,
            data: data,
          }
        };
        this.chart = new Donut(props);
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
