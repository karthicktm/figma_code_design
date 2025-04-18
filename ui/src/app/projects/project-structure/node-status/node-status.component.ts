import { Component, input } from '@angular/core';
import AcceptancePackageUtils from '../../project/acceptance-package-utilities';
import { CustomerAcceptanceStatus } from '../../projects.interface';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-node-status',
  standalone: true,
  imports: [
    NgClass,
  ],
  templateUrl: './node-status.component.html',
  styleUrl: './node-status.component.less'
})
export class NodeStatusComponent {
  protected readonly status = input.required<CustomerAcceptanceStatus | string>();

  protected getStatusColor(status: string): string {
    return AcceptancePackageUtils.getStatusColor(status);
  }

  protected getStatus(status: string): string {
    return AcceptancePackageUtils.getStatus(status);
  }
}
