import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';

@Component({
  selector: 'app-delete-config-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './delete-config-confirm-dialog.component.html',
  styleUrl: './delete-config-confirm-dialog.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfigConfirmDialogComponent extends EDSDialogComponent {
  public dialogResult: EventEmitter<boolean> = new EventEmitter();

  configKey: string;

  constructor(
    @Inject(DIALOG_DATA) public inputData: { configKey: string },
  ) {
    super();
    this.configKey = inputData.configKey;
  }

  public onSubmit(): void {
    this.dialogResult.emit(true);
  }

  public onCancel(): void {
    this.dialogResult.emit(false);
  }
}
