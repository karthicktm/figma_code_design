import { RoleType } from '../group-management/group-management-interfaces';

/**
 * Interface definition for acceptance projects.
 */
export interface Project {
  projectId: string;
  customerId: string;
  projectName: string;
  fasid: string;
  customer?: string;
  projectType?: string;
  projectExecutionCountry?: string;
  projectActualStartDate?: string;
  projectActualEndDate?: string;
  status: string;
  importStatus?: string;
  [key: string]: [] | any;
}

export interface ProjectShort {
  customerName: string;
  customerId: string,
  projectId: string,
  projectName: string,
  projectExecutionCountry: string,
  projectAdmins: string[],
  projectActualStartDate: string,
  projectActualEndDate: string,
  sourceTool: string | SourceTool,
  status: string,
  createdDate: string,
  lastModifiedBy: string,
  lastModifiedDate: string;
}

export enum SourceTool {
  siteTracker = 'Site Tracker',
  dpm = 'DPM',
  eritop = 'ERITOP',
}

// TODO: keeping reference for project event service. To be deleted with other unused interfaces during code clean-up.
export interface SiteInfo {
  siteId: string;
  siteName: string;
  forceUpdate?: boolean;
  name: string;
}

export interface ActiveItem {
  itemId: string;
  itemLevelName?: string;
  workplanLinearId?: string;
  mappedToLinearId?: string;
  mappedToLevelName?: string;
}

export interface SiteStructure {
  workplanId: string;
  workplanName: string;
  systemGeography: string;
  workplanActualStartDate: string;
  workplanActualEndDate?: string;
  workplanStatus: string;
  [key: string]: [] | any;
  networkElementId: String;
  internalId: string;
  name: string;
  networkSiteName: string;
  latitude: number;
  longitude: number;
  provider: string;
}

interface SiteDetails {
  siteId: string;
  siteName: string;
  hierrachyPath: string;
  siteSysRecId: string;
}

/**
 * Reflecting the structure of a checklist
 */
export interface ChecklistDetail {
  checklistId: string;
  workItemId: string;
  name: string;
  description: string;
  isExecutionRequired: boolean;
  isAcceptanceRequired: boolean;
  categoryId: string;
  categoryName: string;
  status: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
  extendedAttributes: ExtendedAttribute[];
  evidences: string[];
  lineItems: LineItem[];
}

export interface ProjectUser {
  firstName: string;
  lastName: string;
  emailId: string;
  userId: string;
  userRole: string;
  belongsTo: string;
  domain?: string;
  overallUserApprovalStatus?: string;
  orderNumber?: number;
  groupId?: string;
}

export interface User {
  usersessionLinearId: string;
  userId: string;
  firstName: string;
  lastName: string;
  emailId: string;
  trigram: string;
  roleId: string;
  roleType: string;
  belongsTo: string;
  sessionSettings: string;
  projectMapped: [];
  creationTime: string;
  updationTime: string;
  state: string;
}

export enum PackageMemberAction {
  UNASSIGNED = 'UnAssigned',
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface PackageUser {
  userAction?: PackageMemberAction;
  email: string;
  userId: string;
  name: string;
  userRole?: string;
}

export interface PackageGroup {
  groupAction?: PackageMemberAction;
  name: string;
  userList?: PackageUser[];
}

export interface PackageUserLevel {
  levelId: number;
  userList?: PackageUser[];
  groupList?: PackageGroup[];
  levelAggAction?: PackageMemberAction;
  levelAggDetail?: string;
}

export interface PackageUserGroup {
  groupList?: PackageGroup[];
  userList?: PackageUser[];
  levels?: PackageUserLevel[];
  userRole: string;
}

export interface Comment {
  fromEmailId: string;
  toEmailId: string;
  date: string;
  comment: string;
  isInternal: boolean;
  level: string;
  modifiedDateTime: string;
}

export enum ApprovalStatus {
  toBeInitiated = 'TO BE INITIATED',
  awaitingApproval = 'AWAITING APPROVAL',
  approved = 'APPROVED',
  rejected = 'REJECTED',
}

export type PackageRole = 'APPROVER' | 'OBSERVER' | 'CONTRIBUTOR';

export interface UserSession {
  firstName: string;
  lastName: string;
  emailId: string;
  signum: string;
  userType: 'ERICSSON' | string;
  roleType: RoleType[] | string[];
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
  customerApiUrl?: string;
}

export interface UsersProjects {
  projectDetails: ProjectDetails;
  userRoleInProject: PackageRole;
}

// START compose package network rollout request
export interface ComposeAcceptancePackageUserRequest {
  userList: string[] | string[][];
  userRole: string;
}

export interface ComposeAcceptancePackageLevelUserRequest extends ComposeAcceptancePackageUserRequest {
  levelId: number;
}

export interface ComposeAcceptancePackageRequest {
  name: string;
  packageType: string;
  description?: string;
  isMultiLevelAcceptance: boolean;
  approvalType?: 'Ericsson' | 'Customer' | 'Both';
  approvalSequence?: 'Serial' | 'Parallel';
  approvalMode?: 'Automatic' | 'Manual';
  users?: ComposeAcceptancePackageUserRequest[];
  extendedAttributes?: ExtendedAttribute[];
  packageEvidences?: string[];
  integrateToB2B?: boolean;
  lineItems?: string[];
  status?: string;
  isMilestoneAcceptance: boolean;
  isWorkplanBased: boolean;
  milestoneIds?: string[];
  levels?: ComposeAcceptancePackageLevelUserRequest[];
}
// END compose package network rollout request

export interface ReworkAcceptancePackageRequest {
  lineItems?: string[];
  packageEvidences?: string[];
  milestoneEvidences?: string[];
}

export interface PackageDetails {
  approvalSequence: 'Serial' | 'Parallel';
  projectId: string;
  packageId: string;
  name: string;
  description?: string;
  packageType?: string;
  approvalType?: 'Ericsson' | 'Customer' | 'Both';
  approvalMode?: 'Automatic' | 'Manual';
  sla?: string;
  slaType?: string;
  reworkType?: string;
  extendedAttributes?: ExtendedAttribute[];
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
  users?: PackageUserGroup[];
  approvalRule: string;
  rulesetId: string;
  workflowId: string;
  isTrustRequired: boolean;
  isMilestoneAcceptance: boolean;
  status: CustomerAcceptanceStatus;
  isMultiLevelAcceptance: boolean;
  integrateToB2B?: boolean;
  isWorkplanBased: boolean;
}

export interface ApproverListNotification {
  packageLinearId: string;
  packageName: string;
  projectLinearId: string;
  projectId: string;
  approverDetails: {
    belongsTo: string;
    emailId: string;
    firstName: string;
    lastName: string;
    roleName: string;
    orderIndex: number;
    slaStart: boolean;
    dueDate: string;
    noOfRemainders: number;
    overallUserApprovalStatus: ApprovalStatus;
  };
}

export interface FilterOptions {
  key: string;
  label: string;
}

export interface Customer {
  customerId: string;
  customerName: string;
  globalCustomerUnit: string;
  customerDescription?: string;
  region: string;
  subRegion: string;
  country: string;
  city: string;
  state: string;
  customerEmailDomains: string[];
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
}

export interface ProjectDetails {
  sourceTool: string | SourceTool;
  projectId: string;
  projectName: string;
  projectExecutionCountry: string;
  status: string;
  projectType: string;
  projectCreatedDate: string;
  projectPlannedStartDate: string;
  projectPlannedEndDate: string;
  projectActualStartDate: string;
  projectActualEndDate: string;
  importStatus: string;
  creationTime: string;
  modifiedTime: string;
  comments: string;
  emailId: string;
  fasid: string;
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
  extendedAttributes: ExtendedAttribute[];
  packageCreationAllowed: boolean;
  customerId: string;
}

export enum ApprovalRuleOption {
  ON = 'Aggregate',
  OFF = 'Do not aggregate'
}

export interface ImportProjectsRequest {
  customerId: string;
  projectId: string;
  approvalRule: ApprovalRuleOption | string;
  workflowId: string;
  acceptancePackageRuleId: string;
  approvalSequence: string;
  reworkType: string;
}

export interface PageInfo {
  totalRecords: number
  nextOffset: number;
  morePages: boolean;
}

export interface GetProjectsResponse extends PageInfo {
  totalRecords: number;
  results: Project[];
  userRole: string;
}

export interface GetProjectsShortResponse extends PageInfo {
  totalRecords: number;
  results: ProjectShort[];
  userRole: string;
}

export interface GetPackagesResponse extends PageInfo {
  totalRecords: number;
  results: PackagesEntry[];
  userRole: string;
}

export interface PackagesEntry {
  packageId: string;
  externalId?: string;
  projectId: string;
  name: string;
  packageType: string;
  status: CustomerAcceptanceStatus;
  myLevelStatus: CustomerMultiLevelActionStatus;
  levelId: number;
  createdBy: string;
  /** Date string in ISO format */
  createdDate: string;
  lastModifiedBy: string;
  /** Date string in ISO format */
  lastModifiedDate: string;
  submittedBy: string;
  submittedDate: string;
  dueDate: string;
  sitesInScope: string;
  integrateToB2B?: boolean;
  selected: boolean;
}

export interface Package {
  packageId: string;
  projectId: boolean;
  name: string;
  description: string;
  packageType: string;
  createdDate: string;
  status: CustomerAcceptanceStatus;
  createdBy: string;
  extendedAttributes: ExtendedAttribute[];
  users: PkgUser[];
  rulesetId: string;
  workflowId: string;
  SLA: number;
  approvalType?: 'Ericsson' | 'Customer' | 'Both';
}

export interface PkgUser {
  userList: string[];
  userRole: string;
}

export interface ProjectSite {
  internalId: string;
  siteName: string;
  siteType: string;
  siteIdByCustomer: string;
  siteNameByCustomer: string;
  networkElementName: string;
  networkElementType: NetworkElementType;
}

export interface ProjectSitesResponse extends PageInfo {
  currentRecordCount: number;
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  results: ProjectSite[];
}

export interface ProjectStructureResponse extends PageInfo {
  currentRecordCount: number;
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  results: ProjectStructure[];
}

export interface ProjectStructure {
  selected?: boolean;
  internalId: string;
  networkSiteId: string;
  networkElementName: string;
  networkElementId?: string;
  networkSiteName: string;
  networkSiteElementId: string;
  latitude: string;
  longitude: string;
  siteIdByCustomer?: string,
  siteNameByCustomer?: string,
  siteType: string
  extendedAttributes: ExtendedAttribute[];
  workItems: {
    internalId: string,
    workItemId: string,
    workItemName: string
  }[];
}

export interface ProjectStructureShortResponse extends PageInfo {
  currentRecordCount: number;
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  results: ProjectStructureShort[];
}

export interface ProjectStructureShort {
  internalId: string;
  networkSiteId: string;
  networkSiteName: string;
  latitude: string;
  longitude: string;
  siteIdByCustomer?: string,
  siteNameByCustomer?: string,
  siteType: string
  extendedAttributes: ExtendedAttribute[];
  [key: string]: any;
}

export interface LineItemDetailsView {
  internalId: string;
  lineItemId: string;
  lineItemName: string;
  description: string;
  acceptanceCriteria: string;
  status: CustomerAcceptanceStatus;
  priority: number;
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
  extendedAttributes: ExtendedAttribute[];
  evidences?: EvidenceDetails[];
}

export interface LineItemDetails {
  internalId: string;
  lineItemId: string;
  lineItemName: string;
  description: string;
  acceptanceCriteria: string;
  status: CustomerAcceptanceStatus;
  priority: number;
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
  extendedAttributes: ExtendedAttribute[];
  evidences?: string[];
}

export interface LineItemInfo {
  internalId: string;
  lineItemId: string;
  lineItemName: string;
  description: string;
  acceptanceCriteria: string;
  status: CustomerAcceptanceStatus;
  priority: number;
  isAcceptanceRequired: boolean;
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  extendedAttributes: ExtendedAttribute[];
}

export interface LineItemResponse extends PageInfo {
  totalRecords: number;
  results: PackageLineItem[];
  userRole: string;
}

export interface LineItem {
  /** Unique id */
  internalId: string;
  /** externally maintained id */
  lineItemId: string;
  workItemId: string;
  checkListId: string;
  description: string;
  acceptanceCriteria: string;
  status: string;
  priority: string;
  isExecutionRequired: boolean;
  isAcceptanceRequired: boolean;
  evidences: string[];
  extendedAttributes: ExtendedAttribute[];
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
  [key: string]: any;
  packageId: string;
  siteName: string;
  siteIdByCustomer: string;
  workplanName: string;
  customerScopeId: string;
  workplanCategory: string;
}

export interface PackageLineItem {
  internalId: string;
  id: string;
  name: string;
  description: string;
  status: CustomerAcceptanceStatus;
  myLevelStatus?: CustomerMultiLevelActionStatus;
  pendingEvidenceCount: number;
  rejectedEvidenceCount: number;
  approvedEvidenceCount: number;
  viewOnlyEvidenceCount: number;
  lastModifiedBy: string;
  lastModifiedDate: string;
  extendedAttributes: ExtendedAttribute[];
}

export interface LineItemShortResponse extends PageInfo {
  totalRecords: number;
  results: PackageLineItemShort[];
  userRole: string;
}

export interface PackageLineItemShort {
  internalId: string;
  id: string;
  name: string;
  description: string;
  status: CustomerAcceptanceStatus;
  rejectedEvidenceCount: number;
}

export interface PackageLineItemSearchFilter {
  lineItemProperties: {
    lineItemId?: string;
    description?: string;
    name?: string;
    statuses?: string[];
  }
}

export enum CustomerAcceptanceStatus {
  CustomerNew = 'Customer New',
  CustomerRevision = 'Customer Revision',
  CustomerNewPendingApproval = 'Customer New-Pending approval',
  CustomerRejectedNoAction = 'Customer Rejected-No Action',
  CustomerRejected = 'Customer Rejected',
  CustomerReworked = 'Customer Reworked',
  CustomerReworkedPendingApproval = 'Customer Reworked-Pending approval',
  CustomerApproved = 'Customer Approved',
  Abandoned = 'Abandoned',
  CustomerAcceptanceNotRequired = 'Customer Acceptance Not Required',
  /** Newly created without evidences */
  Draft = 'Draft',
  /** Automated evidences download succeed */
  Success = 'Download Success',
  /** Automated evidences download failed */
  Failed = 'Download Failed',
  /** Applicable only for off-chain line items and evidences */
  Ready = 'Ready',
  /** Automated approval of acceptance package based on SLA as deemed approved */
  DeemedApproved = 'Deemed Approved',
  /** Statuses of B2B transmission */
  AcceptanceDocumentInitiate = 'Acceptance Document Initiate',
  AcceptanceDocumentReady = 'Acceptance Document Ready',
  AcceptanceDocumentSent = 'Acceptance Document Sent',
  AcceptanceDocumentSendFailed = 'Acceptance Document Send Failed',
}

export enum TransferPackageReportType {
  FullEvidenceReportHtml = 'FULL_EVIDENCE_HTML',
  FullEvidenceReportPdf = 'FULL_EVIDENCE_PDF',
  ApprovedEvidenceReportHtml = 'APPROVED_EVIDENCE_HTML',
  ApprovedEvidenceReportPdf = 'APPROVED_EVIDENCE_PDF',
}

export type CustomerAcceptanceStatusKey = keyof typeof CustomerAcceptanceStatus

export type EvidenceParentType = 'Project' | 'NetworkElement' | 'WorkItem' | 'CheckList' | 'LineItem' | 'AcceptancePackage'

export enum EvidenceFilter {
  NEW = 'New',
  PENDING = 'Pending approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  REWORKED = 'Reworked',
  REWORKEDPENDING = 'Reworked-Pending approval',
  VIEW_ONLY = 'View only',
  /** Ready status only applicable for off-chain evidences */
  READY = 'Ready',
  ALL = 'All'
}

export enum CustomerMultiLevelActionStatus {
  CustomerNoActionRequired = 'Customer No Action Required',
  CustomerAwaiting = 'Customer Awaiting',
  NotApplicable = 'Not Applicable',
  CustomerNewPendingApproval = 'Customer New-Pending approval',
  CustomerRejectedNoAction = 'Customer Rejected-No Action',
  CustomerRejected = 'Customer Rejected',
  CustomerReworkedPendingApproval = 'Customer Reworked-Pending approval',
  CustomerApproved = 'Customer Approved',
  CustomerAcceptanceNotRequired = 'Customer Acceptance Not Required',
  DeemedApproved = 'Deemed Approved',
}

export enum PackageLevel {
  MultiLevel = 'Multi-level',
  SingleLevel = 'Single-level',
}

export interface Evidence {
  createdBy: string;
  createdDate: string;
  /** externally maintained id */
  evidenceId: string;
  evidenceType?: string;
  extendedAttributes: ExtendedAttribute[];
  fileHash: string;
  fileMIMEType: string;
  fileSizeInKB?: number;
  /** Unique id */
  internalId: string;
  isAcceptanceRequired: boolean;
  isDeletionAllowed?: boolean;
  isSoftDeleted: boolean;
  lastModifiedBy: string;
  lastModifiedDate: string;
  latitude: string;
  lineItemId?: string;
  longitude: string;
  name: string;
  parentEvidenceId?: string;
  /** parent component id */
  parentId?: string;
  /** parent component type */
  parentType?: EvidenceParentType;
  relatedEvidences?: (Evidence | RelatedEvidence)[];
  remarks?: string;
  scope?: string;
  status: CustomerAcceptanceStatus;
  myLevelStatus?: CustomerMultiLevelActionStatus;
  tag: string;
  type: string;
  url: string;
  description?: string;
  packageStatus?: CustomerAcceptanceStatus;
}

export interface EvidenceRequest {
  /** externally maintained id */
  evidenceId?: string | undefined;
  name: string;
  projectId: string;
  type: 'Image' | 'Video' | 'Document' | 'Archive' | string | undefined;
  scope: string;
  fileMIMEType: string;
  tag?: string;
  isAcceptanceRequired: boolean;
  isSoftDeletable?: boolean;
  parentEvidenceId?: string;
}

export interface EvidenceNRORequest {
  name: string;
  projectId?: string;
  type: 'Image' | 'Video' | 'Document' | 'Archive' | string | undefined;
  scope: string;
  fileMIMEType: string;
  tag?: string;
  isAcceptanceRequired?: boolean;
  isSoftDeletable?: boolean;
  isReplaceable?: boolean;
  parentEvidenceId?: string;
}

export interface RelatedEvidences {
  evidences: RelatedEvidence[];
}

export interface RelatedEvidence {
  internalId: string;
  evidenceId: string;
  name: string;
  tag: string;
  status: string;
  createdDate: string;
  remarks?: string;
  type?: string;
}

export enum EvidenceType {
  Image = 'Image',
  Video = 'Video',
  Document = 'Document',
  Archive = 'Archive'
}

export interface ExtendedAttribute {
  attributeName: string;
  attributeType: string;
  attributeValue: string;
  isMandatory?: boolean;
  /** @deprecated use `isEditable` instead */
  isReadOnly?: boolean;
  isSoftDeleted?: boolean;
  isVisible?: boolean;
  isEditable?: boolean;
}

export interface GetEvidenceResponse extends PageInfo {
  totalRecords: number;
  results: Evidence[];
}

export interface GetLineItemEvidenceResponse extends PageInfo {
  totalRecords: number;
  results: PackageEvidenceRow[];
}

export interface PackageEvidenceRow {
  internalId: string;
  evidenceId: string;
  lineItemId: string;
  lineItemName: string;
  name: string;
  type: string;
  tag: string;
  isAcceptanceRequired: boolean;
  status: CustomerAcceptanceStatus;
  myLevelStatus?: CustomerMultiLevelActionStatus;
  remarks: string;
  location: string;
}

export interface GetMilestoneEvidencesResponse extends PageInfo {
  totalRecords: number;
  results: MilestoneEvidenceRow[];
}
export interface MilestoneEvidenceRow {
  internalId: string;
  evidenceId: string;
  name: string;
  type: string;
  fileMIMEType: string;
  dataURI?: any;
  tag: string;
  description: string;
  packageName?: string;
  packageId?: string;
  isAcceptanceRequired: boolean;
  status: CustomerAcceptanceStatus;
  myLevelStatus?: CustomerMultiLevelActionStatus;
  remarks: string;
  location?: string;
  siteName?: string;
  siteIdByCustomer?: string;
  siteNameByCustomer?: string;
  workplanName?: string;
  customerScopeId?: string;
  workplanCategory?: string;
  relatedEvidences?: RelatedEvidence[];
}

interface Taxonomy {
  type: string;
  id: string;
}

/**
 * Payload description to search line item evidences
 */
export interface LineItemEvidenceSearchRequest {
  packageTaxonomy: Taxonomy[];
  evidenceProperties: any;
}

export interface GetEvidenceHistoryResponse extends PageInfo {
  results: EvidenceHistoryEntry[];
}

export interface EvidenceHistoryEntry {
  dateTime: string;
  status: string;
  userEmail: string;
  levelId: number;
}

export interface PostCommentsResponse {
  acceptancePackageCommentsInfo: CommentsEntry[];
}

export interface GetCommentsResponse extends PageInfo {
  results: CommentsEntry[];
}

export interface CommentsEntry {
  commentId: string;
  createdDate: string;
  createdBy: string;
  comment: string;
}

export interface NetworkElementInfo {
  internalId: string;
  siteId: string;
  networkElementId: string;
  type: string;
  name: string;
  description: string;
  status: string;
  provider: string;
  latitude: number;
  longitude: number;
  region: string;
  customerId: string;
  location: Location;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
  extendedAttributes: [];
}

export interface Location {
  state: string;
  region: string;
  subRegion: string;
  country: string;
  county: string;
  city: string;
  address: string;
}

export interface WorkItemInfo {
  internalId: string;
  workItemId: string;
  type: string;
  name: string;
  region: string;
  description: string;
  typeOfWork: string;
  customerScopeId?: string;
  projectType?: string;
  projectCategory?: string;
  fasId?: string;
  status: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
  customerId: string;
  actualBSC: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  createdByUsername: string;
  lastModifiedByUsername: string;
  globalProcessStep: string;
  extendedAttributes: [];
}

export interface PackageTaxonomy {
  projectId: string;
  acceptancePackageId: string;
  networkElements: PackageNetworkElement[];
  workplans: PackageWorkItem[];
}

export interface PackageNetworkElement {
  externalId: string;
  name: string;
  networkElementId: string;
  networkElements: PackageNetworkElement[];
  status: CustomerAcceptanceStatus;
  type: string;
  workItems: PackageWorkItem[];
}

export interface PackageWorkItem {
  checklists: PackageCheckList[];
  externalId: string;
  name: string;
  status: CustomerAcceptanceStatus;
  type: string;
  workItemId: string;
  workItems: PackageWorkItem[];
}

export interface PackageCheckList {
  checkListId: string;
  externalId: string;
  name: string;
  status: CustomerAcceptanceStatus;
}

export interface NetworkElement {
  internalId: string;
  networkElementId: string;
  name: string;
  type: string;
  isOnboarded: boolean;
  networkElements?: NetworkElement[];
  workItems?: WorkItem[];
}
export interface WorkItem {
  internalId: string;
  workItemId: string;
  name: string;
  type: string;
  isOnboarded: boolean;
  workItems?: WorkItem[];
  checkLists?: CheckList[];
}
export interface CheckList {
  /** Entry unique id */
  internalId: string;
  /** Check list unique id */
  checkListId: string;
  name: string;
  isOnboarded: boolean;
}

/**
 * Interface describing the site taxonomy inside a project
 */
export interface SiteTaxonomy {
  internalId: string;
  checkLists: [] | null;
  isOnboarded: boolean;
  lineItems: [] | null;
  name: string;
  networkElementId: string;
  networkElements?: NetworkElement[];
  /**
   * UUID of the site.
   * @deprecated use `internalId` instead
   */
  siteId: string;
  siteIdByCustomer: string;
  siteNameByCustomer: string;
  siteType: string;
  status: string;
  type: string;
  workItems?: WorkItem[];
}

export interface SubmitAcceptancePackagesRequest {
  status: string,
  packageIds: string[],
  comment?: string
}

export interface Container {
  tag: string;
}

export interface EvidenceStatusUpdate {
  status: string;
  evidences: Status[];
}

export interface Status {
  id: string;
  remarks: string;
}

export interface LineItemStatusUpdate {
  status: string;
  lineItemIds: string[];
}

export interface LineItemStatusUpdateWithScope {
  status: string;
  lineItemIds: string[];
  evidencesStatusType: 'All' | 'Pending' | 'Approved' | 'Rejected';
}

export interface PackageEvidenceFilter {
  timeZone?: string;
  name?: string;
  tag?: string;
  remarks?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  statuses?: string[];
  myLevelStatuses?: string[];
}

export enum EvidenceRemark {
  OK = 'Ok',
  OBSERVATION = 'Observation',
  MAJOR = 'Major',
  MINOR = 'Minor',
  CRITICAL = 'Critical',
}

export interface StatusLineItemsUpdate {
  status: CustomerAcceptanceStatus;
  evidences: Status[];
}

export interface Report {
  acceptancePackages: ReportData[];
  lineItems: ReportData[];
  packageEvidences: ReportData[];
  lineItemEvidences: ReportData[];
  packageWorklist: PackageWorklistReport[];
}

export interface ReportData {
  weekNo: number;
  approved: number;
  rejected: number;
  newPending: number;
  reworkedPending: number;
  /**
   * @deprecated Use the replacing *Pending properties instead.
   *   The sum of all *Pending properties has the same meaning.
   *   For backward compatibility this property is kept until all back-end deployments support the new properties.
   */
  pending?: number;
  fromDate: string;
  toDate: string;
}

export interface PackageWorklistReport {
  packageId: string;
  packageName: string;
  SLA: number;
  aging: number;
  daysLeft: number;
}

export interface ChartData {
  common: string[];
  series: Series[];
}

export interface Series {
  name: string;
  values: number[];
}

export interface DashboardPackageDetailsData {
  packageName: string;
  projectName: string;
  status: string;
  sites: string[];
  approvers: Approvers[];
  packageEvidences: EvidencesDashboardData[];
  lineItemEvidences: EvidencesDashboardData[];
  lineItems: EvidencesDashboardData[];
}

interface Approvers {
  userId: string;
  userFirstName: string;
  userLastName: string;
}

export interface EvidencesDashboardData {
  status: string;
  count: number;
}

export interface DonutData {
  series: Series[];
}

export interface EvidenceDetails {
  createdBy: string;
  createdDate: string;
  evidenceId: string;
  extendedAttributes: ExtendedAttribute[];
  fileHash: string;
  fileMIMEType: string;
  fileSizeInKB?: number
  internalId: string;
  isAcceptanceRequired: boolean;
  isSoftDeleted: boolean;
  isDeletionAllowed: boolean;
  lastModifiedBy: string;
  lastModifiedDate: string;
  latitude: string;
  longitude: string;
  name: string;
  parentEvidenceId?: string;
  relatedEvidences?: EvidenceDetails[];
  remarks?: string;
  scope?: string;
  status: CustomerAcceptanceStatus;
  myLevelStatus: CustomerMultiLevelActionStatus;
  tag: string;
  type: string;
  url: string;
}

export interface ExternalProjectInfo {
  projectId: string;
  projectName: string;
}

export interface ExternalSiteInfo {
  siteId: string;
  siteName: string;
}

export interface ExternalActivity {
  activityId: string;
  activityName: string;
  ASPName: string;
  status: string;
}

export enum ToolContext {
  ledger = '',
  nro = 'NROTool',
}

export interface ThumbnailOptions {
  rootMargin: string;
  threshold: number;
}
export interface GetPackageEvidencesSizeResponse {
  evidences: PackageEvidencesSize[];
}

export interface PackageEvidencesSize {
  evidenceType: string;
  evidenceStatus: EvidenceStatusSize[];
}

interface EvidenceStatusSize {
  status: string;
  size: number;
  count: number;
}

export interface GetCountriesResponse {
  countries: string[];
}

export interface ProjectMember {
  /**
   * Name of the member.
   * E.g. user first and last name or group name.
   */
  name: string,
  /**
   * Unique identifier
   */
  internalId: string,
  userId?: string,
  groupId?: string,
  /**
   * Date in ISO format.
   */
  createdDate: string,
  /**
   * Date in ISO format.
   */
  onboardDate: string,
  userType: 'User' | 'Group'
  roleType: RoleType[],
  /**
   * Status representing the inactivation state "Active" (false) or "Inactive" (true).
   */
  status: boolean
}

export interface GetProjectUsersAndGroups extends PageInfo {
  results: ProjectMember[];
}

export interface UsageDashboardResponse {
  usagedata: UsageDetails[];
}

interface UsageDetails {
  customerId: string;
  customerName: string;
  country: string;
  packageStatus: {
    CustomerNew: number;
    CustomerRevision: number;
    CustomerNewPendingApproval: number;
    CustomerRejected: number;
    CustomerReworked: number;
    CustomerReworkedPendingApproval: number;
    CustomerApproved: number;
  };
  averageLeadTime: number;
}

export interface GetAcceptancePackageRulesResponse extends PageInfo {
  totalRecords: number;
  results: AcceptancePackageRule[];
  userRole: string;
}

export interface AcceptancePackageRule {
  rulesetId: string;
  name: string;
  description: string;
}

export interface GetWorkflowsResponse extends PageInfo {
  totalRecords: number;
  results: Workflow[];
  userRole: string;
}

export interface Workflow {
  workflowId: string;
  name: string;
  description: string;
}

export interface EmailNotificationRequest {
  notificationId: { notificationId: string, projectId: string },
  projectId: string,
  notificationName: string,
  recipients: string[],
  isActive: boolean,
  isVisible: boolean,
  createdBy: string,
  createdDate: string,
  lastModifiedBy: string,
  lastModifiedDate: string,
}

export enum EmailNotificationRecipientTypes {
  AllOpsAdmins = 'All ops admins',
  ActionUser = 'Action user',
  AllAPUsers = 'All AP users',
  AllAPContributors = 'All AP contributors',
  AllProjectAdmins = 'All project admins',
  AllCustomerApprovers = 'All customer approvers',
  PendingCustomerApprovers = 'Pending customer approvers',
  AllFuncReadAndWrite = 'All functional read and write',
  AllSystemAdmins = 'All system admins',
  AllAPUsersExObserver = 'All AP users excluding customer observers',
  AllAPUsersExObserverAndActionUser = 'All AP users excluding customer observers and action user',
  PackageCreator = 'Package creator',
  AllApproversForActionedLevel = 'All Approvers for Actioned Level',
}

export enum SLAType {
  PackageSLA = 'PackageSLA',
  LevelSLA = 'LevelSLA',
}

export interface PackageConfigurationShort {
  sla: number;
  slaType: SLAType;
  acceptanceReminder: boolean;
  daysReminder: number;
  additionalEmails: string;
  deemedAcceptance: boolean;
  reuseEvidences: boolean;
}
export interface PackageConfiguration extends PackageConfigurationShort {
  approvalRule: string;
  workflowName: string;
  ruleName: string;
  reworkType: string;
  multiLevelType: string;
}

export interface PackageConfigResponse {
  result: 'Success' | 'Failed';
}

export interface GetCertificateTemplateResponse extends PageInfo {
  results: CertificateTemplate[];
}

export interface CertificateTemplate {
  projectId: string;
  templateId: string;
  templateName: string;
  templateData: string;
  description: string;
  signatureType: string;
  templateStatus: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  ericssonSignatoryCount: number;
  customerSignatoryCount: number;
  isWorkplanContainer: boolean;
  isAddlInfoContainer: boolean;
}

export interface CertificateTemplateRequest {
  templateName: string;
  signatureType: string;
  status: string;
}

export interface Certificate {
  certificateRequestId: string;
  requestName: string;
  ericssonSignatoryCount: number;
  customerSignatoryCount: number;
  requestedBy: string;
  requestedDate: string;
  actionedByMe: ActionedByMe;
  lastModifiedDate: string;
  status: CertificateRequestStatus;
  certificateScope?: string;
  signedBy?: string;
  dateOfCertification?: string;
}

export interface GetCertificatesResponse extends PageInfo {
  totalRecords: number;
  results: Certificate[];
  userRole: string;
}

export enum CertificatesRequestQueryType {
  assignedToMe = 'AssignedToMe',
  requestedByMe = 'RequestedByMe',
  project = 'project',
}

export enum ActionedByMe {
  waiting = 'Waiting',
  yetToSign = 'Yet to sign',
  done = 'Done',
  nA = 'NA',
  rejected = 'Rejected',
}

export interface GetCertificatesRequestPayload {
  queryType: CertificatesRequestQueryType;
  requestName?: string;
  requestedBy?: string;
  /** Date string in ISO format */
  requestedDate?: string;
  /** Number of signatories */
  ericssonSignatory?: string;
  /** Number of signatories */
  customerSignatory?: string;
  actionedByMe?: ActionedByMe;
  /** Date string in ISO format */
  lastModifiedDate?: string;
  status?: CertificateRequestStatus;
}

export enum SignatoryType {
  ericsson = 'Ericsson',
  customer = 'Customer',
}

export interface SignatoryDetails {
  signatoryId?: string;
  signatoryName: string;
  signatoryType: SignatoryType;
  level?: number;
}

export interface WorkPlanDetails {
  name: string;
  siteName: string;
  siteIdByCustomer: string;
  siteNameByCustomer: string;
  siteType: string;
  others: Record<string, any>;
}

export interface AcceptancePackageForWorkPlan {
  packageId: string;
  projectId: string;
  name: string;
  packageType: string;
  status: CustomerAcceptanceStatus;
  acceptedDate: string;
  approvedBy?: string;
}

export interface CertificatePreviewRequestBody {
  certificateTemplateId: string;
  signatoryDetails: SignatoryDetails[],
  workplanDetails: WorkPlanDetails[],
  placeholders?: {
    additionalInfo1: string;
    additionalInfo2: string;
    additionalInfo3: string;
  };
}

export interface CertificatePreviewResponseBody {
  certificatePreview: string;
  title: string;
}

export interface CertificateRequestBody {
  requestName: string;
  certificateScope: string;
  certificateTemplateId: string;
  workplans: WorkPlanDetails[],
  signatories: SignatoryDetails[],
  placeholders: {
    additionalInfo1?: string;
    additionalInfo2?: string;
    additionalInfo3?: string;
  },
  certificateRequestDocumentIds: string[];
}

export interface CertificateRequestResponse {
  certificateRequestId: string;
}

export interface CertificateActionBody {
  certificateRequestId: string;
  actionType: string;
  signatureImage?: string;
  designation?: string;
  comment?: string;
}

export interface CertificateActionResponse {
  actionResult: string;
}

export interface CertificateRequestDetailsSignatory {
  userId: string;
  email: string;
  username: string;
  level: number;
  status: string | CertificateSignatoryStatus;
}

export interface CertificateRequestDetails {
  certificateRequestId: string;
  requestName: string;
  workplans: WorkPlanDetails[];
  ericssonSignatories: CertificateRequestDetailsSignatory[];
  customerSignatories: CertificateRequestDetailsSignatory[];
  comments: CommentsEntry[];
  isCurrUsrReady: boolean;
  isCurrUsrSignatory: boolean;
  status: CertificateRequestStatus;
}

export enum CertificateRequestStatus {
  // server side managed values
  ready = 'Ready',
  inProgress = 'InProgress',
  complete = 'Complete',
  rejected = 'Rejected',
  // client side managed value
  certified = 'Certified'
}

export enum CertificateSignatoryStatus {
  ready = 'Ready',
  notReady = 'NotReady',
  complete = 'Complete',
  rejected = 'Rejected',
  notApplicable = 'NotApplicable'
}

export interface CertificateRequestDocument {
  certificateRequestDocumentId: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  tag: string
}

export enum CertificateReferenceMergeDocumentType {
  CERTIFICATE = 'CERTIFICATE',
  DOCUMENT = 'DOCUMENT'
};

export interface CertificateReferenceMergeDocument {
  sequenceNumber: number;
  type: CertificateReferenceMergeDocumentType;
  documentId?: string;
};

export interface PackageStatus {
  currentStatus: string;
  suggestedStatus: string;
}

export interface CountriesWithCustomer {
  countryCode: string;
  countryName: string;
  customers: string[];
}

export enum ProjectReportType {
  AP = 'AP',
  SNAG = 'Snag',
  CERTIFICATE = 'Certificate',
}

export enum ProjectReportStatus {
  NOT_STARTED = 'NotStarted',
  IN_PROGRESS = 'InProgress',
  READY = 'ReadyToDownload',
  COMPLETE = 'Completed',
  FAILED = 'Failed',
}

export interface GetReportStatusResponse {
  projectId: string;
  reportType: string;
  availabilityStatus: string;
}

export enum PackageValidateStatus {
  SUCCESS = 'Success',
  FAILURE = 'Failure'
}

export interface PackageValidateResponse {
  status: PackageValidateStatus;
  message: string;
}

export interface RecentHistoryResponse {
  elementId: string,
  elementName: string,
  createdDate: string,
  projectId: string
}

export enum UserRoleMessage {
  // User available in ECA & isSoftDeleted is TRUE -> This user is deactivated on ECA.
  USER_INACTIVE = 'This user is deactivated. Please raise the support ticket to activate the user on ECA.',

  // generic 403 error where AD is OK, but ECA user not available (or) session is inactive
  // suggestion to get the role
  USER_NO_ROLE_SUGGESTION_1 = 'If you do not have access to ECA, Please wait for assignment of the role and alternately raise the support ticket',
  USER_NO_ROLE_SUGGESTION_2 = ' if not done already.',

  // suggestion to get the session back
  USER_SESSION_TIME_OUT_1 = 'If you already have access to ECA, then session is timed out or inactive. Please ',
  USER_SESSION_TIME_OUT_2 = ' to reload the session.'
}

export interface ChecklistLineItemsShort {
  internalId: string;
  lineItemId: string;
  packageId: string;
  name: string;
  description: string;
  status: string;
  packageName: string;
  packageStatus: string;
  raSessionId: string;
  evidenceDownloadStatus: string;
  evidenceCount: number;
  lastModifiedDate: string;
  [key: string]: any;
}

export interface ChecklistLineItemsShortResponse extends PageInfo {
  totalRecords: number;
  currentRecordCount: number;
  results: ChecklistLineItemsShort[];
}

export enum ProjectRoleNames {
  EricssonContributor = 'Ericsson Contributor',
  CustomerApprover = 'Customer Approver',
  CustomerObserver = 'Customer Observer',
  ProjectAdmin = 'Project Admin',
}

export interface UserModel {
  name: string;
  id: string;
}

export enum NetworkElementType {
  Site = 'NetworkSite',
  Cluster = 'Cluster',
  TXLink = 'TXLink',
  Node = 'Node',
  CellSector = 'Cell Sector',
};

export interface WorkplanSiteData {
  workplanId: string;
  workplanName: string;
  workplanType: string;
  siteId: string;
  siteName: string;
  siteType: string;
  siteIdByCustomer: string;
  siteNameByCustomer: string;
  milestoneNames: string;
  customerScopeId: string;
  category: string;
  fasId: string;
  networkElementName: string;
  networkElementType: NetworkElementType;
  apApprovedCount: number;
  apRejectedCount: number;
  apPendingCount: number;
}

export interface WorkplanSiteResponse extends PageInfo {
  totalRecords: number;
  results: WorkplanSiteData[];
}

export interface MilestoneData {
  internalId: string;
  externalId: string;
  name: string;
  description: string;
  networkSiteName: string;
  siteId: string;
  siteIdByCustomer: string;
  siteNameByCustomer: string;
  siteType: string;
  workPlanName: string;
  customerScopeId: string;
  dateOfReadiness: string;
  status: string;
  networkElementType: NetworkElementType;
  networkElementName: string;
}

export interface MilestoneResponse extends PageInfo {
  totalRecords: number;
  results: MilestoneData[];
}

export interface GetPackageHistoryResponse extends PageInfo {
  results: PackageHistoryEntry[];
}

export interface PackageHistoryEntry {
  dateTime: string;
  status: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  levelId: number;
  levelStatus: string;
}

export enum PackageDocumentDownloadStatus {
  NOT_STARTED = 'NotStarted',
  IN_PROGRESS = 'InProgress',
  READY = 'ReadyToDownload',
  COMPLETE = 'Completed',
  FAILED = 'Failed',
}

export interface GetPackageDocumentDownloadStatusResponse {
  status: PackageDocumentDownloadStatus;
}

export interface GetAllEvidencesResponse extends PageInfo {
  results: EvidenceEntry[];
}

export interface EvidenceEntry {
  internalId: string;
  evidenceId: string;
  name: string;
  size: string;
  type: EvidenceType;
  status: CustomerAcceptanceStatus;
  fileMIMEType: string;
  selected: boolean;
}

export interface ProjectSiteLineItemEvidence extends Pick<EvidenceEntry, 'internalId' | 'evidenceId' | 'name' | 'fileMIMEType' | 'type' | 'status'> {
  lineItemName: string;
  customerScopeId: string;
  milestone: string;
  packageId: string;
  packageName: string;
  packageScope: string;
  myRole: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  tag: string;
}

export interface ProjectSiteMilestoneEvidence extends Pick<EvidenceEntry, 'internalId' | 'evidenceId' | 'name' | 'fileMIMEType' | 'type' | 'status'> {
  customerScopeId: string;
  milestone: string;
  packageId: string;
  packageName: string;
  packageScope: string;
  myRole: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  tag: string;
}

export interface GetDashboardPackagesCountResponse {
  approved: number;
  rejected: number;
  pending: number;
}

export interface GetDashboardEvidencesCountResponse {
  approved: number;
  rejected: number;
  pending: number;
}

export interface GetDashboardCertificatesCountResponse {
  certified: number;
  rejected: number;
  pending: number;
}

export interface GetDashboardAcceptanceTrendResponse {
  acceptancePackages: DashboardAcceptanceTrendEntry[];
}

export interface DashboardAcceptanceTrendEntry {
  approved: number;
  rejected: number;
  pending: number;
  submitted: number;
  fromDate: string;
  toDate: string;
}

export interface GetDashboardCertificationTrendResponse {
  certificates: DashboardCertificationTrendEntry[];
}

export interface DashboardCertificationTrendEntry {
  certified: number;
  rejected: number;
  pending: number;
  submitted: number;
  fromDate: string;
  toDate: string;
}
export interface EvidenceDataWithSasUrl {
  internalId: string;
  evidenceId: string;
  name: string;
  fileSizeInKB: number;
  location: string;
  mimeType: string;
  sasUrl: string;
}
