import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Evidence } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-evidences-carousel',
  templateUrl: './evidences-carousel.component.html',
  styleUrls: ['./evidences-carousel.component.less'],
})
export class EvidencesCarouselComponent {
  @Input() packageId: string;
  @Input() selectedEvidence: Evidence;
  @Input() isPackageCompleted: boolean;
  @Input() packageStatus: string;
  @Input() evidences: Evidence[];
  @Input() totalRecords: number;
  @Input() offset: number;
  @Input() limit: number;
  @Output() pageChange: EventEmitter<'next'|'prev'> = new EventEmitter();

  get pageIndex(): number {
    return this.evidences.findIndex(evidence => this.selectedEvidence.internalId === evidence.internalId);
  }

  get pageNumber(): number {
    return this.pageIndex + 1 + this.offset;
  }

  onNext(): void {
    if (this.pageIndex >= this.evidences.length -1 && this.totalRecords > this.limit) {
      this.pageChange.emit('next');
    }
    else {
      const newIndex = this.pageIndex + 1;
      if (newIndex > this.totalRecords - 1) {
        this.selectedEvidence = this.evidences.at(0);
      } else {
        this.selectedEvidence = this.evidences.at(newIndex);
      }
    }
  }

  onPrevious(): void {
    if (this.pageIndex <= 0 && this.totalRecords > this.limit) {
      this.pageChange.emit('prev');
    }
    else {
      this.selectedEvidence = this.evidences.at(this.pageIndex -1);
    }
  }
}
