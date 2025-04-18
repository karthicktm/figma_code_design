import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { WorkItemDetailsComponent } from '../work-item-details/work-item-details.component';
import { map, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-milestone-details',
  standalone: true,
  imports: [
    AsyncPipe,
    WorkItemDetailsComponent
  ],
  templateUrl: './milestone-details.component.html',
  styleUrl: './milestone-details.component.less',
})
export class MilestoneDetailsComponent {
  protected workItemId: Observable<string> = this.activeRoute.paramMap.pipe(
    map(value => {
      return value.get('milestoneId');
    }),
  );

  constructor(
    private activeRoute: ActivatedRoute,
  ) { }
}
