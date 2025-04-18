import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { PackageMemberAction, PackageUser, PackageUserGroup } from '../projects.interface';

export enum RoleInPackage {
  EricssonContributor = 'Ericsson Contributor',
  EricssonApprover = 'Ericsson Approver',
  CustomerApprover = 'Customer Approver',
  CustomerObserver = 'Customer Observer',
  None = 'NONE'
}

export enum ComponentActionPermission {
  CreateNewEvidence = 'create-new-evidence',
  CreateNewReferenceDoc = 'create-new-reference-document',
  AcceptancePackageReport = 'acceptance-package-report',
  SubmitButtonForContributor = 'submit-for-contributor',
  SubmitButtonForApprover = 'submit-for-approver',
  AcceptRejectAllButton = 'accept-reject-all-button',
  PackageEvidenceSourceReport = 'package-evidence-source-report',
  ViewDownloadPackageButton = 'view-download-package-button',
  CreateDocument = 'create-document',
  PackageListEditPackage = 'edit-package',
  PackageListReworkPackage = 'rework-package',
  PackageListAbandonPackage = 'abandon-package',
  EditEvidenceMarkings = 'edit-markings',
  AddUser = 'add-user',
  DownloadReports = 'download-reports',
  TransferEvidences = 'transfer-evidences'
}

@Injectable({
  providedIn: 'root'
})
export class AcceptancePackageService {
  private packageRole: string;
  currentPackageUserGroups: ReplaySubject<PackageUserGroup[]> = new ReplaySubject(1);
  currentPackageUser: ReplaySubject<PackageUser> = new ReplaySubject(1);
  currentPackageUserActionInProgress: ReplaySubject<boolean> = new ReplaySubject(1);
  private updatePackageStatusSubject = new Subject<string>();
  public updatePackageStatus = this.updatePackageStatusSubject.asObservable();
  roleDefinitions = [
    {
      role: RoleInPackage.EricssonContributor,
      permissions: [
        ComponentActionPermission.SubmitButtonForContributor,
        ComponentActionPermission.CreateNewEvidence,
        ComponentActionPermission.CreateNewReferenceDoc,
        ComponentActionPermission.PackageEvidenceSourceReport,
        ComponentActionPermission.ViewDownloadPackageButton,
        ComponentActionPermission.AcceptancePackageReport,
        ComponentActionPermission.PackageListEditPackage,
        ComponentActionPermission.PackageListReworkPackage,
        ComponentActionPermission.PackageListAbandonPackage,
        ComponentActionPermission.AddUser,
        ComponentActionPermission.DownloadReports,
        ComponentActionPermission.TransferEvidences,
      ]
    },
    {
      role: RoleInPackage.CustomerApprover,
      permissions: [
        ComponentActionPermission.SubmitButtonForApprover,
        ComponentActionPermission.AcceptRejectAllButton,
        ComponentActionPermission.ViewDownloadPackageButton,
        ComponentActionPermission.CreateNewReferenceDoc,
        ComponentActionPermission.AcceptancePackageReport,
        ComponentActionPermission.EditEvidenceMarkings,
        ComponentActionPermission.DownloadReports
      ]
    },
    {
      role: RoleInPackage.CustomerObserver,
      permissions: [
        ComponentActionPermission.ViewDownloadPackageButton,
        ComponentActionPermission.DownloadReports
      ]
    },
    {
      role: RoleInPackage.None,
      permissions: [
      ]
    },
  ];
  constructor(
  ) {
    this.currentPackageUser.subscribe(packageUser => {
      this.packageRole = packageUser?.userRole;
      if (packageUser === undefined || packageUser.userRole !== 'Customer Approver' || packageUser.userAction !== PackageMemberAction.PENDING) {
        this.currentPackageUserActionInProgress.next(false);
      }
      else
        this.currentPackageUserActionInProgress.next(true);
    });

  }

  /**
   * Given a specific permission, it is verified if the current logged user
   * has the required permission.
   *
   * @param permission permission to check
   */
  public isUserAuthorizedInPackage(permission: string): Observable<boolean> {
    const userRoleInPackage = this.packageRole ? this.packageRole : RoleInPackage.None;
    const isUserAuthorizedInPackage = permission ? !!this.roleDefinitions.find(r => r.role === userRoleInPackage)
      .permissions.find((userPermission: string) => userPermission === permission) : true;
    return of(isUserAuthorizedInPackage);
  }

  public emitPackageStatusUpdate(event: any): void {
    this.updatePackageStatusSubject.next(event);
  }
}
