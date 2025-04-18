import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-filter-pills',
  templateUrl: './filter-pills.component.html',
  styleUrls: ['./filter-pills.component.less']
})
export class FilterPillsComponent {
  public filterPills;
  @Input() selectedPill;
  @Input() pillOptions;
  @Output() selectionChanged: EventEmitter<string> = new EventEmitter();
  constructor() { }

  public onPillSelect(event): void {
    this.selectedPill = event.target.id;
    this.selectionChanged.emit(this.selectedPill);
  }
}
