
/**
 * Interface definition for audit report.
 */

export interface AuditReportResponse {
    currentRecordCount: number;
    totalPages: number;
    currentPage: number;
    totalRecords: number
    nextOffset: number;
    morePages: boolean;
    results: AuditItem[];
  }
  
  export interface AuditItem {
    auditId: string;
    elementType: AuditElementType;
    oldValue: string;
    newValue?: string;
    createdBy: string;
    createdDate: string;
  }

  export enum AuditElementType {
      LineItem,
      Checklist,
      WorkItem,
      Configuration,
      User,
      Customer,
      Workflow,
      AcceptancePackageRules,
      AcceptancePackage,
  }

  
export interface FilterSortAttr {
    key: string;
    value: string;
  }