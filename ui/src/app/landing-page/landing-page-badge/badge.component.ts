import { Component, effect, input } from '@angular/core';
import { UserSession } from 'src/app/projects/projects.interface';
import { LandingPageService } from '../landing-page.service';
import { Observable } from 'rxjs';
import { RoleType } from 'src/app/group-management/group-management-interfaces';
import { AsyncPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [AsyncPipe, NgClass],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.less'
})
export class BadgeComponent {
  protected userSession = input.required<UserSession>();
  protected getPendingCounts: Observable<{ pendingPackages: number, pendingCertificates: number }>;

  constructor(private landingPageService: LandingPageService) {
    effect(() => {
      const [role] = this.userSession().roleType.filter(item => item.includes(RoleType.CustomerApprover));
      this.getPendingCounts = (this.landingPageService.getPendingPackageAndCertificateCount(role.split(' ').join('')).pipe());
    });
  }

}
