
/**
 * Interface definition for workflows.
 */

export interface WorkflowsListResponse {
  currentRecordCount: number;
  totalPages: number;
  currentPage: number;
  totalRecords: number
  nextOffset: number;
  morePages: boolean;
  results: WorkflowInfo[];
}

export interface WorkflowInfo {
  workflowId: string;
  name: string;
  description: string;
  isSoftDeleted: boolean;
  details: WorkFlowDetailsInfo[];
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface WorkFlowDetailsInfo {
  id: string;
  roleId: string;
  roleName: string;
  stateFrom: string; //AcceptancePackageStatusType
  stateTo: string; //AcceptancePackageStatusType
  itemType: string; //WorkFlowItemType
}

export interface FilterSortAttr {
  key: string;
  value: string;
}

export interface AcceptanceRuleListResponse {
  currentRecordCount: number;
  totalPages: number;
  currentPage: number;
  totalRecords: number
  nextOffset: number;
  morePages: boolean;
  results: RuleSetInfo[];
}

export interface RuleSetInfo {
  rulesetId: string;
  name: string;
  description: string;
  ruleSet: RuleItemRequest[];
  isSoftDeleted: boolean;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string
}

export interface RuleItemRequest {
  id: string;
  packageStatus: string;
  definition: ItemTypeDetailsRequest[];
}

export interface ItemTypeDetailsRequest {
  itemType: string;
  itemCapacity: string;
  itemStatus: string[];
}