import { Component, computed, input } from '@angular/core';
import { catchError, Observable, tap } from 'rxjs';
import { EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { GroupUser } from '../group-management-interfaces';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-group-users-dialog',
  standalone: true,
  imports: [
    AsyncPipe,
  ],
  templateUrl: './group-users-dialog.component.html',
  styleUrl: './group-users-dialog.component.less'
})
export class GroupUsersDialogComponent extends EDSDialogComponent {
  readonly groupName = input<string>();
  readonly groupUsers = input.required<Observable<GroupUser[]>>();
  readonly groupUsersLoading = computed(() => {
    this.loading = true;
    return this.groupUsers().pipe(
      tap(() => this.loading = false),
      catchError(err => {
        this.loading = false;
        return err;
      }),
    );
  });

  loading = false;
}
