import { TitleCasePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Pagination, Table } from '@eds/vanilla';
import { Subject, Subscription, ReplaySubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { ProjectEventService } from 'src/app/projects/project-event.service';
import { UserSession, OPSuserResponse, UserInput, OPSUserType, NewUser, ExtendedAttribute, OPSUser } from '../user-management.interface';
import { ProjectsService } from 'src/app/projects/projects.service';
import { SelectComponent } from 'src/app/shared/select/select.component';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { DeleteUserConfirmDialogComponent, DialogResult } from '../delete-user-confirm-dialog/delete-user-confirm-dialog.component';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { ProjectOnboardingService } from 'src/app/project-onboarding/project-onboarding.service';
import TableUtils from 'src/app/projects/project/acceptance-package-details/table-utilities';
import RoleTitleMapping from 'src/app/auth/role-mapping.utils';
import { CustomerShort } from 'src/app/customer-onboarding/customer-onboarding.interface';
import { CustomerService } from 'src/app/customer-onboarding/customer.service';
import { OptionWithValue } from 'src/app/shared/select/select.interface';
import { checkValueLength, resetOffsetValue, updateNoDataRowInTable } from 'src/app/shared/table-utilities';
import { ComponentService } from 'src/app/shared/component.service';
import { GroupAssociatedPackage } from 'src/app/group-management/group-management-interfaces';
import { GroupPkgListDialogComponent } from 'src/app/group-management/group-user/group-pkg-list-dialog/group-pkg-list-dialog.component';
interface TableRowData extends Omit<OPSUser, 'roleType'> {
  roleType: string;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.less']
})
export class UserManagementComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('email') readonly emailInputElementRef: ElementRef<HTMLElement>;
  @ViewChild('userTypeSelection') readonly userTypeSelectionElementRef: ElementRef<HTMLElement>;
  @ViewChild('roleSelectionEricsson') readonly roleSelectionEricssonElementRef: SelectComponent;
  @ViewChild('roleSelectionNonEricsson') readonly roleSelectionNonEricssonElementRef: ElementRef<HTMLElement>;
  @ViewChild('roleSelectionFunctional') readonly roleSelectionFunctionalElementRef: ElementRef<HTMLElement>;
  @ViewChild('users') readonly usersTableElementRef: ElementRef<HTMLElement>;
  @ViewChild('filterPills') private readonly filterPillsElementRef: ElementRef<HTMLElement>;
  OPSUserType = OPSUserType;
  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();
  ericssonRole = [
    'Ericsson Contributor',
    'Operations Admin',
    'Project Admin',
  ];
  customerRole = [
    'Customer Approver',
    'Customer Observer',
  ];
  public filterSortColumns = {
    userEmail: { columnName: 'userEmail', searchText: '', sortingIndex: 0, sortingOrder: '' },
    userId: { columnName: 'userId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    userFirstName: { columnName: 'userFirstName', searchText: '', sortingIndex: 0, sortingOrder: '' },
    userLastName: { columnName: 'userLastName', searchText: '', sortingIndex: 0, sortingOrder: '' },
    customerId: { columnName: 'customerId', searchText: '', sortingIndex: 0, sortingOrder: '' },
    isSoftDeleted: { columnName: 'isSoftDeleted', searchText: '', sortingIndex: 0, sortingOrder: '', options: ['Active', 'Inactive'] },
    roleType: { columnName: 'roleType', searchText: '', sortingIndex: 0, sortingOrder: '', options: [...this.ericssonRole, ...this.customerRole] },
    lastModifiedDate: { columnName: 'lastModifiedDate', searchText: '', sortingIndex: 0, sortingOrder: 'desc' },
    lastModifiedBy: { columnName: 'lastModifiedBy', searchText: '', sortingIndex: 0, sortingOrder: '' },
  };

  isFilter: boolean = false;
  userForm: UntypedFormGroup;
  table: Table;
  loggedInUser: UserSession;
  tableElements: any[];
  userType: string[];
  functionalRole: string[];
  inputUsers: UserInput[] = [];
  selectedUserType: string;
  isSoftDeleted: boolean = false;
  createdDate: string;
  createdBy: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  selectedRole: string[] = [];
  searchText: string;
  isEdit: boolean = false;
  private pagination: Pagination;
  limit: number = 10;
  offset: number = 0;
  statusFilterShow: ReplaySubject<boolean> = new ReplaySubject(1);
  loadingTableData: boolean;
  totalRecords: number;
  paginationDom: any;
  private emailSearchTerms = new Subject<string>();
  public confirmedFilters = this.filterSortColumns;
  getAllCustomers: Observable<CustomerShort[]>;
  customers: CustomerShort[];
  customerId: FormControl<string>;
  constructor(
    private titleCasePipe: TitleCasePipe,
    private projectService: ProjectsService,
    private projectOnboardingService: ProjectOnboardingService,
    private projectEventService: ProjectEventService,
    private notificationService: NotificationService,
    private componentService: ComponentService,
    private dialogService: DialogService,
    private changeDetector: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private datePipe: NullStringDatePipe,
    private customerService: CustomerService,
  ) {
    this.userForm = this.fb.group({
      firstNameInput: ['', [Validators.required, Validators.maxLength(255)]],
      lastNameInput: ['', [Validators.required, Validators.maxLength(255)]],
      userIDInput: ['', [Validators.required,
      Validators.minLength(7),
      Validators.maxLength(12),
      Validators.pattern('[A-Za-z]+')
      ]],
      applicationId: [
        '',
        [
          Validators.required,
          Validators.minLength(36),
          Validators.maxLength(36)
        ]
      ],
      signumInput: [
        '', 
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(12),
          Validators.pattern('[A-Za-z0-9]+')
        ]
      ],
      emailInput: ['', [Validators.required,
      Validators.email]],
      isSoftDeleted: Boolean,
      customerIdInput: ['', [Validators.required, Validators.maxLength(255)]],
    });
    this.userType = ['Ericsson', 'Customer'];
    this.functionalRole = ['Functional Read and Write'];
  }

  get customerOptions(): OptionWithValue[] | undefined {
    return this.customers
      ? this.customers.map(customer => {
        return {
          option: `${customer.customerId} - ${customer.customerName}`,
          optionValue: customer.customerId,
        };
      })
      : undefined;
  }

  ngOnInit(): void {
    

    // to keep the customers eagerly loaded
    this.customerService.getAllCustomers().subscribe({
      next: (customers: CustomerShort[]) => {
        this.customers = customers;
      }
    });

    this.projectEventService.userSessionChange.pipe(
      take(1),
    ).subscribe({
      next: (userSession: UserSession) => this.loggedInUser = userSession
    });

    this.emailSearchTerms.pipe(
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe((term: string) => this.searchEmail(term));
  }

  ngAfterViewInit(): void {
    const columnsProperties = [
      {
        key: 'userEmail',
        title: 'Email',
        sort: 'none',
      },
      {
        key: 'userId',
        title: 'User ID',
        sort: 'none',
      },
      {
        key: 'userFirstName',
        title: 'First name',
        sort: 'none',
      },
      {
        key: 'userLastName',
        title: 'Last name',
        sort: 'none',
      },
      {
        key: 'roleType',
        title: 'Role(s)',
        sort: 'none',
        cellClass: 'column-roles',
        onCreatedCell: (td, cellData): void => {
          if (cellData) {
            td.innerText = this.titleCasePipe.transform(cellData);
            RoleTitleMapping.assignTitleForGivenRole(cellData, td);
          }
        }
      },
      {
        key: 'customerId',
        title: 'Customer ID',
        sort: 'none',
        onCreatedCell: (td, cellData): void => {
          if (cellData) {
            td.innerText = cellData;
          } else {
            td.innerText = '--';
          }
        }
      },
      {
        key: 'isSoftDeleted',
        title: 'Status',
        sort: 'none',
        cellClass: 'state',
        onCreatedCell: (td, cellData): void => {
          td.replaceChildren(this.getStatusTag(cellData));
        }
      },
      {
        key: 'lastModifiedBy',
        title: 'Last modified by',
        sort: 'none',
      },
      {
        key: 'lastModifiedDate',
        title: 'Last modified date',
        sort: 'none',
        cellClass: 'column-date',
        onCreatedCell: (td: HTMLTableCellElement, cellData: any): void => {
          this.formatDateCell(cellData, td);
        },
      }
    ];

    const tableHeightStyleProp = 'calc(100vh - 331px)';
    const usersTableDOM = this.usersTableElementRef.nativeElement as HTMLElement;
    if (usersTableDOM) {
      const table = new Table(usersTableDOM, {
        data: this.tableElements || [],
        columns: columnsProperties,
        height: tableHeightStyleProp,
        actions: true,
        onCreatedHead: (thead): void => {
          thead.querySelectorAll('tr:first-child th').forEach((th) => {
            const dataKey = th.getAttribute('data-key');
            th.classList.add('is-sortable');
            // roleType is an array and therefore not sortable
            if (dataKey === null || dataKey === 'roleType') {
              th.classList.remove('is-sortable');
            }
            if (dataKey !== 'roleType') {
              th.addEventListener('click', this.addClassSortToHead, false);
            }
          });
        },
        onCreatedActionsCell: (td: HTMLTableCellElement, rowData: TableRowData): void => {
          let htmlText = '';
          if (rowData.userType.toLowerCase() !== OPSUserType.functionalUserType.toLowerCase()) {
            htmlText += `<button class="btn-icon edit" title="Edit"><i class="icon icon-edit"></i></button>`;
          }
          else {
            htmlText + `<button class="btn-icon edit disableIcon" disabled title="Edit"><i class="icon icon-edit" disabled></i></button>`;
          }

          if (!rowData.isSoftDeleted) {
            htmlText += `<button class="btn-icon delete" title="Delete"><i class="icon icon-trashcan"></i></button>`;
          } else {
            htmlText += `<button class="btn-icon reactivate" title="Reactivate"><i class="icon icon-reload"></i></button>`;
          }

          td.innerHTML = htmlText;
          this.subscription.add(
            td.querySelector('button.edit')?.addEventListener('click', (evt) => {
              evt.stopPropagation();
              this.isEdit = true;

              this.selectedUserType = rowData.userType;
              this.selectedRole = rowData.roleType.split(', ');
              this.changeDetector.detectChanges();
              this.onSelectUserTypeHandler(this.selectedUserType);

              this.userForm.patchValue({
                firstNameInput: rowData.userFirstName,
                lastNameInput: rowData.userLastName,
                emailInput: rowData.userEmail,
                signumInput: rowData.userId,
                isSoftDeleted: rowData.isSoftDeleted,
                customerIdInput: rowData.customerId
              });

              if (this.userTypeSelectionElementRef) {
                (this.userTypeSelectionElementRef as any).select.value = this.selectedUserType;
              }
              if (this.roleSelectionEricssonElementRef) {
                this.roleSelectionEricssonElementRef.select.value = this.selectedRole;
              }
              if (this.roleSelectionNonEricssonElementRef) {
                (this.roleSelectionNonEricssonElementRef as any as SelectComponent).select.value = this.selectedRole;
              }
              
              if (rowData.customerId) {
                // if there is already a customerId assigned, disable it. because it required more approval to change the customerId
                this.userForm.controls.customerIdInput.disable();
              } else {
                // if there is no customerId assigned (for example : existing / migrated users) allow to choose a customerId
                this.userForm.controls.customerIdInput.enable();
              }
              // UserID field is critical and should not be changed once created. 
              // If it needs to be modified, OPS Admin shall deactivate it and recreate the new UserID
              this.userForm.controls.signumInput.disable();
            })
          );
          this.subscription.add(
            td.querySelector('button.delete')?.addEventListener('click', (evt) => {
              evt.stopPropagation();
              this.deleteUser(rowData);
            })
          );
          this.subscription.add(
            td.querySelector('button.reactivate')?.addEventListener('click', (evt) => {
              evt.stopPropagation();
              this.reactivateUser(rowData);
            })
          );
        },
        beforeCreatedBody: (): void => {
          const attrKey = 'data-key';
          table?.dom.table
            .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
            .forEach(cell => {
              let input = cell?.firstChild;
              const filterInputMarkerClass = 'filter-marker';
              if (input && !cell.classList.contains(filterInputMarkerClass)) {
                const attribute = cell.getAttribute(attrKey);
                if (attribute.includes('date') || attribute.includes('Date')) {
                  const datePicker = this.componentService.createDatePicker(cell);
                  input = datePicker.instance.datePicker()?.nativeElement;
                } else if (this.filterSortColumns[attribute].options && this.filterSortColumns[attribute].options.length > 0) {
                  const newInputElement = input as HTMLInputElement;
                  newInputElement.type = 'search';
                  newInputElement.setAttribute('list', `table-filter-input-datalist-${attribute}`);

                  const dataList = document.createElement('datalist');
                  dataList.setAttribute('id', `table-filter-input-datalist-${attribute}`);

                  this.filterSortColumns[attribute].options.forEach(opt => {
                    const option = document.createElement('option');
                    option.setAttribute('value', opt);
                    dataList.appendChild(option);
                  });

                  newInputElement.parentElement.appendChild(dataList);
                  newInputElement.addEventListener('keyup', (event) => {
                    const currVal = newInputElement.value;
                    let found = false;

                    for (let i = 0; i < this.filterSortColumns[attribute].options.length; i++) {
                      if (this.filterSortColumns[attribute].options[i].toLowerCase().includes(currVal.toLowerCase())) {
                        found = true;
                        break;
                      }
                    }

                    if (!found) {
                      newInputElement.value = '';
                    }
                  });
                }

                input?.addEventListener(
                  'change',
                  (event: KeyboardEvent | CustomEvent) => {
                    const inputTarget: HTMLInputElement = event.target as HTMLInputElement;
                    const attributeValue = inputTarget.value || event.detail;

                    if (!checkValueLength(attributeValue, {}, this.notificationService)) {
                      return;
                    }
    
                    this.filterSortColumns[attribute].searchText = attributeValue;
                    this.offset = resetOffsetValue;
                    this.getUsers();
                  }, false);
                cell.classList.add(filterInputMarkerClass);
                if (cell?.getAttribute(attrKey) === 'status') {
                  const statusInput = input as HTMLInputElement;
                  this.statusFilterShow.subscribe(showFilter => {
                    if (!showFilter) {
                      statusInput.style.display = 'none';
                    } else {
                      statusInput.style.display = 'inline-block';
                    }
                  });
                }
              }
            });
          // Overwrite EDS table onChangedFilter to remove default filter behavior.
          // The signature of the assigned function must match with the original signature.
          if (table?.onChangedFilter) {
            table.onChangedFilter = (a: any, b: any): void => {
              /* do nothing */
            };
          }
        }
      });
      table.init();
      TableUtils.overwriteEDSTableFeatureTableInfo(table, this);
      this.table = table;
      this.getUsers();
      this.pagination = this.table['pagination'];
      if (this.pagination) {
        const paginationDom = this.pagination['dom'].paginationGroup;
        this.pagination.update(this.totalRecords);
        paginationDom.addEventListener('paginationChangePage', this.paginationChange, false);
        paginationDom.addEventListener('paginationChangeSelect', this.paginationChange, false);
      }
      this.table['pagination'] = undefined;
      this.scripts.push(this.table);
    }
    if (this.table) {
      const tableHeaderCells = this.table.dom.table.querySelectorAll('th');
      tableHeaderCells.forEach(th => {
        if (th.classList.contains('is-sortable')) {
          const dataKey = th.getAttribute('data-key');
          th.classList.remove('asc');
          th.classList.remove('desc');
          if (dataKey === 'lastModifiedDate') {
            th.classList.add('desc');
          }
        }
      })
    }

    updateNoDataRowInTable(this.table , 'Loading...');
  }

  paginationChange = (event): void => {
    const setOffsetLimit = {
      offset: (event.detail.state.currentPage * event.detail.state.numPerPage) - event.detail.state.numPerPage,
      limit: event.detail.state.numPerPage
    }
    if (this.limit !== setOffsetLimit.limit || this.offset !== setOffsetLimit.offset) {
      this.limit = setOffsetLimit.limit;
      this.offset = setOffsetLimit.offset;
      this.getUsers();
    }
  }

  addClassSortToHead = (event): void => {
    const key = event.srcElement.getAttribute('data-key');
    if (event.srcElement.classList.contains('asc')) {
      event.srcElement.classList.remove('asc');
      event.srcElement.classList.add('desc');
      this.filterSortColumns[key].sortingOrder = 'desc';
    }
    else if (event.srcElement.classList.contains('desc')) {
      event.srcElement.classList.add('asc');
      event.srcElement.classList.remove('desc');
      this.filterSortColumns[key].sortingOrder = 'asc';
    }
    else {
      let sibling = event.srcElement.parentNode.firstElementChild;
      while (sibling) {
        if (sibling.nodeType === 1 && sibling !== event.srcElement) {
          const datKey = sibling.getAttribute('data-key');

          if (datKey != null && datKey != 'roleType') {
            this.filterSortColumns[datKey].sortingOrder = '';
            sibling.classList.remove('asc');
            sibling.classList.remove('desc');
          }
        }
        sibling = sibling.nextSibling;
      }
      event.srcElement.classList.add('asc');
      this.filterSortColumns[key].sortingOrder = 'asc';
    }
    this.getUsers();
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private getUsers(): void {
    this.confirmedFilters = { ...this.filterSortColumns };

    if (this.confirmedFilters.isSoftDeleted.searchText != '') {
      let result = this.confirmedFilters.isSoftDeleted.searchText;

      if ('active'.includes(result.toLowerCase()) || 'false'.includes(result.toLowerCase())) {
        result = 'false';
      } else if ('inactive'.includes(result.toLowerCase()) || 'true'.includes(result.toLowerCase())) {
        result = 'true';
      }

      this.confirmedFilters.isSoftDeleted.searchText = result;
    }

    const filterSortConfig = this.confirmedFilters;

    const filterSortAttr = {};
    Object.keys(filterSortConfig).forEach(filterKey => {
      if (filterSortConfig[filterKey].searchText !== '') {
        filterSortAttr[`${filterSortConfig[filterKey].columnName}`] = filterSortConfig[filterKey].searchText;
      }
      if (filterSortConfig[filterKey].sortingOrder !== '') {
        const sortAttr = {
          key: 'sort',
          value: `${filterSortConfig[filterKey].sortingOrder}(${filterSortConfig[filterKey].columnName})`
        };
        filterSortAttr[`${sortAttr.key}`] = sortAttr.value;
      }
    });

    this.isFilter = !!Object.keys(this.filterSortColumns).find(filterKey => this.filterSortColumns[filterKey].searchText !== '');

    this.loadingTableData = true;
    this.subscription.add(
      this.projectOnboardingService.getOPSUsers(this.limit, this.offset, filterSortAttr).subscribe({
        next: (data: OPSuserResponse) => {
          this.totalRecords = data.totalRecords;
          this.tableElements = data.results
            .map(user => {
              const extendedUser = {
                ...user, roleType: user.roleType.join(', ')
              };
              return extendedUser;
            });
          this.table.update(this.tableElements);
          this.pagination.update(this.totalRecords);
          this.loadingTableData = false;
          if (data.totalRecords === 0) {
            updateNoDataRowInTable(this.table, 'No data found.');
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loadingTableData = false;
          if (
            error.status === HttpStatusCode.BadGateway ||
            error.status === HttpStatusCode.ServiceUnavailable ||
            !navigator.onLine
          ) {
            // keep old data received from server, no op
            this.notificationService.showNotification(
              {
                title: `Error while loading data`,
                description:
                  'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
              },
              true
            );
          } else {
            updateNoDataRowInTable(this.table, 'No data found.');
            this.table.update([]);
            const getUsers = (): void => {
              this.getUsers();
            }
            updateNoDataRowInTable(this.table, 'Failed to load the data.', getUsers);
          }

        }
      })
    );

  }

  get firstNameInput(): UntypedFormControl {
    return this.userForm.get('firstNameInput') as UntypedFormControl;
  }

  get lastNameInput(): UntypedFormControl {
    return this.userForm.get('lastNameInput') as UntypedFormControl;
  }

  get userIDInput(): UntypedFormControl {
    return this.userForm.get('userIDInput') as UntypedFormControl;
  }

  get signumInput(): UntypedFormControl {
    return this.userForm.get('signumInput') as UntypedFormControl;
  }

  get emailInput(): UntypedFormControl {
    return this.userForm.get('emailInput') as UntypedFormControl;
  }

  get applicationId(): UntypedFormControl {
    return this.userForm.get('applicationId') as UntypedFormControl;
  }

  get isSoftDeletedInput(): UntypedFormControl {
    return this.userForm.get('isSoftDeleted') as UntypedFormControl;
  }

  get customerIdInput(): UntypedFormControl {
    return this.userForm.get('customerIdInput') as UntypedFormControl;
  }

  public onInputHandler(event?): void {
    if (event) {
      event.preventDefault();
    }

    if (this.selectedUserType.toLowerCase() != OPSUserType.functionalUserType.toLowerCase()) {
      const firstNameMissing = !this.firstNameInput.value;
      this.checkValidationError('firstNameMissing', firstNameMissing);

      const lastNameMissing = !this.lastNameInput.value;
      this.checkValidationError('lastNameMissing', lastNameMissing);

      const userExists = !!this.tableElements.find(user => (user.userEmail.toLowerCase() === this.emailInput.value.trim().toLowerCase()));
      this.checkValidationError('userExists', userExists);

      if (this.emailInput.valid) {
        const user = {
          firstName: this.firstNameInput.value.trim(),
          lastName: this.lastNameInput.value.trim(),
          emailId: this.emailInput.value.trim(),
          signum: this.signumInput.value.trim(),
          userId: this.userIDInput.value.trim(),
          ...(this.selectedUserType.toLowerCase() == OPSUserType.customerUserType.toLowerCase() &&
            { customerId: this.customerId.value.trim() }),
        };
        this.inputUsers.push(user);
        this.firstNameInput.reset('');
        this.lastNameInput.reset('');
        this.signumInput.reset('');
        this.userIDInput.reset('');
        if (this.selectedUserType.toLowerCase() === OPSUserType.customerUserType.toLowerCase()) {
          this.customerIdInput.reset('');
        }
        this.emailInputElementRef.nativeElement.blur();
        this.emailInput.reset('');
      }
    }

    if (this.selectedUserType.toLowerCase() == OPSUserType.functionalUserType.toLowerCase()) {
      const userIDMissing = !this.userIDInput.value;
      this.checkValidationError('userIDMissing', userIDMissing);
      const user = {
        userId: this.userIDInput.value.trim(),
        firstName: '',
        lastName: '',
        signum: '',
        emailId: '',
      };
      this.inputUsers.push(user);
      this.userIDInput.reset('');
    }
  }

  private checkValidationError(errCode: string, invalid: boolean): void {
    if (this.selectedUserType.toLowerCase() != OPSUserType.functionalUserType.toLowerCase()) {
      if (!this.emailInput.errors && invalid) {
        const error = new Object();
        error[errCode] = invalid;
        this.emailInput.setErrors(error);
      } else if (this.emailInput.errors && this.emailInput.hasError(errCode) && !invalid) {
        this.emailInput.setErrors(null);
      }
    }
  }

  public removeInput(input: UserInput): void {
    const index = this.inputUsers.findIndex(user => (user.emailId === input.emailId));
    if (index !== -1) {
      this.inputUsers.splice(index, 1);
    }
  }

  public onSelectUserTypeHandler(event): void {
    if (this.selectedUserType && this.selectedUserType !== event) {
      this.selectedRole = [];
      if (this.roleSelectionNonEricssonElementRef) {
        (this.roleSelectionNonEricssonElementRef as any).resetInput();
        this.selectedRole = [];
      }
      if (this.roleSelectionEricssonElementRef) {
        this.roleSelectionEricssonElementRef.resetInput();
        this.selectedRole = [];
      }
    }
    this.selectedUserType = event;
    if (this.selectedUserType.toLowerCase() === OPSUserType.functionalUserType.toLowerCase()) {
      this.selectedRole = ['Functional Read and Write'];
    }
  }

  public onSelectRoleHandler(event: Event): void {
    if (this.roleSelectionEricssonElementRef) {
      const exclusiveRoles = [
        'Operations Admin',
      ]
      const exclusiveRoleSelected = exclusiveRoles.find(exclusiveR => this.roleSelectionEricssonElementRef.select.value.includes(exclusiveR));
      Array.from(this.roleSelectionEricssonElementRef.select['dom'].selectOptions.children).forEach(element => {
        if (exclusiveRoleSelected) {
          if (exclusiveRoleSelected !== element.textContent) element.querySelector('input').disabled = true;
        }
        else {
          this.roleSelectionEricssonElementRef.select.value.length > 0 && exclusiveRoles.includes(element.textContent)
            ? element.querySelector('input').disabled = true
            : element.querySelector('input').disabled = false;
        }
      });
      this.selectedRole = this.roleSelectionEricssonElementRef.select.value;
    }
    if (this.roleSelectionNonEricssonElementRef) {
      this.selectedRole = (this.roleSelectionNonEricssonElementRef as any as SelectComponent).select.value;
    }
  }

  public addUserDisabled(): boolean {
    if (!this.selectedUserType) {
      return true;
    }

    if (this.selectedUserType.toLowerCase() !== OPSUserType.functionalUserType.toLowerCase()) {
      if (this.firstNameInput.value == '' || this.lastNameInput.value == '' ||
        this.emailInput.value == '' || this.emailInput.invalid ||
        this.signumInput.value == '' || this.signumInput.invalid) {
        return true;
      }
    }

    if (this.selectedUserType.toLowerCase() === OPSUserType.functionalUserType.toLowerCase()) {
      if (this.userIDInput.value == '' || this.userIDInput.invalid) {
        return true;
      }
      if (this.applicationId.value == '' || this.applicationId.invalid) {
        return true;
      }
      return false;
    }

    if (this.selectedRole === undefined || this.selectedRole.length < 1) {
      return true;
    }

    // customer id is mandatory for Customer users
    if (this.selectedUserType.toLowerCase() === OPSUserType.customerUserType.toLowerCase()) {
      if (this.customerIdInput.value == '') {
        return true;
      }
    }

    return false;
  }

  public resetBtnDisabled(): boolean {
    return !this.selectedUserType;
  }

  public onAddUser(): void {
    const applicationId: string = this.applicationId.value;
    const extendedAttributes: ExtendedAttribute[] = [
      {
        attributeName: 'Azure_AppId',
        attributeType: 'string',
        attributeValue: applicationId.trim(),
      }
    ]
    let user: NewUser = {
      userId: this.selectedUserType.toLowerCase() === OPSUserType.functionalUserType ? this.userIDInput.value : this.signumInput.value,
      userFirstName: this.firstNameInput.value,
      userLastName: this.lastNameInput.value,
      userEmail: this.emailInput.value,
      userType: this.selectedUserType,
      roleType: this.selectedRole,
      extendedAttributes: this.selectedUserType.toLowerCase() === OPSUserType.functionalUserType ? extendedAttributes : [],
    };


    if (this.selectedUserType.toLowerCase() === OPSUserType.customerUserType.toLowerCase()) {
      user = { ...user, customerId: this.customerIdInput.value }
    }
    const newUsers = [user];
    const newAddUser = {
      users: newUsers
    };
    if (newUsers.length > 0) {
      this.subscription.add(
        this.projectService.enrollUser(newAddUser).subscribe({
          next: () => {
            this.getUsers();
            this.resetAllSelects();
            this.notificationService.showNotification({
              title: 'Added user successfully!',
            });
          },
          error: (err: HttpErrorResponse) => {
            this.resetAllSelects();
            if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
              this.notificationService.showNotification({
                title: 'Error when adding user!',
                description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
              }, true);
            } else if (err.status === HttpStatusCode.BadRequest) {
              const entryError: string = (err.error?.length > 0) ? err.error.find(() => true)?.description : undefined;
              this.notificationService.showNotification({
                title: err.error.responseMessage || 'Error when adding user!',
                description: err.error.responseMessageDescription || entryError || 'Click to open the FAQ doc for further steps.'
              }, true);
            } else {
              this.notificationService.showNotification({
                title: 'Error when adding user!',
                description: 'Click to open the FAQ doc for further steps.'
              }, true);
            }
          }
        })
      );
    }
  }

  public onUpdateUser(): void {
    const userID = this.selectedUserType === OPSUserType.functionalUserType.toLowerCase() ? this.userIDInput.value : this.signumInput.value;

    let editedUser: Partial<NewUser> = {
      userId: this.selectedUserType === OPSUserType.functionalUserType.toLowerCase() ? this.userIDInput.value : this.signumInput.value,
      userFirstName: this.firstNameInput.value,
      userLastName: this.lastNameInput.value,
      userEmail: this.emailInput.value,
      userType: this.selectedUserType.toUpperCase(),
      roleType: this.selectedRole,
    }

    if (this.selectedUserType.toLowerCase() === OPSUserType.customerUserType.toLowerCase()) {
      editedUser = { ...editedUser, customerId: this.customerIdInput.value }
    }

    this.subscription.add(
      this.projectService.updateUser(editedUser, userID).subscribe({
        next: () => {
          this.getUsers();
          this.resetAllSelects();
          this.notificationService.showNotification({
            title: 'Updated user successfully!',
          });
        },
        error: (err) => {
          this.resetAllSelects();
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            this.notificationService.showNotification({
              title: 'Error when updating user!',
              description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            }, true);
          } else {
            this.notificationService.showNotification({
              title: 'Error when updating user!',
              description: 'Click to open the FAQ doc for further steps.'
            }, true);
          }
        }
      })
    )
  }
  public onCancel(): void {
    this.resetAllSelects();
  }

  public onSearchHandler(event: string): void {
    this.emailSearchTerms.next(event);
  }

  private searchEmail(searchText: string): void {
    if (!!searchText) {
      this.filterSortColumns.userEmail.searchText = searchText;
    } else {
      this.filterSortColumns.userEmail.searchText = '';
    }
    this.getUsers();
  }

  /**
   * Clears the input of one filter criterion
   * @param currentFilter name of the filter criterion to be cleared
   */
  public clearSelectedFilter(currentFilter: string, forceFiltering: boolean = true): void {
    this.filterSortColumns[currentFilter].searchText = '';
    if (forceFiltering) {
      this.getUsers();
    }

    const attrKey = 'data-key';
    this.table?.dom.table
      .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach(filterCell => {
        if (currentFilter === filterCell.getAttribute(attrKey)) {
          filterCell.querySelectorAll('input').forEach(inputElement => inputElement.value = '');
        }
      });
  }

  /**
  * Clears the input of all filter criteria
  */
  public clearAllFilters(): void {
    Object.keys(this.filterSortColumns).forEach(filterKey => (this.filterSortColumns[filterKey].searchText = ''));
    this.confirmedFilters = JSON.parse(JSON.stringify(this.filterSortColumns));
    const filterBody = this.usersTableElementRef.nativeElement.querySelector('thead>tr.filters');
    filterBody.querySelectorAll('tr td input').forEach((inputFilter) => {
      (inputFilter as HTMLInputElement).value = '';
    });
    this.isFilter = false;
    this.getUsers();
  }
  /**
   * Resets all selects for userType and role.
   */
  public resetAllSelects(): void {
    this.userForm.patchValue({
      firstNameInput: '',
      lastNameInput: '',
      signumInput: '',
      emailInput: '',
      userIDInput: '',
      applicationId: '',
      customerIdInput: ''
    })
    this.selectedUserType = undefined;
    this.selectedRole = [];
    this.isEdit = false;
    if (this.userTypeSelectionElementRef) {
      (this.userTypeSelectionElementRef as any).emptySelectionText = 'Select user type';
      (this.userTypeSelectionElementRef as any).resetInput();
      this.selectedUserType = undefined;
    }

    if (this.roleSelectionEricssonElementRef) {
      this.roleSelectionEricssonElementRef.resetInput();
      this.selectedRole = [];
    }
    if (this.roleSelectionNonEricssonElementRef) {
      (this.roleSelectionNonEricssonElementRef as any).resetInput();
      this.selectedRole = [];
    }
    // on reset enable customerId selection
    this.userForm.controls.customerIdInput.enable();
    // once update is done, for further users (update / add) , enable it here, so that flow will take care the rest
    this.userForm.controls.signumInput.enable();
  }

  changedPaginationHandler(event): void {
    this.limit = event.limit;
    this.offset = event.offset;
    this.getUsers();
  }

  private formatDateCell(cellData: string, td: HTMLTableCellElement): void {
    let transformedDate = this.datePipe.transform(cellData, 'y-MM-dd');
    transformedDate = transformedDate ? transformedDate : '';
    if (td.firstChild) {
      td.replaceChild(document.createTextNode(transformedDate), td.firstChild);
    } else {
      td.appendChild(document.createTextNode(transformedDate));
    }
  }

  private deleteUser(user: TableRowData): void {
    // Check if user is a sole user in one or more Acceptance Packages
    const userId = user.userId;
    this.projectService.getpackageDetailsForSoleUser(userId).subscribe({
      next: (packageList: GroupAssociatedPackage[]) => {
        if (packageList.length > 0) { // Show list of active APs
          const dialogComponentRef = this.dialogService.createDialog(GroupPkgListDialogComponent, {
            pkgListData: packageList, groupId: null, groupInternalId: null, projectId: null, userId: userId, userType: 'User'
          });
        }
        else { // allow to delete
          const dialogRef = this.dialogService.createDialog(
            DeleteUserConfirmDialogComponent,
            {
              userId,
              action: 'delete'
            }
          );

          this.subscription.add(dialogRef.instance.dialogResult.subscribe((response: DialogResult) => {
            if (response.confirmed) {
              if (!response.requestId) {
                this.notificationService.showNotification({
                  title: 'My Support incident ID is required to delete the user!',
                });
                return;
              }

              const attribute: ExtendedAttribute = {
                attributeName: 'Delete_Request_Id',
                attributeType: 'string',
                attributeValue: response.requestId
              };
              let extendedAttributes = user.extendedAttributes;
              if (extendedAttributes) {
                extendedAttributes = extendedAttributes.map(attr => ({
                  attributeName: attr.attributeName,
                  attributeType: attr.attributeType,
                  attributeValue: attr.attributeValue
                }));
                extendedAttributes.push(attribute);
              }
              else extendedAttributes = [attribute];

              const updatedUser: NewUser = {
                userId: user.userId,
                userFirstName: user.userFirstName,
                userLastName: user.userLastName,
                userEmail: user.userEmail,
                userType: user.userType,
                roleType: user.roleType.split(', '),
                extendedAttributes: extendedAttributes,
                isSoftDeleted: true,
                ...(user.userType.toLowerCase() == OPSUserType.customerUserType.toLowerCase() &&
                  { customerId: user.customerId }),
              }

              this.projectService.updateUser(updatedUser, userId).subscribe({
                next: () => {
                  this.getUsers();
                  this.notificationService.showNotification({
                    title: 'Deleted user successfully!',
                  });
                },
                error: (error) => {
                  const dialogData: DialogData = {
                    dialogueTitle: 'Unable to delete user',
                    show: APICallStatus.Error,
                  };
                  const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
                  let additionalMessage = '';
                  if (error.status === HttpStatusCode.BadGateway || error.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
                    additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
                  } else {
                    additionalMessage = '\n Please follow the FAQ doc for further steps.';
                  }
                  dialogMessage.instance.statusMessage = 'Error when deleting the user!' + additionalMessage;
                  dialogMessage.instance.additionalMessage = '';
                  dialogMessage.instance.actionOn.next('FAQ');
                }
              })
            }
          }));
        }
      }
    });
  }

  private reactivateUser(user: TableRowData): void {
    const userId = user.userId;
    const dialogRef = this.dialogService.createDialog(
      DeleteUserConfirmDialogComponent,
      {
        userId,
        action: 'reactivate'
      }
    );

    this.subscription.add(dialogRef.instance.dialogResult.subscribe((response: DialogResult) => {
      if (response.confirmed) {
        if (!response.requestId) {
          this.notificationService.showNotification({
            title: 'My Support incident ID is required to reactivate the user!',
          });
          return;
        }

        const attribute: ExtendedAttribute = {
          attributeName: 'Reactive_Request_Id',
          attributeType: 'string',
          attributeValue: response.requestId
        };
        let extendedAttributes = user.extendedAttributes;
        if (extendedAttributes) {
          extendedAttributes = extendedAttributes.map(attr => ({
            attributeName: attr.attributeName,
            attributeType: attr.attributeType,
            attributeValue: attr.attributeValue
          }));
          extendedAttributes.push(attribute);
        }
        else extendedAttributes = [attribute];

        const updatedUser: NewUser = {
          userId: user.userId,
          userFirstName: user.userFirstName,
          userLastName: user.userLastName,
          userEmail: user.userEmail,
          userType: user.userType,
          roleType: user.roleType.split(', '),
          extendedAttributes: extendedAttributes,
          isSoftDeleted: false,
          ...(user.userType.toLowerCase() == OPSUserType.customerUserType.toLowerCase() &&
            { customerId: user.customerId }),
        }

        this.projectService.updateUser(updatedUser, userId).subscribe({
          next: () => {
            this.getUsers();
            this.notificationService.showNotification({
              title: 'Reactivated user successfully!',
            });
          },
          error: (error) => {
            const dialogData: DialogData = {
              dialogueTitle: 'Unable to reactivate user',
              show: APICallStatus.Error,
            };
            const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
            let additionalMessage = '';
            if (error.status === HttpStatusCode.BadGateway || error.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
              additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
            } else {
              additionalMessage = '\n Please follow the FAQ doc for further steps.';
            }
            dialogMessage.instance.statusMessage = 'Error when reactivating the user!' + additionalMessage;
            dialogMessage.instance.additionalMessage = '';
            dialogMessage.instance.actionOn.next('FAQ');
          }
        })
      }
    }));
  }

  private getStatusTag(isSoftDeleted: boolean): HTMLElement {
    const kdb = document.createElement('kbd');
    kdb.classList.add(
      'tag', 'big',
    );
    if (!isSoftDeleted) {
      kdb.appendChild(document.createTextNode('Active'));
      kdb.classList.add('green');
    } else {
      kdb.appendChild(document.createTextNode('Inactive'));
      kdb.classList.add('red');
    }
    return kdb;
  }
}

