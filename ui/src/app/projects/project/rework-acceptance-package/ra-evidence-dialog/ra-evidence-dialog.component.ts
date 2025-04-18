import { Component, EventEmitter, Inject } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { DataSourceTool } from '../../acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnail/evidence-thumbnail.component';
import { Evidence } from 'src/app/projects/projects.interface';
import { FormControl, Validators } from '@angular/forms';

export interface Data {
  evidence: Evidence,
  lineItemId: string,
  newEvidences: Evidence[],
  packageId: string,
  projectId: string,
  resultHandler: (result: Evidence[]) => void,
  openExpandedViewHandler: (evidenceId: string, sourceTool: DataSourceTool) => void,
}

@Component({
  selector: 'app-ra-evidence-dialog',
  templateUrl: './ra-evidence-dialog.component.html',
  styleUrls: ['./ra-evidence-dialog.component.less'],
})
export class RaEvidenceDialogComponent extends EDSDialogComponent {
  packageId: string;
  projectId: string;
  evidence: Evidence;
  newEvidences: Evidence[];
  selectedEvidencesControl: FormControl<Evidence[]> = new FormControl(
    [],
    {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(1),
      ],
    }
  );
  DataSourceTool = DataSourceTool;
  public dialogResult: EventEmitter<string[]> = new EventEmitter();
  private selectedEvidenceIds: string[] = [];

  constructor(
    @Inject(DIALOG_DATA) public inputData: Data,
  ) {
    super();

    this.packageId = inputData.packageId;
    this.projectId = inputData.projectId;
    this.evidence = inputData.evidence;
    this.newEvidences = inputData.newEvidences;
  }

  onClose():void{
    this.dialog.hide();
    this.dialogResult.emit();
  }

  maximizeScreen(evidenceId: string, dataSourceTool: DataSourceTool): void {
    if (this.inputData.openExpandedViewHandler) {
      this.inputData.openExpandedViewHandler(evidenceId, dataSourceTool);
    }
  }

  onCheckMarkChange(event: string[]): void {
    this.selectedEvidenceIds = event || [];
    const selectedEvidences = this.selectedEvidenceIds.map(id => this.newEvidences.find(evidence => evidence.internalId === id)).reverse();
    this.selectedEvidencesControl.patchValue(selectedEvidences);
  }

  onLinkEvidences(): void {
    this.inputData.resultHandler(this.selectedEvidencesControl.value);
    this.dialog.hide();
  }
}
