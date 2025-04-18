import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { DIALOG_DATA, EDSDialogComponent } from 'src/app/portal/services/dialog.service';
import { EmailNotificationRecipientTypes, EmailNotificationRequest } from '../../projects.interface';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Table } from '@eds/vanilla';
import { updateNoDataRowInTable } from 'src/app/shared/table-utilities';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ComponentService } from 'src/app/shared/component.service';
import { RecipientTypesComponent } from './recipient-types/recipient-types.component';

@Component({
  selector: 'app-email-notification-configuration-dialog',
  templateUrl: './email-notification-configuration-dialog.component.html',
  styleUrls: ['./email-notification-configuration-dialog.component.less']
})
export class EmailNotificationConfigurationDialogComponent extends EDSDialogComponent implements AfterViewInit, OnDestroy {
  notifications: Observable<EmailNotificationRequest[]>;
  loading: boolean;
  errorOnLoading: boolean;
  tableData: EmailNotificationRequest[] = [];
  @ViewChild('emailNotifyCfgTbl')
  readonly emailNotifyCfgTblRef: ElementRef<HTMLElement>;
  tableHeightStyleProp = 'calc(100vh - 450px - 32px)';
  isDataChanged: boolean = false;
  isSaving = signal<boolean>(false);
  emailNotifyCfgTable: Table;
  listenerMap: Map<Element, any> = new Map();
  emailCfgColumns = [
    {
      key: 'notificationName',
      title: 'Notification name',
      sort: 'none',
      cellClass: 'name-cell',
    },
    {
      key: 'recipients',
      title: 'Recipients',
      sort: 'none',
      onCreatedCell: (td: HTMLTableCellElement, cellData: EmailNotificationRecipientTypes[], index: number): void => {
        if (Array.isArray(cellData)) {
          const hostElement = document.createElement('div');
          td.replaceChildren(hostElement);
          const recipientTypesComponent = this.componentService.createComponent(RecipientTypesComponent, hostElement);
          const rowData = this.tableData.at(index);
          recipientTypesComponent.setInput('id', rowData.notificationId.notificationId);
          recipientTypesComponent.instance.value.set(cellData);
          recipientTypesComponent.instance.value.subscribe(value => {
            rowData.recipients = value
            this.isDataChanged = true;
          });
        }
      }
    },
    {
      key: 'isActive',
      title: 'Is active',
      sort: 'none',
      onCreatedCell: (td: HTMLTableCellElement, cellData: boolean): void => {
        this.addSwitchInCell(td, cellData, 'isActive');
      }
    },

  ]

  constructor(
    @Inject(DIALOG_DATA) public data: {
      notifications: Observable<EmailNotificationRequest[]>
    },    
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
    private componentService: ComponentService,
  ) {
    super();

    this.loading = true;
    this.errorOnLoading = false;
    this.notifications = data.notifications;

    data.notifications.pipe(
      tap((data: EmailNotificationRequest[]) => {
        this.tableData = data;
        this.loading = false;
        this.errorOnLoading = false;

        if (this.emailNotifyCfgTable) {
          this.emailNotifyCfgTable.dom.table.style.display = 'inline-block';
          this.emailNotifyCfgTable.update(data);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        this.errorOnLoading = true;
        let errorMessage = '';

        const tableDOM = this.emailNotifyCfgTblRef.nativeElement;
        tableDOM.style.display = 'none';

        if (error.error instanceof ErrorEvent && this.emailNotifyCfgTable) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
          updateNoDataRowInTable(this.emailNotifyCfgTable, 'No data found.');
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
          if (
            error.status === HttpStatusCode.BadGateway ||
            error.status === HttpStatusCode.ServiceUnavailable ||
            !navigator.onLine
          ) {
            // keep old data received from server, no op
          } else if (this.emailNotifyCfgTable) {
            updateNoDataRowInTable(this.emailNotifyCfgTable, 'No data found.');
          }
        }

        return errorMessage;
      })
    ).subscribe();
  }

  addSwitchInCell(td: HTMLTableCellElement, cellData: any, dataType: string): void {
    const label = document.createElement('label');
    label.className = 'switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('datatype', dataType);
    label.appendChild(input);
    if (cellData) { input.checked = true; }

    const i = document.createElement('i');
    i.className = 'ball';
    label.appendChild(i);

    const span = document.createElement('span');
    span.setAttribute('data-enabled', 'Yes');
    span.setAttribute('data-disabled', 'No');
    label.appendChild(span);

    while (td.firstChild) {
      td.removeChild(td.lastChild);
    }

    td.appendChild(label);
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();

    const tableDOM = this.emailNotifyCfgTblRef.nativeElement;
    const table = new Table(tableDOM, {
      data: this.tableData,
      columns: this.emailCfgColumns,
      resize: true,
      sortable: true,
      height: this.tableHeightStyleProp,
      onCreatedRow: (tr: HTMLTableRowElement, rowData: EmailNotificationRequest): void => {
        tr.querySelectorAll('.switch input').forEach(switchInput => {
          const eventHandler = (event): void => {
            const decision = (event.target as HTMLInputElement).checked;
            this.updateDecision(rowData, decision, event);
          };

          switchInput.addEventListener('click', eventHandler);
          this.listenerMap.set(switchInput, eventHandler);
        })
      }
    });

    table.init();
    this.emailNotifyCfgTable = table;

    if (this.errorOnLoading) {
      tableDOM.style.display = 'none';
    } else {
      tableDOM.style.display = 'inline-block';
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();

    this.listenerMap.forEach((listener, element) => {
      element.removeEventListener('click', listener);
    });

    this.listenerMap.clear();
  }

  updateDecision(rowData: EmailNotificationRequest, decision: boolean, event: any): void {
    const dataType = (event.target as HTMLInputElement).getAttribute('datatype');
    let rowUpdated = false;
    const notifyCfg = this.tableData.find(row => row.notificationId === rowData.notificationId);

    if (notifyCfg) {
      if (dataType === 'isActive') {
        notifyCfg.isActive = decision;
        rowUpdated = true;
      }
    }

    if (rowUpdated) {
      this.isDataChanged = true;
    }
  }

  onSubmit(): void {
    this.isSaving.set(true);
    this.networkRollOutService.saveEmailNotificationConfiguration(this.tableData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.dialog.hide();
        this.notificationService.showNotification({title: 'Update successful', description: 'Email notifications updated successfully.'});
      },
      error: (() => {
        this.isSaving.set(false);
        this.notificationService.showNotification({
          title: `Error while saving configuration!`,
          description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
        }, true);
      })
    });
  }
}
