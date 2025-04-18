export enum RoleType {
  EricssonBusinessExecutive = 'Ericsson Business Executive',
  EricssonServiceProvider = 'Ericsson Service Provider',
  EricssonApprover = 'Ericsson Approver',
  EricssonContributor = 'Ericsson Contributor',
  ProjectAdmin = 'Project Admin',
  CustomerApprover = 'Customer Approver',
  CustomerObserver = 'Customer Observer',
}

export enum GroupManagementRoleType {
  EricssonContributor = 'Ericsson Contributor',
  CustomerApprover = 'Customer Approver',
  CustomerObserver = 'Customer Observer'
}

export interface GroupList {
  morePages: boolean;
  nextOffset: number;
  currentRecordCount: number;
  totalRecords: number;
  totalPages: number;
  currentPage: number
  results: Group[];
}

export interface Group {
  groupId: string;
  groupName: string;
  projectAdmins: string[];
  // TODO: referenced in user onboarding component, shall be removed when that component is updated
  customerId?: string;
  roleType: string;
  isSoftDeleted: boolean;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface Users {
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userType: string;
  roleType: string[];
}

export interface AddGroupPayload {
  groupName: string;
  customerId?: string;
  roleType: string;
  isSoftDeleted?: boolean;
}

export interface UpdateGroupPayload {
  isSoftDeleted: boolean;
  groupUsers: GroupUser[];
}

export interface GroupUsers {
  groupName: string;
  roleType: string;
  isSoftDeleted: boolean;
  lastModifiedBy: string;
  lastModifiedDate: string;
  projectAdmin: string[];
  groupUsers: GroupUser[];
  customerId: string;
  createdBy: string;
  createdDate: string;
}

export interface GroupAssociatedPackage {
  packageId: string;
  projectName: string;
  customerName: string;
  packageName: string;
  packageScope: string;
  multiLevel: boolean;
  submittedBy?: string;
  submittedByEmail?: string;
  status: string;
  submittedDate?: string;
}

export interface GroupUser {
  userEmail?: string;
  isSoftDeleted: boolean;
  userId: string;
  userName?: string;
  userRole: string;
}

export interface FilterSortAttr {
  key: string;
  value: string;
}

export interface Customer {
  option: string;
  optionValue: string;
}

export interface AddUserPayload {
  users: string[];
}

export interface UpdateGroupUserPayload {
  users: UserToBeUpdated[];
}

export interface UserToBeUpdated {
  user: string;
  isSoftDeleted: boolean;
}
