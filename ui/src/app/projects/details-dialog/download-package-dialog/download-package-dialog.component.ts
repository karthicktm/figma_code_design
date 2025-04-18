import { Component, EventEmitter, Inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError, exhaustMap, tap } from 'rxjs/operators';
import { EDSDialogComponent, DIALOG_DATA } from 'src/app/portal/services/dialog.service';
import { PackageEvidencesSize } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';

export interface DownloadOptions {
  selectedStatuses: string[];
  selectedTypes: string[];
  totalSize: number;
}

@Component({
  selector: 'app-download-package-dialog',
  templateUrl: './download-package-dialog.component.html',
  styleUrls: ['./download-package-dialog.component.less']
})
export class DownloadPackageDialogComponent extends EDSDialogComponent {
  statusMap = {
    Approved: ['Customer Approved'],
    Rejected: ['Customer Rejected', 'Customer Rejected-No Action'],
    Pending: ['Customer New', 'Customer Revision', 'Customer New-Pending approval'],
    Reworked: ['Customer Reworked', 'Customer Reworked-Pending approval'],
    'View only': ['Customer Acceptance Not Required']
  };
  acceptanceCategories = [
    'Approved',
    'Rejected',
    'Pending',
    'Reworked',
    'View only'
  ];
  selectedCategories = this.acceptanceCategories;

  types = [
    'Image',
    'Video',
    'Document',
    'Archive'
  ];
  selectedTypes = this.types;

  public loading: boolean;
  public result: EventEmitter<DownloadOptions> = new EventEmitter();
  private internalEvidenceSize: PackageEvidencesSize[];
  private selectedSizeByType;

  constructor(
    @Inject(DIALOG_DATA) public inputData: any,
    private projectService: ProjectsService,
  ) {
    super();
    this.setPackageEvidenceSize();
  }

  onCategoryCheckboxChange(event): void {
    if (event.target.checked) {
      this.selectedCategories.push(event.target.value);
    } else {
      this.selectedCategories = this.selectedCategories.filter((category => category !== event.target.value));
    }

    this.calculateSizeBySelectedCategories();
  }

  onTypeCheckboxChange(event): void {
    if (event.target.checked) {
      this.selectedTypes.push(event.target.value);
    } else {
      this.selectedTypes = this.selectedTypes.filter((type => type !== event.target.value));
    }
  }

  setPackageEvidenceSize(): void {
    const loadingStartFlagging = of(undefined).pipe(
      tap(() => {
        this.loading = true;
      })
    );

    const packageSize = this.projectService.getPackageEvidenceSize(this.inputData.packageId).pipe(
      tap(() => this.loading = false),
      catchError(() => {
        this.loading = false;
        return [];
      })
    );

    loadingStartFlagging.pipe(
      exhaustMap(() => packageSize)
    ).subscribe(sizeInformation => {
      this.internalEvidenceSize = sizeInformation.evidences.map(evidenceType => {
        const mappedStatusList = evidenceType.evidenceStatus.reduce((mappedStatus, currentStatus) => {
          currentStatus.status = Object.entries(this.statusMap).find((entry) => entry[1].find((status) => status === currentStatus.status))?.[0];;
          const found = mappedStatus.find(status => status.status === currentStatus.status);
          if (found) {
            found.size += currentStatus.size;
            found.count += currentStatus.count;
          } else {
            mappedStatus.push(currentStatus);
          }
          return mappedStatus;
        }, []);
        return {
          evidenceType: evidenceType.evidenceType,
          evidenceStatus: mappedStatusList
        };
      });
      this.calculateSizeBySelectedCategories();
    });
  }

  calculateSizeBySelectedCategories(): void {
    const sizeList = {};
    this.internalEvidenceSize.map(item => {
      const sizeBySelectedCategories = item.evidenceStatus.reduce((size, currentStatus) => {
        if (this.selectedCategories.includes(currentStatus.status)) {
          size += currentStatus.size;
        }
        return size;
      }, 0);
      sizeList[item.evidenceType] = sizeBySelectedCategories;
    })
    this.selectedSizeByType = sizeList;
  }

  getSizeByType(type: string): string {
    const size = this.selectedSizeByType[type] || 0;
    return this.projectService.formatBytes(size);
  }

  downloadPackage(): void {
    // map selected categories to target statuses
    const selectedStatuses = this.selectedCategories.flatMap(category => {
      switch (category) {
        case 'Approved':
          return ['CustomerApproved'];
        case 'Rejected':
          return ['CustomerRejected', 'CustomerRejectedNoAction'];
        case 'Pending':
          return ['CustomerNew', 'CustomerRevision', 'CustomerNewPendingApproval'];
        case 'Reworked':
          return ['CustomerReworked', 'CustomerReworkedPendingApproval'];
        case 'View only':
          return ['CustomerAcceptanceNotRequired'];
        default:
          return [];
      }
    });

    const totalSize = Object.entries(this.selectedSizeByType)
      .map((typeSize: [string, number]) => {
        if (this.selectedTypes.includes(typeSize[0])) {
          return typeSize[1];
        } else {
          return 0;
        }
      })
      .reduce((previousValue: number, currentValue: number) => previousValue + currentValue, 0);

    this.result.emit({
      selectedStatuses,
      selectedTypes: this.selectedTypes,
      totalSize: totalSize as number
    });
  }
}
