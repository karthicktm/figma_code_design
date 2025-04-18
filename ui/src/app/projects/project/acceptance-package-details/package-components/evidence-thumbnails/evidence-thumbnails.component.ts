import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EvidenceDetails } from 'src/app/projects/projects.interface';
import { DataSourceTool } from './evidence-thumbnail/evidence-thumbnail.component';
@Component({
  selector: 'app-evidence-thumbnails',
  templateUrl: './evidence-thumbnails.component.html',
  styleUrls: ['./evidence-thumbnails.component.less']
})

export class EvidenceThumbnailsComponent {

  constructor() { }

  @Input() allEvidenceDetails: EvidenceDetails[] = [];
  @Input() withCheckbox: boolean | ((evidence: EvidenceDetails) => boolean) = false;
  @Input() zoomLevel = 3;
  @Input() dataSourceTool: DataSourceTool;
  @Output() selectedThumbnail = new EventEmitter<string[]>();
  @Output() switchToEvidence = new EventEmitter<string>();
  selectedThumbnailsArray: string[] = [];

  evidenceWithCheckbox(evidence: EvidenceDetails): boolean {
    if (typeof this.withCheckbox === 'function') return this.withCheckbox(evidence);
    return this.withCheckbox;
  }

  onSelectEvidence(selectedId: string): void {
    this.switchToEvidence.emit(selectedId);
  }

  onSelectedThumbnail(event: { internalId: string, checked: boolean }): void {
    // if checked and not in array add it, else remove it
    if (event.checked && !this.selectedThumbnailsArray.includes(event.internalId)) {
      this.selectedThumbnailsArray.push(event.internalId);
    }
    if (!event.checked && this.selectedThumbnailsArray.includes(event.internalId)) {
      this.selectedThumbnailsArray = this.selectedThumbnailsArray.filter(id => id !== event.internalId);
    }
    this.selectedThumbnail.emit(this.selectedThumbnailsArray);
  }
}
