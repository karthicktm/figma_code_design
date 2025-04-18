import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Timeline } from '@eds/vanilla';
import { Observable, Subscription } from 'rxjs';
import { Comment, FilterOptions } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';
import { timeLineConfig } from 'src/app/portal/portal.constants';

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.less']
})
export class CommentSectionComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input() commentLevel: string;
  @Input() linearId: Observable<string>;
  @Input() isInternal: boolean;
  @ViewChild('commentsTimeline') readonly commentsElementRef: ElementRef<HTMLElement>;

  public subscription: Subscription = new Subscription();

  private scripts: Scripts[] = [];

  targetLinearId: string;
  commentHistory = [];
  commentInput: string;
  submitButtonDisabled = true;
  isInternalComment = true;
  timeline: Timeline;
  filterOptions: FilterOptions[] = [
    { key: 'internal', label: 'Internal' },
    { key: 'external', label: 'External' }
  ];
  public seletedFilter = 'external';
  public isVisible = false;

  constructor(
    private projectsService: ProjectsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.commentLevel === 'PACKAGE') {
      this.isVisible = true;
    }
  }

  ngAfterViewInit(): void {
    const timelineDOM = this.commentsElementRef.nativeElement;

    if (timelineDOM) {
      this.timeline = new Timeline(timelineDOM, this.commentHistory);
      this.timeline.init(timeLineConfig);
      this.scripts.push(this.timeline);
    }

    this.subscription.add(this.linearId.subscribe({
      next: (linearId: string) => {
        this.targetLinearId = linearId;
        this.getCommentHistory();
      }
    }));

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.linearId && this.timeline) {
      this.getCommentHistory();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  getCommentHistory(): void {
    const internalSeleted = this.seletedFilter === 'internal' ? true : false;
    const newSubscription = this.projectsService.getComments(this.targetLinearId, internalSeleted)
      .subscribe({
        next: (commentHistory: Comment[]) => {
          this.commentHistory = commentHistory.map((comment: Comment) => {
            const customTitle = comment.isInternal ? '<span class="internal-marker">Internal</span> <br/>'
              + comment.fromEmailId : comment.fromEmailId;
            return {
              timestamp: comment.date,
              title: customTitle,
              content: comment.comment
            };
          });
          this.timeline.update(this.commentHistory);
          // this.timeline.update();
        }
      });

    this.subscription.add(newSubscription);
  }

  onKey(value: string): void {
    this.commentInput = value;
    (value && value.length > 0)
      ? this.submitButtonDisabled = false
      : this.submitButtonDisabled = true;
  }

  submitButtonClick(): void {
    const newSubscription = this.projectsService.addComment(this.targetLinearId, this.commentInput, this.commentLevel,
      this.isInternalComment)
      .subscribe(
        commentRes => {
          const newComment = {
            timestamp: commentRes.modifiedTime,
            title: commentRes.fromEmailId,
            content: commentRes.comment
          };
          this.isInternalComment = true;
          this.commentHistory.push(newComment);
          this.timeline.update(this.commentHistory);
        }
      );

    this.subscription.add(newSubscription);
  }

  /**
   * update the comment visibility status based on checked radio button
   * @param event event
   */
  public updateCommentVisibility(event): void {
    this.isInternalComment = event.target.value === 'internal' ? true : false;
  }


  /**
   * selected filter value is set and get history function is called
   * to fetch the data based on the selected filter
   * @param selectedPill selected filter
   */
  public onFilterChanged(selectedPill): void {
    switch (selectedPill) {
      case 'internal':
        this.seletedFilter = 'internal';
        break;
      case 'external':
        this.seletedFilter = 'external';
        break;
    }
    this.getCommentHistory();
  }
}

