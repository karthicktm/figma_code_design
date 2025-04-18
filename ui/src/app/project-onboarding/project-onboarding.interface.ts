export interface GetProjectAdminAssignmentResponse {
  morePages: boolean,
  nextOffset: number,
  currentRecordCount: number,
  totalRecords: number,
  totalPages: number,
  currentPage: number,
  results: ProjectAdminAssignment[];
}

export interface ProjectAdminAssignment {
  userEmail: string;
  role: string;
  projectId: string;
  dateAssigned: string;
}

export enum ProjectStatus {
    Draft='Draft',
    New='New',
    AcceptancePackagesReceived = 'Received',
    AcceptanceInProgress = 'Pending',
    Complete = 'Completed'
}
