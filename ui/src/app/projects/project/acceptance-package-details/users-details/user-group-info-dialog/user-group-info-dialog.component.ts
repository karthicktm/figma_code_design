import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { PackageGroup, PackageMemberAction, PackageUser } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-user-group-info-dialog',
  templateUrl: './user-group-info-dialog.component.html',
  styleUrls: ['./user-group-info-dialog.component.less']
})
export class UserGroupInfoDialogComponent extends EDSDialogComponent {
  groupName: string;
  userList: PackageUser[];

  packageMemberAction = PackageMemberAction;

  constructor(
    @Inject(DIALOG_DATA) public inputData: { group: PackageGroup },
  ) {
    super();
    this.groupName = inputData.group.name;
    this.userList = inputData.group.userList;
  }
}
