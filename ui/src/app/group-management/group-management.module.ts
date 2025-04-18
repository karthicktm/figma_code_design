import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PortalModule } from '../portal/portal.module';
import { SharedModule } from '../shared/shared.module';
import { GroupManagementRoutingModule } from './group-management-routing.module';
import { GroupFormComponent } from './group-form/group-form.component';
import { GroupListComponent } from './group-list/group-list.component';
import { GroupUserComponent } from './group-user/group-user.component';
import { GroupEditComponent } from './group-edit/group-edit.component';
import { GroupDetailsComponent } from './group-details/group-details.component';
import { GroupCreateDialogComponent } from './group-create-dialog/group-create-dialog.component';

@NgModule({
  declarations: [
    GroupFormComponent,
    GroupEditComponent,
    GroupListComponent,
    GroupUserComponent,
    GroupDetailsComponent,
    GroupCreateDialogComponent
  ],
  imports: [
    CommonModule,
    PortalModule,
    GroupManagementRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class GroupManagementModule { }
