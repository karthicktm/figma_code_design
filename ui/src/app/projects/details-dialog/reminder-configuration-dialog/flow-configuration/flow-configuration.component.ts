import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthorizationService, ToolPermission } from 'src/app/auth/authorization.service';
import { PackageConfiguration } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-flow-configuration',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './flow-configuration.component.html',
  styleUrl: './flow-configuration.component.less'
})
export class FlowConfigurationComponent implements OnInit {
  protected readonly configuration = input<PackageConfiguration>();

  protected readonly infoText= 'To modify acceptance flow please raise a support ticket';

  ToolPermission = ToolPermission;
  eSupportTicketLink: string;

  constructor(
    private authorizationService: AuthorizationService,
  ) { }

  ngOnInit(): void {
    this.eSupportTicketLink = localStorage.getItem('eSupportTicketLink') || '';
  }

  isUserAuthorized(permission: string): Observable<boolean> {
    return this.authorizationService.isUserAuthorized(permission);
  }
}
