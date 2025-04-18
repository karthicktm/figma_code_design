/**
 * Interface definition for user management.
 */
export interface UserSession {
  firstName: string,
  lastName: string,
  emailId: string;
  signum: string;
  userType: 'ERICSSON' | string;
  roleType: string[];
  accessToken: string;
  expiresAt: number;
  refreshToken: string,
}

export interface AddUserStatus {
  userId: string,
  status: 'Success' | 'Error',
  description: string,
}

export interface NewAddedUser {
  users: NewUser[];
}

export interface NewUser {
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userType: string;
  roleType: string[];
  extendedAttributes: ExtendedAttribute[];
  isSoftDeleted?: boolean;
  customerId?: string;
}

export interface ExtendedAttribute {
  attributeName: string;
  attributeType: string;
  attributeValue: string;
}
export interface OPSuserResponse {
  morePages: boolean,
  nextOffset: number,
  currentRecordCount: number,
  totalRecords: number,
  totalPages: number,
  currentPage: number,
  results: OPSUser[];
}
export interface OPSUser {
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userType: string;
  roleType: string[];
  lastModifiedDate: string;
  lastModifiedBy: string
  isSoftDeleted: boolean;
  extendedAttributes?: ExtendedAttribute[];
  customerId: string;
}
export interface UserInput {
  firstName: string;
  lastName: string;
  userId: string;
  signum: string;
  emailId: string;
}
export enum OPSUserType {
  ericssonUserType = 'ericsson',
  customerUserType = 'customer',
  functionalUserType = 'functional'
}
