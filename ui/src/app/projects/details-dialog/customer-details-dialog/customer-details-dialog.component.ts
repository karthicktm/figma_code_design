import { Component, Inject, OnInit } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { ProjectsService } from '../../projects.service';

@Component({
  selector: 'app-customer-details-dialog',
  templateUrl: './customer-details-dialog.component.html',
  styleUrls: ['./customer-details-dialog.component.less']
})
export class CustomerDetailsDialogComponent extends EDSDialogComponent implements OnInit {
  public customerId: string;
  public customerDetails;
  constructor(private projectsService: ProjectsService,
    @Inject(DIALOG_DATA) public inputData: { customerId: string },
  ) {
    super();
    this.customerId = inputData.customerId;
  }

  ngOnInit(): void {
    this.getCustomerByCustomerId();
  }

  public getCustomerByCustomerId(): void {
    this.projectsService.getCustomerByCustomerId(this.customerId).subscribe({
      next: (customerDetails) => {
        this.customerDetails = customerDetails;
      },
      error: (error) => {
        // Do something to handle error
      },
    });
  }
}
