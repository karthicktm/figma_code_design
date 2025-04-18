import { AfterViewInit, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Location } from '@angular/common';
import { TabGroup } from '@eds/vanilla';
import { BehaviorSubject, Observable, Subscription, of, throwError } from 'rxjs';
import { map, switchMap, tap, catchError, shareReplay, take } from 'rxjs/operators';
import { ProjectsService } from '../../projects.service';
import { ProjectEventService } from '../../project-event.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { WarningDialogComponent } from 'src/app/warning-dialog/warning-dialog.component';
import { SubmitPackageDialogComponent } from '../../details-dialog/submit-package-dialog/submit-package-dialog.component';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { SubmitPackageVerdictDialogComponent } from '../../details-dialog/submit-package-verdict-dialog/submit-package-verdict-dialog.component';
import { DetailsContextualService } from './details-contextual.service';
import { CustomerAcceptanceStatus, ExtendedAttribute, PackageDetails, PackageUser, PackageGroup, PackageValidateResponse, ProjectDetails, PackageMemberAction, SourceTool, SubmitAcceptancePackagesRequest, TransferPackageReportType } from '../../projects.interface';
import { AcceptancePackageService, RoleInPackage } from '../acceptance-package.service';
import { AbandonAcceptancePackageDialogComponent } from '../acceptance-packages/abandon-acceptance-package-dialog/abandon-acceptance-package-dialog.component';
import { ValidationResDialogComponent } from './validation-res-dialog/validation-res-dialog.component';
import { TransferEvidencesDialogComponent } from './transfer-evidences-dialog/transfer-evidences-dialog.component';
import { RoleType } from 'src/app/group-management/group-management-interfaces';

@Component({
  selector: 'app-acceptance-package-details',
  templateUrl: './acceptance-package-details.component.html',
  styleUrls: ['./acceptance-package-details.component.less'],
  providers: [DetailsContextualService]
})
export class AcceptancePackageDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  private scripts: Scripts[] = [];
  public packageDetails: Observable<PackageDetails>;
  public packageHistory: any;
  public packageLinearId: string;
  public title: string;
  public showLoader: boolean = false;
  public showWarning: boolean = false;
  public disabledSubmissionDecision: boolean;
  public disabledSubmissionPackage: boolean = false;
  tabConfigs = [
    { name: 'Details & users', status: 'details' },
    { name: 'Package components', status: 'package-components' },
    { name: 'Package evidences', status: 'package-evidences' },
    { name: 'Package timeline', status: 'package-timeline' },
  ];
  public targetTab: string;
  projectId: string;
  projectDetails: Observable<ProjectDetails>;
  isPackageCompleted = false;
  reworkedPackage: boolean = false;
  packageStatus: string;
  isMultiLevelAcceptance: boolean;
  approvalRule: string;
  packageType: string;
  siteList: string;
  private packageDetailsLoadingTrigger = new BehaviorSubject(0);
  private subscription: Subscription = new Subscription();
  AcceptanceStatus = CustomerAcceptanceStatus;
  warningDialog: WarningDialogComponent;
  isBlockchainValidationRequired: boolean;
  transferFailureReason = signal<string>('');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private projectService: ProjectsService,
    private projectEventService: ProjectEventService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private packageService: AcceptancePackageService
  ) { }

  ngOnInit(): void {
    this.showLoader = true;
    this.targetTab = this.route.snapshot.queryParamMap.get('acceptancePackageTab');
    if (!this.targetTab) { this.targetTab = 'package-components'; }
    this.projectId = this.route.snapshot.parent.parent.paramMap.get('id');
    this.projectDetails = this.projectService.getProjectDetails(this.projectId).pipe(shareReplay(1));
    this.packageDetails =
      this.packageDetailsLoadingTrigger.asObservable().pipe(
        switchMap(() => {
          return this.route.paramMap.pipe(
            switchMap((params: ParamMap) => {
              this.packageLinearId = params.get('id');
              return this.projectService.getAcceptancePackage(params.get('id')).pipe(
                catchError((error) => {
                  this.showLoader = false;
                  this.showWarning = true;
                  if (error.status === HttpStatusCode.NotFound) {
                    this.openDialogOnWarning({
                      title: 'Sorry',
                      message: 'This package cannot be found. You can close this window.',
                      disableRefresh: true,
                    });
                  }
                  else if (error.status === HttpStatusCode.Forbidden) {
                    this.openDialogOnWarning({
                      title: 'Access denied',
                      message: 'You do not have access to this package.',
                      disableRefresh: true,
                    });
                  }
                  else {
                    this.openDialogOnWarning();
                  }
                  console.error(error);
                  return of(error);
                }),
                tap((acceptancePackage) => {
                  const transferFailure = acceptancePackage.extendedAttributes?.find((attribute: ExtendedAttribute) => attribute.attributeName.toUpperCase() === 'b2b_transfer_failure_reason'.toUpperCase())?.attributeValue;
                  if (transferFailure) {
                    this.transferFailureReason.set(transferFailure);
                  }
                  let isActionable = true;
                  if (acceptancePackage.extendedAttributes?.length > 0) {
                    const actionableAttribute = acceptancePackage.extendedAttributes.find((attribute: ExtendedAttribute) => attribute.attributeName.toUpperCase() === 'isActionable'.toUpperCase());
                    if (!!actionableAttribute && actionableAttribute.attributeValue?.toString()?.toUpperCase() === 'FALSE') {
                      isActionable = false;
                    }
                  }
                  if (!isActionable) {
                    this.showLoader = false;
                    this.showWarning = true;
                    this.openDialogOnWarning({
                      title: 'Sorry',
                      message: `This Package cannot be found. \n
                      Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.`,
                      disableRefresh: true,
                      actionOn: 'FAQ'
                    });
                    return of(undefined);
                  } else {
                    this.title = acceptancePackage.name;
                    this.packageStatus = acceptancePackage.status || 'Unknown';
                    this.isMultiLevelAcceptance = acceptancePackage.isMultiLevelAcceptance;
                    this.approvalRule = acceptancePackage.approvalRule;
                    this.packageType = acceptancePackage.packageType;
                    this.siteList = acceptancePackage.extendedAttributes?.find((attribute: ExtendedAttribute) => attribute.attributeName.toUpperCase() === 'sites'.toUpperCase())?.attributeValue;
                    this.projectEventService.acceptancePackageChange.next(acceptancePackage);
                    this.isBlockchainValidationRequired = localStorage.getItem('isBlockChainValidate')
                      && localStorage.getItem('isBlockChainValidate').toLowerCase() === 'true'
                      && acceptancePackage.isTrustRequired;
                    const userSessionSubscription = this.projectEventService.userSessionChange.subscribe(currentUser => {
                      const packageUserGroups = acceptancePackage.users;
                      this.packageService.currentPackageUserGroups.next(packageUserGroups);
                      if (currentUser.roleType.includes(RoleType.ProjectAdmin)) {
                        this.packageService.currentPackageUser.next({
                          userId: currentUser.signum,
                          name: currentUser.firstName + ' ' + currentUser.lastName,
                          email: currentUser.emailId,
                          userRole: RoleInPackage.EricssonContributor,
                          userAction: undefined
                        });
                      } else {
                        const searchUserList = (userList): PackageUser => {
                          if (userList && userList.length > 0) {
                            const user = userList.find(user => user.userId.toUpperCase() === currentUser.signum.toUpperCase());
                            return user;
                          }
                          return undefined;
                        }
                        const searchGroupList = (groupList): [PackageUser, PackageGroup] => {
                          if (groupList && groupList.length > 0) {
                            let user;
                            let groupOfUser;
                            for (let index = 0; index < groupList.length; index++) {
                              user = searchUserList(groupList[index].userList);
                              if (user) {
                                groupOfUser = groupList[index];
                                break;
                              }
                            }
                            if (user) {
                              return [user, groupOfUser];
                            }
                            else {
                              return [undefined, undefined];
                            }
                          }
                          return undefined;
                        }

                        for (let index = 0; index < packageUserGroups.length; index++) {
                          const packageUserGroup = packageUserGroups[index];
                          const userRole = packageUserGroup.userRole;
                          let user;
                          let groupOfUser;
                          if (packageUserGroup.userList) {
                            user = searchUserList(packageUserGroup.userList);
                            if (user) {
                              this.packageService.currentPackageUser.next({ userRole, ...user });
                              break;
                            }
                          }

                          if (packageUserGroup.groupList) {
                            // get current user if exist in the group and also its PackageGroup
                            [user, groupOfUser] = searchGroupList(packageUserGroup.groupList);
                            if (user) {
                              this.packageService.currentPackageUser.next({ userRole, ...user });
                              // only when groupAction is pending, enable for current user , who is member of that group
                              // so that he can approve/reject/comment/do operations on that package
                              if (groupOfUser && groupOfUser.groupAction === PackageMemberAction.PENDING) {
                                // elevate user for action pending state
                                user.userAction = PackageMemberAction.PENDING;
                                this.packageService.currentPackageUser.next({ userRole, ...user });
                              }
                              break;
                            }
                          }

                          if (packageUserGroup.levels && packageUserGroup.levels.length > 0) {
                            for (let index = 0; index < packageUserGroup.levels.length; index++) {
                              const packageUserLevel = packageUserGroup.levels[index];
                              if (packageUserLevel.userList) {
                                user = searchUserList(packageUserLevel.userList);
                                if (user) {
                                  this.packageService.currentPackageUser.next({ userRole, ...user });
                                  break;
                                }
                              }

                              if (packageUserLevel.groupList) {
                                // get current user if exist in the group and also its PackageGroup
                                [user, groupOfUser] = searchGroupList(packageUserLevel.groupList);
                                if (user) {
                                  this.packageService.currentPackageUser.next({ userRole, ...user });
                                  // only when groupAction is pending, enable for current user , who is member of that group
                                  // so that he can approve/reject/comment/do operations on that package
                                  if (groupOfUser && groupOfUser.groupAction === PackageMemberAction.PENDING) {
                                    // elevate user for action pending state
                                    user.userAction = PackageMemberAction.PENDING;
                                    this.packageService.currentPackageUser.next({ userRole, ...user });
                                  }
                                  break;
                                }
                              }
                            }
                            if (user) break;
                          }
                        }
                      }
                    });
                    this.subscription.add(userSessionSubscription);

                    this.showLoader = false;
                    if (acceptancePackage.status === CustomerAcceptanceStatus.CustomerReworked) {
                      this.reworkedPackage = true;
                    }
                    if (
                      [
                        CustomerAcceptanceStatus.CustomerApproved, CustomerAcceptanceStatus.DeemedApproved, CustomerAcceptanceStatus.AcceptanceDocumentInitiate,
                        CustomerAcceptanceStatus.AcceptanceDocumentReady, CustomerAcceptanceStatus.AcceptanceDocumentSent,
                        CustomerAcceptanceStatus.AcceptanceDocumentSendFailed, CustomerAcceptanceStatus.Abandoned
                      ].includes(acceptancePackage.status)
                    ) {
                      this.isPackageCompleted = true;
                    }
                    if (
                      [
                        CustomerAcceptanceStatus.CustomerNew, CustomerAcceptanceStatus.CustomerRevision, CustomerAcceptanceStatus.CustomerReworked
                      ].includes(acceptancePackage.status)
                    ) {
                      this.disabledSubmissionPackage = false;
                    }
                    else {
                      this.disabledSubmissionPackage = true;
                    }
                    if (acceptancePackage.status === CustomerAcceptanceStatus.CustomerNewPendingApproval || acceptancePackage.status === CustomerAcceptanceStatus.CustomerReworkedPendingApproval) {
                      const userActionInProgressSubscription = this.packageService.currentPackageUserActionInProgress.subscribe({
                        next: (isInProgress) => this.disabledSubmissionDecision = !isInProgress,
                      });
                      this.subscription.add(userActionInProgressSubscription);
                    }
                    else {
                      this.disabledSubmissionDecision = true;
                    }
                  }
                }),
                map((acceptancePackage) => acceptancePackage),
              );
            })
          );
        })
      );
  }

  ngAfterViewInit(): void {
    const tabs = document.querySelectorAll('.tabs');
    if (tabs) {
      Array.from(tabs).forEach(tabsDom => {
        const tabGroup = new TabGroup(tabsDom as HTMLElement);
        tabGroup.init();
        this.scripts.push(tabGroup);
      });
    }
  }

  ngOnDestroy(): void {
    this.packageService.currentPackageUser.next(undefined);
    this.subscription.unsubscribe();
    if (this.warningDialog) {
      this.warningDialog.dialog.hide();
      this.warningDialog.dialog.destroy();
    }
  }

  public openTab(acceptancePackageTab: string): void {
    this.targetTab = acceptancePackageTab;

    const urlTree = this.router.createUrlTree([], { /* Removed unsupported properties by Angular migration: skipLocationChange. */ relativeTo: this.route,
      queryParams: { acceptancePackageTab }
    });
    this.location.replaceState(urlTree.toString());
  }

  public openDialogOnWarning(dialogData?: { title: string, message: string, disableRefresh?: boolean, actionOn?: string }): void {
    const data = dialogData || {
      title: 'Sorry',
      message: 'Something went wrong. Please click on Refresh to try again',
    };
    const dialogComponentRef = this.dialogService.createDialog(WarningDialogComponent, data);
    this.warningDialog = dialogComponentRef.instance;
  }

  /**
   * @param permission permission to check
   * @returns boolean whether that permission is granted
   */
  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  isEditSupported(sourceTool: SourceTool): boolean {
    return this.projectService.isProjectPackageManagementInternal(sourceTool);
  }

  isReworkSupported(sourceTool: SourceTool): boolean {
    return this.projectService.isProjectPackageManagementInternal(sourceTool);
  }

  isSubmitPackageSupported(sourceTool: SourceTool): boolean {
    return this.projectService.isProjectPackageSubmissionSupported(sourceTool);
  }

  /**
   * open dialog to submit a package decision to customer approver
   *
   */
  public onSubmitDecision(): void {
    this.disabledSubmissionDecision = true;
    this.mapPackageSuggestionStatusToBoolean().subscribe(data => {
      if (data) {
        this.handleSubmitPackageVerdictDialog();
      }
      else {
        this.disabledSubmissionDecision = false;
        this.notificationService.showNotification({
          title: 'Package is not finished',
          description: 'Please follow the FAQ doc for further steps. '
        });
      }
    })
  }

  private handleSubmitPackageVerdictDialog(): void {
    const dialogRef = this.dialogService.createDialog(
      SubmitPackageVerdictDialogComponent
    );
    dialogRef.instance.dialogResult.subscribe((result: any) => {
      if (result) {
        const statusPayload: SubmitAcceptancePackagesRequest = {
          status: result.verdict,
          packageIds: [this.packageLinearId]
        };
        if (result.comment) statusPayload.comment = result.comment;
        this.handleDialogResult(
          this.projectService.submitAcceptancePackages(statusPayload),
          'Acceptance package decision successfully submitted!',
          'Error when submitting the decision for the acceptance package!',
          'Submitting decision',
          result.verdict
        );
      } else {
        this.disabledSubmissionDecision = false;
      }
    });
  }

  mapPackageSuggestionStatusToBoolean(): Observable<boolean> {
    return of(true);
    // TODO: enable validation of package status once BE provides the endpoint
    // return this.projectService.getPackageStatus(this.packageLinearId).pipe(
    //   map((data: PackageStatus) => {
    //     // Perform necessary checks on the data and return a boolean value
    //     if (data.currentStatus === data.suggestedStatus) {
    //       return false;
    //     }
    //     else {
    //       return true;
    //     }
    //   })
    // );
  }

  /**
   * open dialog to submit a package to customer
   *
   */
  public onSubmitPackage(): void {
    const dialogRef = this.dialogService.createDialog(
      SubmitPackageDialogComponent,
    );

    const self = this;

    dialogRef.instance.dialogResult.subscribe((result: string) => {
      let status = 'Customer New-Pending Approval';
      if (this.reworkedPackage) {
        status = 'Customer Reworked-Pending Approval';
      }
      const statusPayload: SubmitAcceptancePackagesRequest = {
        status,
        packageIds: [self.packageLinearId]
      };
      if (result) statusPayload.comment = result;

      self.handleDialogResult(
        self.projectService.submitAcceptancePackages(statusPayload),
        'Acceptance package successfully submitted to customer!',
        'Error when submitting the acceptance package to customer!',
        'Submitting package',
        null
      );
    });
  }

  handleDialogResult(submitMethod: Observable<any>, successMessage: string,
    errorMessage: string, loadingTitle: string, resultVerdict: string): void {
    this.disabledSubmissionDecision = true;
    this.disabledSubmissionPackage = true;
    const self = this;
    const dialogData: DialogData = {
      dialogueTitle: loadingTitle, show: APICallStatus.Loading
    };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    const submit = submitMethod.pipe(
      map(() => 'success'),
      catchError((err: HttpErrorResponse) => {
        dialogMessage.instance.show = APICallStatus.Error;
        if (err.status === HttpStatusCode.BadRequest) {
          if (err?.error?.responseMessageDescription.includes('::')) {
            const [message, details] = err?.error?.responseMessageDescription.split('::') || [errorMessage, '']
            dialogMessage.instance.additionalMessage = message;
            dialogMessage.instance.errorDetailList = details?.includes(',') ? this.splitIgnoringCommasInBrackets(details) : [];
          } else {
            dialogMessage.instance.statusMessage = err?.error?.responseMessageDescription || errorMessage;
          }
          dialogMessage.instance.dialogueTitle = 'Failed to submit!';


          // push notification for the error message
          self.notificationService.showNotification({
            title: 'Failed to submit!',
            description: errorMessage
          });
        } else {
          let additionalMessage = '';
          if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
            // push notification for the error message
            this.notificationService.showNotification({
              title: 'Failed to submit!',
              description: errorMessage + ' Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
            }, true);

            additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
          } else {
            // push notification for the error message
            this.notificationService.showNotification({
              title: 'Failed to submit!',
              description: errorMessage + ' Please follow the FAQ doc for further steps.'
            }, true);

            additionalMessage = '\n Please follow the FAQ doc for further steps.';
          }
          dialogMessage.instance.statusMessage = errorMessage + additionalMessage;
          dialogMessage.instance.dialogueTitle = 'Failed to submit!';
          dialogMessage.instance.additionalMessage = '';
          dialogMessage.instance.actionOn.next('FAQ');
        }

        console.log(err);
        self.disabledSubmissionDecision = false;
        this.disabledSubmissionPackage = false;

        return of(undefined);
      }),
    );

    // Service call for creating the package
    submit.subscribe((result) => {
      if (result) {
        // open modal popup with success message
        dialogMessage.instance.show = APICallStatus.Success;
        dialogMessage.instance.statusMessage = successMessage;
        dialogMessage.instance.dialogueTitle = 'Successfully submitted';

        // do the router navigation based on package status and not the verdict 
        this.projectService.getAcceptancePackage(this.packageLinearId).subscribe({
          next: (packageValidateRes: PackageDetails) => {
            if (packageValidateRes?.status === CustomerAcceptanceStatus.CustomerApproved || packageValidateRes?.status === CustomerAcceptanceStatus.DeemedApproved) {
              // stay on Completed , as the approved package is added to Completed tab
              self.router.navigate([`projects/${self.projectId}/acceptance-packages`],
                {
                  queryParams: { acceptancePackagesTab: 'Completed' },
                });
            } else {
              // stay on InProgress , as the rejected package is added to In Progress tab
              self.router.navigate([`projects/${self.projectId}/acceptance-packages`],
                {
                  queryParams: { acceptancePackagesTab: 'InProgress' },
                });
            }
          },
          error: (err: HttpErrorResponse) => {
            self.router.navigate([`projects/${self.projectId}/acceptance-packages`]);
          },
        });
        // push notification for the success message
        self.notificationService.showNotification({
          title: successMessage,
        });
        self.disabledSubmissionDecision = false;
      }
    });
  }

  onEditPackage(): void {
    this.router.navigate([`/projects/${this.projectId}/acceptance-packages/${this.packageLinearId}/edit`]);
  }

  onReworkPackage(): void {
    this.router.navigate([`/projects/${this.projectId}/acceptance-packages/${this.packageLinearId}/rework`]);
  }

  onAbandonPackage(): void {
    const dialog = this.dialogService.createDialog(
      AbandonAcceptancePackageDialogComponent,
      {
        packageLinearId: this.packageLinearId
      }
    );
    dialog.instance.dialogResult.pipe(take(1)).subscribe({
      next: (result) => {
        if (result === true) {
          this.router.navigate([`/projects/${this.projectId}/acceptance-packages`]);
        }
      }
    });
  }

  isPackageUpdated(event: boolean): void {
    if (event) {
      this.mapPackageSuggestionStatusToBoolean().subscribe(data => {
        if (data) {
          this.disabledSubmissionDecision = false;
        }
        else {
          this.disabledSubmissionDecision = true;
        }
      })
    }
  }

  public validate(): void {
    if (this.packageLinearId) {
      const dialogData: DialogData = { show: 1, dialogueTitle: 'Acceptance package validation' };
      const dialogRes = this.dialogService.createDialog(ValidationResDialogComponent, dialogData);
      this.projectService.getPackageValidationStatus(this.packageLinearId).subscribe({
        next: (packageValidateRes: PackageValidateResponse) => {
          dialogRes.instance.validationResult = packageValidateRes.status
          dialogRes.instance.statusMessage = packageValidateRes.message;
          if (packageValidateRes.status === 'Success') {
            dialogRes.instance.iconStatus = 'icon-check';
            this.packageDetails.subscribe((packageDetail: PackageDetails) => {
              dialogRes.instance.bcDetailWho = packageDetail.lastModifiedBy
              dialogRes.instance.bcDetailWhen = new Date(packageDetail.lastModifiedDate).toLocaleString()
              dialogRes.instance.bcDetailWhat = this.packageStatus
              dialogRes.instance.show = 2;
            })
          } else {
            dialogRes.instance.iconStatus = 'icon-cross';
            dialogRes.instance.show = 2;
          }
        },
        error: (err: HttpErrorResponse) => {
          dialogRes.instance.validationResult = 'Failure'
          dialogRes.instance.iconStatus = 'icon-cross';
          dialogRes.instance.statusMessage = 'Validation result not determined, please refer FAQ for details'
          dialogRes.instance.show = 2;
        },
      });
    }
  }

  onTransferEvidences(event: MouseEvent): void {
    const button = event.target as HTMLButtonElement;
    const submitTransfer = (packageId: string, evidenceIds: string[], selectedReports: TransferPackageReportType[]): Observable<string> => {
      return this.projectService.transferPackageEvidences(packageId, evidenceIds, selectedReports).pipe(
        tap(() => {
          this.notificationService.showNotification({
            title: 'Request to transfer evidences to customer system is triggered successfully!'
          });
        }),
        catchError((err: HttpErrorResponse) => {
          this.notificationService.showNotification({
            title: 'Error when transferring evidences to customer system!',
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
          console.error(err);
          return throwError(() => err);
        }),
      );
    };

    if (this.packageStatus === CustomerAcceptanceStatus.AcceptanceDocumentSendFailed) {
      button.classList.add('loading');
      button.disabled = true;
      // In case of re-triggering transmission, user dose not need to select the evidences again and an empty list is put in the request
      this.subscription.add(submitTransfer(this.packageLinearId, [], []).subscribe({
        next: () => {
          button.classList.remove('loading');
        },
        error: (err: HttpErrorResponse) => {
          button.classList.remove('loading');
          button.disabled = false;
        },
      }));
    }
    else if (this.packageStatus === CustomerAcceptanceStatus.CustomerApproved || this.packageStatus === CustomerAcceptanceStatus.DeemedApproved) {
      // Pop up for evidence selection
      const dialogRef = this.dialogService.createDialog(TransferEvidencesDialogComponent, { packageId: this.packageLinearId, submit: submitTransfer });
      this.subscription.add(dialogRef.instance.dialogResult.subscribe((result: boolean) => {
        if (result) button.disabled = true;
      }));
    }
  }

  /**
   * utility function to take care of split by comma, but exclusion case when comma is inside brackets
   * @param input
   * @returns splitted string
   */
  splitIgnoringCommasInBrackets(input: string): string[] {
    const result: string[] = [];
    let current = '';
    let bracketCount = 0;

    for (const char of input) {
      if (char === '[') {
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
      } else if (char === ',' && bracketCount === 0) {
        result.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }

    if (current) {
      result.push(current.trim());
    }

    return result;
  }
}

