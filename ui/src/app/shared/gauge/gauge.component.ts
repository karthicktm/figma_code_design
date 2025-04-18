import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Gauge } from '@eds/vanilla';

@Component({
  selector: 'app-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.less']
})
export class GaugeComponent implements OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('gaugeContent') readonly gaugeElementRef: ElementRef<HTMLElement>;

  // title of the chart
  @Input() title: string;
  // Current value of the chart
  @Input() currentValue: number;
  // Total value of the gauge chart. Based on this percentage will be calculated
  @Input() totalValue: number;
  // Id of the chart
  @Input() gaugeId: string;
  // percentage of the chart
  private percentageValue: number;

  private gauge: Gauge;
  private scripts: Scripts[] = [];

  constructor() {

  }

  ngAfterViewInit(): void {
    const gaugeDOM: HTMLElement = this.gaugeElementRef.nativeElement;
    if (gaugeDOM === undefined) {
      return;
    }

    this.gauge = new Gauge(gaugeDOM);
    const dataSettings = gaugeDOM.getAttributeNode('data-settings');
    dataSettings.nodeValue = '{"value": "'
      + this.percentageValue
      + '", "min": "0" , "max": "100", "units": "%", "size": "medium"}';
    this.gauge.init();
    this.scripts.push(this.gauge);

    this.gauge.setValue(this.calculatePercentage());
  }

  ngOnChanges(): void {
    this.setValue();
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  // calculate the percentage
  calculatePercentage(): number {
    if (this.currentValue && this.totalValue) {
      // if the total value is 0 then percentage should be 0
      if (this.totalValue === 0 ) {
        this.percentageValue = 0;
        return 0;
      } else {
        this.percentageValue = Math.round(this.currentValue / this.totalValue * 100);
        return this.percentageValue;
      }
    } else {
      return 0;
    }
  }

  // set the values of the charts when rest API response is received in input vars
  setValue(): void {
    if (this.gauge) {
      this.gauge.setValue(this.calculatePercentage());
    }
  }
}
