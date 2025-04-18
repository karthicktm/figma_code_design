import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalBarChartGroupedComponent } from './vertical-bar-chart-grouped.component';

describe('VerticalBarChartGroupedComponent', () => {
  let component: VerticalBarChartGroupedComponent;
  let fixture: ComponentFixture<VerticalBarChartGroupedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerticalBarChartGroupedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerticalBarChartGroupedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
