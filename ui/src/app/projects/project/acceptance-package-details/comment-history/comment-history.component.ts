import { catchError, map } from 'rxjs/operators';
import { Component, ComponentRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { CommentsEntry, CustomerAcceptanceStatus, UserSession } from 'src/app/projects/projects.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { AddCommentDialogComponent } from '../add-comment-dialog/add-comment-dialog.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { AcceptancePackageService } from '../../acceptance-package.service';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

export enum CommentLevel {
  evidence = 'evidence',
  package = 'package',
  lineItem = 'lineitem',
}

export enum EvidenceLevel {
  milestone = 'milestone',
  package = 'package',
  lineItem = 'lineitem',
}

export interface CommentContext {
  name: string,
  commentLevel?: CommentLevel,
  evidenceLevel?: EvidenceLevel,
  evidenceId?: string, 
  lineItemUniqueId?: string,
  packageId?: string,
  packageStatus: CustomerAcceptanceStatus | string,
}

@Component({
  selector: 'app-comment-history',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
  ],
  templateUrl: './comment-history.component.html',
  styleUrls: ['./comment-history.component.less']
})

export class CommentHistoryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() packageId: string;
  @Input() lineItemUniqueId?: string;
  @Input() commentLevel = CommentLevel.evidence;
  @Input() evidenceId?: string;
  @Input() evidenceLevel?: EvidenceLevel;
  @Input() internalCommentInput = false;
  @Input() packageStatus: string;

  maxLength = 3000;
  commentInput = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(this.maxLength)] });
  isNewCommentAllowed: boolean = false;
  comments: Observable<CommentsEntry[]>;
  userSession: UserSession;
  isSubmitButtonClicked = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private projectsService: ProjectsService,
    private packageService: AcceptancePackageService,
    private dialogService: DialogService,
    private sessionStorage: SessionStorageService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.userSession = this.sessionStorage.get(CacheKey.userSession);
    if (this.commentLevel === CommentLevel.package) {
      this.isNewCommentAllowed = false;
    }
    else if (
      (this.userSession.roleType.find(r => r === 'Ericsson Contributor' || r === 'Project Admin')
        && this.packageStatus === CustomerAcceptanceStatus.CustomerNew 
        || this.packageStatus === CustomerAcceptanceStatus.CustomerReworked 
        || this.packageStatus === CustomerAcceptanceStatus.Ready)
    ) {
      this.isNewCommentAllowed = true;
    }
    else if (
      this.userSession.roleType.find(r => r === 'Customer Approver')
      && this.packageStatus === CustomerAcceptanceStatus.CustomerNewPendingApproval
      || this.packageStatus === CustomerAcceptanceStatus.CustomerReworkedPendingApproval
    ) {
      const userActionInProgressSubscription = this.packageService.currentPackageUserActionInProgress.subscribe({
        next: (isInProgress) => this.isNewCommentAllowed = isInProgress,
      });
      this.subscription.add(userActionInProgressSubscription);
    }
    else {
      this.isNewCommentAllowed = false;
    }
    this.setComments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.evidenceId
      && changes.evidenceId.currentValue !== changes.evidenceId.previousValue
    ) {
      this.setComments();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setComments(): void {
    let getCommentsByIds;
    if (this.commentLevel === CommentLevel.evidence) {
      if (this.evidenceLevel === EvidenceLevel.package) {
        getCommentsByIds = this.projectsService.getAllPackageEvidenceComments(this.evidenceId);
      } else if (this.evidenceLevel === EvidenceLevel.lineItem) {
        getCommentsByIds = this.projectsService.getAllEvidenceComments(this.packageId, this.evidenceId);
      } else if (this.evidenceLevel === EvidenceLevel.milestone) {
        getCommentsByIds = this.projectsService.getAllEvidenceComments(this.packageId, this.evidenceId);
      } else {
        console.error('Error retrieving evidence comments on %s level', this.evidenceLevel);
      }
    } else if (this.commentLevel === CommentLevel.lineItem) {
      getCommentsByIds = this.projectsService.getAllLineItemComments(this.packageId, this.lineItemUniqueId);
    } else if (this.commentLevel === CommentLevel.package) {
      getCommentsByIds = this.projectsService.getAllPackageComments(this.packageId);
    }

    if (getCommentsByIds) {
      this.comments = getCommentsByIds.pipe(
        map((commentsResp: CommentsEntry[]) =>
          commentsResp.filter(commentEntry => !!commentEntry.comment && commentEntry.comment.length > 0)
        ),
        catchError((err: HttpErrorResponse) => {
          let errorMessage = 'Error retrieving comments';
          if (this.evidenceId) {
            errorMessage = errorMessage.concat(` of evidence ${this.evidenceId}`);
          } else if (this.lineItemUniqueId) {
            errorMessage = errorMessage.concat(` of line item ${this.lineItemUniqueId}`);
          }
          errorMessage = errorMessage.concat(` of package ${this.packageId}`);
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            this.notificationService.showNotification({
              title: errorMessage,
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            }, true);
          } else {
            this.notificationService.showNotification({
              title: errorMessage,
              description: 'Click to open the FAQ doc for further steps.'
            }, true);
          }
          console.error(errorMessage);
          return [];
        })
      )
    } else {
      this.comments = of([]);
    }
  }

  addNew(): void {
    const dialogRef = this.dialogService.createDialog(
      AddCommentDialogComponent,
    );
    const dialogSubscription = dialogRef.instance.dialogResult.subscribe(result => {
      if (!!result.comment) {
        this.submitComment(result.comment, dialogRef);
      }
    });

    this.subscription.add(dialogSubscription);
  }

  submitComment(comment: string, newCommentDialogRef?: ComponentRef<AddCommentDialogComponent>): void {
    this.isSubmitButtonClicked = true;
    let addCommentByIds;
    if (this.commentLevel === CommentLevel.evidence) {
      addCommentByIds = this.projectsService.addEvidenceComment(this.evidenceId, comment);
    } else if (this.commentLevel === CommentLevel.lineItem) {
      addCommentByIds = this.projectsService.addLineItemComment(this.lineItemUniqueId, comment);
    } else {
      console.error('Wrong comment level %s', this.commentLevel);
    }

    this.subscription.add(
      addCommentByIds.subscribe({
        next: () => {
          this.setComments();
          this.notificationService.showNotification({
            title: 'Comment added successfully!',
          });

          if (newCommentDialogRef) {
            newCommentDialogRef.instance.dialog.hide();
          } else if (this.commentInput) {
            this.commentInput.reset();
          }
          this.isSubmitButtonClicked = false;
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            this.notificationService.showNotification({
              title: 'Error while adding new comment!',
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            }, true);
          } else {
            this.notificationService.showNotification({
              title: 'Error while adding new comment!',
              description: 'Click to open the FAQ doc for further steps.'
            }, true);
          }
          console.error('Error while adding new comment!');
          this.isSubmitButtonClicked = false;
        }
      })
    );
  }
}
