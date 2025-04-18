import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationManagementComponent } from './configuration-management.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [ConfigurationManagementComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class ConfigurationManagementModule { }
