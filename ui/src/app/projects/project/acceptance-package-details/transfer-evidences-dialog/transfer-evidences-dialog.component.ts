import { CommonModule } from '@angular/common';
import { Component, Inject, viewChild, ElementRef, effect, OnDestroy, signal, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { TabGroup } from '@eds/vanilla';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { EvidenceType, TransferPackageReportType } from 'src/app/projects/projects.interface';
import { TransferEvidencesTableComponent } from './transfer-evidences-table/transfer-evidences-table.component';
import { TransferReportsTableComponent } from './transfer-reports-table/transfer-reports-table.component';

interface DialogData {
  packageId: string,
  submit: (packageId: string, evidenceIds?: string[], selectedReports?: TransferPackageReportType[]) => Observable<string>,
}

interface TabConfig {
  name: string;
  type: (EvidenceType | 'PackageReport')[];
  selected: string[];
}

@Component({
  selector: 'app-transfer-evidences-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TransferEvidencesTableComponent,
    TransferReportsTableComponent,
  ],
  templateUrl: './transfer-evidences-dialog.component.html',
  styleUrl: './transfer-evidences-dialog.component.less'
})
export class TransferEvidencesDialogComponent extends EDSDialogComponent implements OnDestroy {
  public dialogResult: EventEmitter<boolean> = new EventEmitter();
  readonly tabsElementRef = viewChild.required<ElementRef<HTMLElement>>('tabs');

  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();

  tabGroup: TabGroup;
  tabConfigs: TabConfig[] = [
    { name: 'Documents', type: [EvidenceType.Document, EvidenceType.Archive], selected: [] },
    { name: 'Images', type: [EvidenceType.Image], selected: [] },
    { name: 'Videos', type: [EvidenceType.Video], selected: [] },
    { name: 'Package reports', type: ['PackageReport'], selected: [] },
  ];
  targetTab: string;

  submitting = signal<boolean>(false);

  constructor(
    @Inject(DIALOG_DATA) public inputData: DialogData,
  ) {
    super();
    effect(() => {
      if (!this.tabGroup) {
        const tabsDom = this.tabsElementRef().nativeElement;
        if (tabsDom) {
          this.tabGroup = new TabGroup(tabsDom);
          this.tabGroup.init();
          this.scripts.push(this.tabGroup);
          const firstTab = tabsDom.querySelector('.title');
          if (firstTab && firstTab instanceof HTMLDivElement) firstTab.focus();
        }
      }
      this.targetTab = this.tabConfigs[0].name;
      this.openTab(this.targetTab);
    });
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    this.subscription.unsubscribe();
  }

  get selectedCount(): number {
    let count = 0;
    this.tabConfigs.forEach(tab => count += tab.selected.length)

    return count;
  }

  openTab(name: string): void {
    // If the same tab is clicked, no need to refresh the table
    if (name === this.targetTab) {
      return;
    }

    this.targetTab = name;
  }

  onSelect(selected: string[], tabName: string): void {
    const tab = this.tabConfigs.find(tab => tab.name === tabName);
    if (tab) tab.selected = selected;
  }

  public onCancel(): void {
    this.dialogResult.emit(false);
    this.dialog.hide();
  }

  onSubmit(): void {
    this.submitting.set(true);
    const selectedEvidences = [];
    this.tabConfigs.filter(tab => !tab.type.includes('PackageReport')).forEach((tab => selectedEvidences.push(...tab.selected)));

    const selectedReports = this.tabConfigs.find(tab => tab.type.includes('PackageReport'))?.selected as TransferPackageReportType[];

    this.subscription.add(this.inputData.submit(this.inputData.packageId, selectedEvidences, selectedReports).subscribe({
      next: () => {
        this.submitting.set(false);

        this.dialogResult.emit(true);
        this.dialog.hide();
      },
      error: () => {
        this.submitting.set(false);
      },
    }));

  }
}
