import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { PackageDetails, PackagesEntry } from 'src/app/projects/projects.interface';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-package-info-dialog',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
  ],
  templateUrl: './package-info-dialog.component.html',
  styleUrl: './package-info-dialog.component.less'
})
export class PackageInfoDialogComponent extends EDSDialogComponent {
  constructor(
    @Inject(DIALOG_DATA) public inputData: PackagesEntry,
  ) {
    super();
  }

}
