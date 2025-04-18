import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { GroupAssociatedPackage } from '../../group-management-interfaces';
import { PartialObserver, Subscription } from 'rxjs';
import { Table } from '@eds/vanilla';
import AcceptancePackageUtils from 'src/app/projects/project/acceptance-package-utilities';
import { PackageLevel } from 'src/app/projects/projects.interface';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { GroupManagementService } from '../../group-management.service';
import { ProjectsService } from 'src/app/projects/projects.service';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';

const maxPkgTableDataSize = 5;

@Component({
  selector: 'app-group-pkg-list-dialog',
  templateUrl: './group-pkg-list-dialog.component.html',
  styleUrls: ['./group-pkg-list-dialog.component.less']
})
export class GroupPkgListDialogComponent extends EDSDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pkgListTable') readonly pkgListTableElementRef: ElementRef<HTMLElement>
  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();

  table: Table;
  pkgListData: GroupAssociatedPackage[] = [];
  groupId?: string;
  groupInternalId?: string;
  projectId?: string;
  userType?: string;
  userId?: string;

  constructor(
    @Inject(DIALOG_DATA) public inputData: { pkgListData: GroupAssociatedPackage[], groupId?: string, groupInternalId?: string, projectId?: string, userType?: string, userId?: string },
    private groupManagementService: GroupManagementService,
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
    private datePipe: NullStringDatePipe
  ) {
    super();
    this.pkgListData = inputData.pkgListData;
    this.groupId = inputData.groupId;
    this.groupInternalId = inputData.groupInternalId;
    this.projectId = inputData.projectId;
    this.userType = inputData.userType;
    this.userId = inputData.userId;
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let columnsProperties = [
      {
        key: 'projectName',
        title: 'Project name'
      },
      {
        key: 'customerName',
        title: 'Customer name'
      },
      {
        key: 'packageName',
        title: 'Package name'
      },
      {
        key: 'packageScope',
        title: 'Package scope',
      },
      {
        key: 'multiLevel',
        title: 'Package level',
        onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
          if (cellData !== undefined) {
            if (cellData) td.replaceChildren(document.createTextNode(PackageLevel.MultiLevel));
            else td.replaceChildren(document.createTextNode(PackageLevel.SingleLevel));
          }
        }
      },
      {
        key: 'submittedby',
        title: 'Submitted by',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any, rowIndex: number): void => {
          const row = this.pkgListData[rowIndex];
          td.replaceChildren(`${row.submittedBy ? row.submittedBy + ' (' + row.submittedByEmail + ')' : 'NA'}`);
        }
      },
      {
        key: 'submittedDate',
        title: 'Date of Submission',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          TableUtils.formatDateCell(this.datePipe, cellData, td);
        },
      },
      {
        key: 'status',
        title: 'Overall status',
        cellClass: 'cell-nowrap',
        onCreatedCell: (td: HTMLTableCellElement, cellData): void => {
          td.replaceChildren(AcceptancePackageUtils.getStatusTag(cellData, { big: true }));
        },
      }
    ];

    const pkgListTableDOM = this.pkgListTableElementRef.nativeElement as HTMLElement;
    // Do not show Date of submission column if user type is Group
    if (this.userType === 'Group' || this.groupId) {
      columnsProperties = columnsProperties.filter(item => item.key !== 'submittedDate');
    }
    if (pkgListTableDOM) {
      const table = new Table(pkgListTableDOM, {
        data: this.pkgListData || [],
        columns: columnsProperties,
      });
      table.init();
      this.table = table;
      this.scripts.push(this.table);
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    super.ngOnDestroy();
  }
  downloadFullList(): void {
    const downloadObserver: PartialObserver<HttpEvent<Blob>> = {
      next: (result => {
        if (result.type === HttpEventType.Response) {
          const contentDisposition = result.headers.get('content-disposition');
          // retrieve the file name and remove potential quotes from it
          const filename = contentDisposition?.split(';')[1].split('filename')[1].split('=')[1].trim()
            .replaceAll('"', '');
          const downloadUrl = window.URL.createObjectURL(result.body);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          link.dispatchEvent(new MouseEvent('click'));
          window.URL.revokeObjectURL(downloadUrl);
          this.notificationService.showLogNotification({
            title: `Package list file: "${filename}" successfully downloaded!`,
          });
        }
      }),
      error: (err: HttpErrorResponse) => {
        const statusMessage = 'Error when downloading the file for associated package list!';
        // push notification for the error message
        this.notificationService.showNotification(
          {
            title: statusMessage,
            description:
              'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
          },
          true
        );
      },
    };

    if (this.groupId) {
      this.groupManagementService.downloadGroupAssociatedPackages(this.groupId).subscribe(downloadObserver);
    } else if (this.userType === 'Group' && this.groupInternalId && this.projectId) {
      this.projectsService.downloadGroupAssociatedPackagesFile(this.projectId, this.groupInternalId).subscribe(downloadObserver);
    } else if (this.userType === 'User' && this.groupInternalId && this.projectId) {
      this.projectsService.downloadUserAssociatedPackagesFile(this.projectId, this.groupInternalId).subscribe(downloadObserver);
    } else if (this.userId) {
      this.projectsService.downloadSoleUserPackagesFile(this.userId).subscribe(downloadObserver);
    } 
  }

  onClose(): void {
    this.dialog.hide();
  }

  isDownloadMorePackages(): boolean {
    return this.pkgListData.length === maxPkgTableDataSize;
  }
}
