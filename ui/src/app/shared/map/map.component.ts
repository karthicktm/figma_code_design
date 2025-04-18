import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { GeographicalViewChart } from '@eds/vanilla';
import { Props } from '@eds/vanilla/charts/topology/geographical-view-chart/GeographicalViewChart';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('map') readonly mapElementRef: ElementRef<HTMLElement>;
  @Input() props: Props | any;
  @Input() mapData: any;
  // E.g. `[59.40916, 17.95079], 10`
  @Input() viewSetting: { latlng: number[], zoom: number };

  private map: GeographicalViewChart;

  constructor() { }

  ngAfterViewInit(): void {
    if (this.mapElementRef) {
      // Workaround with type `any` since as of EDS v3.9.0 the `Props` does not expose all props.
      const props: Props | any = {
        // Default
        ...{
          height: 400,
        },
        ...this.props,
        // Always set
        ...{
          element: this.mapElementRef.nativeElement as HTMLElement,
        }
      };
      const map = new GeographicalViewChart(props);
      map.init();
      map.setView([0, 0], 0);
      if (this.viewSetting) {
        map.setView(this.viewSetting.latlng, this.viewSetting.zoom);
      }
      const mapData = this.mapData ? this.mapData : {
        nodes: []
      };
      map.draw(mapData);
      this.map = map;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map) {
      if (!!changes.mapData
        && changes.mapData.currentValue !== changes.mapData.previousValue
      ) {
        this.map.draw(changes.mapData.currentValue);
      }

      if (!!changes.viewSetting
        && changes.viewSetting.currentValue !== changes.viewSetting.previousValue
      ) {
        const viewSetting = changes.viewSetting.currentValue;
        this.map.setView(viewSetting.latlng, viewSetting.zoom);
      }
    }
  }

  ngOnDestroy(): void {
    this.map.destroy();
  }

}
