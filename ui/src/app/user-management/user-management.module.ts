import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementComponent } from './user-management/user-management.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DeleteUserConfirmDialogComponent } from './delete-user-confirm-dialog/delete-user-confirm-dialog.component';



@NgModule({
  declarations: [UserManagementComponent, DeleteUserConfirmDialogComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class UserManagementModule { }
