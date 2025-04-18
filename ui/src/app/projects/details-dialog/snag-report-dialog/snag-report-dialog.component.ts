import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { EDSDialogComponent } from 'src/app/portal/services/dialog.service';

interface Field {
  columnName: string;
  title: string;
  checked: boolean;
}

interface DialogResult {
  selectedFields: Field[],
  buttonElement: HTMLButtonElement,
}

@Component({
  selector: 'app-snag-report-dialog',
  templateUrl: './snag-report-dialog.component.html',
  styleUrls: ['./snag-report-dialog.component.less']
})
export class SnagReportDialogComponent extends EDSDialogComponent implements OnDestroy {
  public dialogResult: EventEmitter<DialogResult> = new EventEmitter();
  private scripts: Scripts[] = [];
  public reportFields: Field[] = [
     { columnName: 'customer', title: 'Customer', checked: true },
     { columnName: 'project', title: 'Project', checked: true },
     { columnName: 'packageId', title: 'Package Id', checked: true },
     { columnName: 'packageName', title: 'Package name', checked: true },
     { columnName: 'site', title: 'Site', checked: true },
     { columnName: 'packageScope', title: 'Package scope', checked: true },
     { columnName: 'packageFirstSubmissionDateToCustomer', title: 'First submission date to customer', checked: true },
     { columnName: 'packageLastSubmissionDateToCustomer', title: 'Latest submission date to customer', checked: true }
  ];

  onReset(): void {
    this.reportFields.map(field=>{
      field.checked = true;
    });
  }

  updateFieldsSelection(event): void {
    const index = this.reportFields.findIndex((field) => {
      return field.columnName === event.target.id;
    });
    this.reportFields[index].checked = event.target.checked;
  }

  sendRequest(event: MouseEvent): void {
    const targetElement: HTMLButtonElement = event.target as HTMLButtonElement;

    const selectedFields = this.reportFields.filter(function(field){
      return field.checked;
    });
    this.dialogResult.emit({
      selectedFields,
      buttonElement: targetElement,
    });
  }


  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }
}
