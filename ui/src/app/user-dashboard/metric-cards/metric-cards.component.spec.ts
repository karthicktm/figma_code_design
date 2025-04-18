import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricCardsComponent } from './metric-cards.component';

describe('MetricCardsComponent', () => {
  let component: MetricCardsComponent;
  let fixture: ComponentFixture<MetricCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetricCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
