import { Component, input, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

export interface CardConfig {
  component: Type<any>,
  inputs: Record<string, any | unknown>
}

@Component({
  selector: 'app-metric-cards',
  standalone: true,
  imports: [
    NgComponentOutlet,
  ],
  templateUrl: './metric-cards.component.html',
  styleUrl: './metric-cards.component.less'
})
export class MetricCardsComponent {
  readonly cards = input<CardConfig[]>();
}
