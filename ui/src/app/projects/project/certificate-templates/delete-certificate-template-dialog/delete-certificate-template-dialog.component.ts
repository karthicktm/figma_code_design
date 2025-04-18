import { Component, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-delete-certificate-template-dialog',
  standalone: true,
  imports: [],
  templateUrl: './delete-certificate-template-dialog.component.html',
  styleUrl: './delete-certificate-template-dialog.component.less'
})
export class DeleteCertificateTemplateDialogComponent extends EDSDialogComponent implements OnDestroy {
  @Output() dialogResult: EventEmitter<boolean> = new EventEmitter();

  title = 'Delete certificate template';
  message = 'Are you sure you want to delete this template?';

  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      name: string,
    },
  ) {
    super();
    if (inputData.name) {
      this.message = `Are you sure you want to delete the certificate template '${inputData.name}'?`;
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dialogResult.complete();
  }

  public onConfirmDeletion(): void {
    this.dialogResult.emit(true);
  }
}
