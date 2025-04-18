import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AppbarComponent } from './foundations/appbar/appbar.component';
import { NavigationComponent } from './foundations/navigation/navigation.component';
import { SearchComponent } from './foundations/search/search.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
  ],
  declarations: [
    AppbarComponent,
    NavigationComponent,
    SearchComponent,
  ],
  exports: [
    AppbarComponent,
    NavigationComponent,
    SearchComponent,
  ]
})
export class PortalModule { }
