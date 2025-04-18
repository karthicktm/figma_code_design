import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { RelatedEvidence } from 'src/app/projects/projects.interface';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-related-evidences',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './related-evidences.component.html',
  styleUrls: ['./related-evidences.component.less']
})
export class RelatedEvidencesComponent {
  @Input() readonly relatedEvidenceList: Observable<RelatedEvidence[]>;
  readonly noLink = input<boolean>();
  @Output() readonly selectedRelatedEvidence = new EventEmitter<string>();

  onSelectEvidence(evidenceId: string): void {
    this.selectedRelatedEvidence.emit(evidenceId);
  }
}
