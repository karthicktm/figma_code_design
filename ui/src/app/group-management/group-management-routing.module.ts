import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupListComponent } from './group-list/group-list.component';
import { GroupEditComponent } from './group-edit/group-edit.component';

const routes: Routes = [
  {
    path: '',
    component: GroupListComponent,
    data: {
      title: undefined,
      metaTitle: 'Ericsson Customer Acceptance - Group management',
    },
  },
  {
    path: ':id',
    component: GroupEditComponent,
    data: {
      // To overwrite the parent title
      title: undefined,
      metaTitle: 'Ericsson Customer Acceptance - Group management',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupManagementRoutingModule { }
