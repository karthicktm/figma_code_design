export interface PageInfo {
  totalRecords: number;
  totalPages: number;
  currentRecordCount: number;
  currentPage: number;
  nextOffset: number;
  morePages: boolean;
}

export interface GetDashboardPackagesResponse extends PageInfo {
  results: DashboardPackageRow[];
}

export interface DashboardPackageRow {
  packageName: string;
  scope: string;
  arrivalDate: string;
  dueDateForReview: string;
  aging: number;
  multiLevelAcceptance: string;
  lastModifiedBy: string;
  lastModifiedDate: string
}

export interface GetDashboardCertificatesResponse extends PageInfo {
  results: DashboardCertificateRow[];
}

export interface DashboardCertificateRow {
  requestName: string;
  scope: string;
  arrivalDate: string;
  decisionDate: string;
  aging: number;
  multiLevelAcceptance: string;
}

export interface PackagesCount {
  rejected: number;
  approved: number;
  pendingSLAOverdue: number;
  pendingNoSLAOverdue: number;
}

export interface CertificatesCount {
  signed: number;
  rejected: number;
  pending: number;
}
