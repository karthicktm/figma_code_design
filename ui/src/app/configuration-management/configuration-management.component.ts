import {
  Component,
  ViewChild,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { NotificationService } from 'src/app/portal/services/notification.service';
import {
  Configuration,
  ConfigurationResponse,
  ConfigurationSearchModel,
  NewConfiguration,
  UpdateConfiguration,
} from './configuration.interface';
import { ConfigurationService } from './configuration.service';
import { Observable, Subscription } from 'rxjs';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { HttpStatusCode } from '@angular/common/http';
import TableUtils from '../projects/project/acceptance-package-details/table-utilities';
import { DeleteConfigConfirmDialogComponent } from './delete-config-confirm-dialog/delete-config-confirm-dialog.component';
import { DialogService } from '../portal/services/dialog.service';
import { FilterSortConfiguration, TableOptions, TableServerSidePaginationComponent } from '../shared/table-server-side-pagination/table-server-side-pagination.component';

@Component({
  selector: 'app-configuration-management',
  templateUrl: './configuration-management.component.html',
  styleUrls: ['./configuration-management.component.less'],
})
export class ConfigurationManagementComponent
  implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  @ViewChild(TableServerSidePaginationComponent) private readonly configTableRef!: TableServerSidePaginationComponent;
  configurationForm: UntypedFormGroup;
  private scripts: Scripts[] = [];
  private eventAbortController = new AbortController();
  configurationList: Configuration[];
  isEdit: boolean = false;
  tableHeightStyleProp = 'calc(100vh - 305px)';
  filterSortColumns = {
    key: { columnName: 'Key', searchText: '', sortingIndex: 0, sortingOrder: '' },
    value: { columnName: 'Value', searchText: '', sortingIndex: 0, sortingOrder: '' },
    isSoftDeleted: { columnName: 'Is soft deleted', searchText: '', sortingIndex: 0, sortingOrder: '', options: ['TRUE', 'FALSE'] },
    createdBy: { columnName: 'Created By', searchText: '', sortingIndex: 0, sortingOrder: '' },
    createdDate: { columnName: 'Created Date', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedBy: { columnName: 'Last modified by', searchText: '', sortingIndex: 0, sortingOrder: '' },
    lastModifiedDate: { columnName: 'Last modified date & time', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
  };
  columnsProperties = [
    {
      key: 'key',
      title: this.filterSortColumns.key.columnName,
    },
    {
      key: 'value',
      title: this.filterSortColumns.value.columnName,
      cellClass: 'detail-overflow',
    },
    {
      key: 'isSoftDeleted',
      title: this.filterSortColumns.isSoftDeleted.columnName,
      onCreatedCell: (td: HTMLTableCellElement, cellData: boolean): void => {
        const kdb = document.createElement('kbd');
        kdb.classList.add(
          'tag', 'big',
        );
        if (!cellData) {
          kdb.appendChild(document.createTextNode('FALSE'));
          kdb.classList.add('green');
        } else {
          kdb.appendChild(document.createTextNode('TRUE'));
          kdb.classList.add('red');
        }
        td.replaceChildren(kdb);
      }
    },
    {
      key: 'createdBy',
      title: this.filterSortColumns.createdBy.columnName,
      cellClass: 'column-created-by',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
      },
    },
    {
      key: 'createdDate',
      title: this.filterSortColumns.createdDate.columnName,
      cellClass: 'column-date',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td);
      },
    },
    {
      key: 'lastModifiedBy',
      title: this.filterSortColumns.lastModifiedBy.columnName,
      cellClass: 'column-created-by',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.replaceUserIdCellContentWithInfoIcon(cellData, td, this.dialogService, this.eventAbortController);
      },
    },
    {
      key: 'lastModifiedDate',
      title: this.filterSortColumns.lastModifiedDate.columnName,
      cellClass: 'column-date',
      onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
        TableUtils.formatDateCell(this.datePipe, cellData, td, 'y-MM-dd HH:mm:ss');
      },
    },
  ];
  limit = 25;
  offset = 0;
  tableRowNumSelectOptions = [10, 25, 50, 75, 100];
  public fetchPageHandler: (limit: number, offset: number, filterSort: FilterSortConfiguration) => Observable<ConfigurationResponse>;
  tableOptions: TableOptions = {
    actions: true,
    onCreatedActionsCell: (td: HTMLTableCellElement, rowData: Configuration): void => {
      const editButton = document.createElement('button');
      editButton.classList.add('btn-icon', 'edit');
      editButton.setAttribute('title', 'Edit');
      const iconEdit = document.createElement('i');
      iconEdit.classList.add('icon', 'icon-edit');
      editButton.appendChild(iconEdit);
      td.appendChild(editButton);
      this.subscription.add(editButton.addEventListener('click', () => {
        this.isEdit = true;
        this.configurationForm.patchValue({
          keyInput: rowData.key,
          valueInput: rowData.value,
        });
      }));

      if (!rowData.isSoftDeleted) {
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('btn-icon', 'delete');
        deleteButton.setAttribute('title', 'Delete');
        const iconDelete = document.createElement('i');
        iconDelete.classList.add('icon', 'icon-trashcan');
        deleteButton.appendChild(iconDelete);
        td.appendChild(deleteButton);
        this.subscription.add(deleteButton.addEventListener('click', () => {
          this.deleteConfiguration(rowData);
        }));
      }
    },
  };

  constructor(
    private configurationService: ConfigurationService,
    private datePipe: NullStringDatePipe,
    private notificationService: NotificationService,
    private fb: UntypedFormBuilder,
    private dialogService: DialogService,
  ) {
    this.configurationForm = this.fb.group({
      keyInput: ['', [Validators.required, Validators.maxLength(255)]],
      valueInput: ['', [Validators.required, Validators.maxLength(1024)]],
    });
  }

  ngOnInit(): void {
    this.fetchPageHandler = (limit, offset, filterSortConfig): Observable<ConfigurationResponse> => {
      let sortValue = '';
      const filterBody: ConfigurationSearchModel = {};

      if (filterSortConfig) {
        Object.keys(filterSortConfig).forEach(key => {
          if (filterSortConfig[key].sortingOrder !== '') {
            sortValue = `${filterSortConfig[key].sortingOrder}(${key})`;
          }

          if (!filterSortConfig[key].searchText || filterSortConfig[key].searchText.trim() === '') {
            return;
          }

          if (key === 'isSoftDeleted') {
            let result = false;
            const lowerVal = filterSortConfig[key].searchText.toLowerCase();

            //Enum mapping with search text
            if ('true'.includes(lowerVal)) {
              result = true
            }

            filterBody[key] = result;
          }
          else {
            filterBody[key] = filterSortConfig[key].searchText;
          }
        });
      }

      return this.configurationService.searchConfiguration(limit, offset, sortValue, filterBody);
    };
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.eventAbortController.abort();
  }

  get keyInput(): UntypedFormControl {
    return this.configurationForm.get('keyInput') as UntypedFormControl;
  }
  get valueInput(): UntypedFormControl {
    return this.configurationForm.get('valueInput') as UntypedFormControl;
  }
  public addConfigurationDisabled(): boolean {
    if (this.keyInput.value == '' || this.valueInput.value == '') {
      return true;
    }
    if (this.keyInput.errors) {
      return true;
    }
    return false;
  }

  /**
   * Add new Configuration
   */
  public onAddConfiguration(): void {
    const newConfigurations: NewConfiguration[] = [];
    const configuration: NewConfiguration = {
      key: this.keyInput.value,
      value: this.valueInput.value,
      valueType: 'String',
    };
    newConfigurations.push(configuration);
    const newAddConfiguration = { configurations: newConfigurations };
    if (newConfigurations.length > 0) {
      this.subscription.add(
        this.configurationService
          .addConfiguration(newAddConfiguration)
          .subscribe({
            next: () => {
              this.configTableRef.fetchData();
              this.resetConfiguration();

              this.notificationService.showNotification({
                title: 'Added configuration successfully!',
              });
            },
            error: (err) => {
              this.resetConfiguration();
              if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
                this.notificationService.showNotification({
                  title: `Error while adding configuration!`,
                  description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
                }, true);
              } else {
                this.notificationService.showNotification({
                  title: `Error while adding configuration!`,
                  description: 'Click to open the FAQ doc for further steps.'
                }, true);
              }
            },
          })
      );
    }
  }
  /**
   * Resets all input values.
   */
  public resetConfiguration(): void {
    this.isEdit = false;
    this.keyInput.reset('');
    this.valueInput.reset('');
  }

  /**
   * Check if the key already exist in the Configuration list
   * @param event
   */
  public onInputHandler(event?): void {
    if (event) {
      event.preventDefault();
    }
    const keyExists = !!this.configurationList.find(
      (config) =>
        config.key.toLowerCase() === this.keyInput.value.trim().toLowerCase()
    );
    this.checkValidationError('keyExists', keyExists);
  }
  private checkValidationError(errCode: string, invalid: boolean): void {
    if (!this.keyInput.errors && invalid) {
      const error = new Object();
      error[errCode] = invalid;
      this.keyInput.setErrors(error);
    } else if (
      this.keyInput.errors &&
      this.keyInput.hasError(errCode) &&
      !invalid
    ) {
      this.keyInput.setErrors(null);
    }
  }
  public onUpdateConfiguration(): void {
    const configuration: UpdateConfiguration = {
      value: this.valueInput.value,
    };
    if (configuration != null) {
      this.subscription.add(
        this.configurationService
          .updateConfiguration(configuration, this.keyInput.value)
          .subscribe({
            next: () => {
              this.configTableRef.fetchData();
              this.resetConfiguration();
              this.isEdit = false;
              this.notificationService.showNotification({
                title: 'Updated configuration successfully!',
              });
            },
            error: (err) => {
              this.resetConfiguration();
              if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
                this.notificationService.showNotification({
                  title: `Error while updating configuration!`,
                  description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
                }, true);
              } else {
                this.notificationService.showNotification({
                  title: `Error while updating configuration!`,
                  description: 'Click to open the FAQ doc for further steps.'
                }, true);
              }
            },
          })
      );
    }
  }

  public deleteConfiguration(configuration: Configuration): void {
    const dialogRef = this.dialogService.createDialog(
      DeleteConfigConfirmDialogComponent,
      {
        configKey: configuration.key
      }
    );

    this.subscription.add(dialogRef.instance.dialogResult.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.subscription.add(
          this.configurationService
            .deleteConfiguration(configuration.key)
            .subscribe({
              next: () => {
                this.configTableRef.fetchData();
                this.notificationService.showNotification({
                  title: 'Deleted configuration successfully!',
                });
              },
              error: (err) => {
                if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
                  this.notificationService.showNotification({
                    title: `Error while deleting configuration!`,
                    description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
                  }, true);
                } else {
                  this.notificationService.showNotification({
                    title: `Error while deleting configuration!`,
                    description: 'Click to open the FAQ doc for further steps.'
                  }, true);
                }
              },
            })
        );
      }
    }));
  }
}
