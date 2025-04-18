import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { EDSDialogComponent, DIALOG_DATA } from 'src/app/portal/services/dialog.service';
import { ProjectOnboardingService } from 'src/app/project-onboarding/project-onboarding.service';
import { OPSUser } from 'src/app/user-management/user-management.interface';

interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
}

@Component({
  selector: 'app-user-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './user-details-dialog.component.html',
  styleUrl: './user-details-dialog.component.less'
})
export class UserDetailsDialogComponent extends EDSDialogComponent implements OnInit {
  loading = signal(true);
  userDetails: Observable<UserDetails>;

  constructor(
    @Inject(DIALOG_DATA) public userId: string,
    private projectOnboardingService: ProjectOnboardingService,
  ) {
    super();
  }

  ngOnInit(): void {
    const limit: number = 1;
    const offset: number = 0;
    const filterAttr = { userId: this.userId };
    this.userDetails = this.projectOnboardingService.getOPSUsers(limit, offset, filterAttr).pipe(
      tap(() => this.loading.set(false)),
      map(users => users.results.find(user => {
        return user.userId.toUpperCase() === this.userId.toUpperCase();
      })),
      map((user: OPSUser) => ({
        firstName: user.userFirstName,
        lastName: user.userLastName,
        email: user.userEmail,
      })),
      catchError(() => {
        this.loading.set(false);
        return of(undefined);
      }),
    );
  }


}
