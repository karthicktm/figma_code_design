import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable, map } from 'rxjs';
import { WorkItemDetailsComponent } from '../work-item-details/work-item-details.component';

@Component({
  selector: 'app-workplan-details',
  standalone: true,
  imports: [
    AsyncPipe,
    WorkItemDetailsComponent
  ],
  templateUrl: './workplan-details.component.html',
  styleUrl: './workplan-details.component.less'
})
export class WorkplanDetailsComponent {
  protected workItemId: Observable<string> = this.activeRoute.paramMap.pipe(
    map(value => {
      return value.get('workplanId');
    }),
  );

  constructor(
    private activeRoute: ActivatedRoute,
  ) { }

}
