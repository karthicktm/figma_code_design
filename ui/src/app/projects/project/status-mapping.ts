export const packageStatusViewModelToDataModel = new Map([
  // Mapping of status filter
  ['New', 'CustomerNew,CustomerRevision'],
  ['Pending approval', 'CustomerNewPendingApproval'],
  ['Approved', 'CustomerApproved'],
  ['Reworked', 'CustomerReworked'],
  ['Reworked-Pending Approval', 'CustomerReworkedPendingApproval'],
  ['Rejected', 'CustomerRejected,CustomerRejectedNoAction'],
  ['Abandoned', 'Abandoned'],
  ['Deemed approved', 'DeemedApproved'],
  ['Transfer initiated', 'AcceptanceDocumentInitiate'],
  ['Transfer ready', 'AcceptanceDocumentReady'],
  ['Transfer successful', 'AcceptanceDocumentSent'],
  ['Transfer failed', 'AcceptanceDocumentSendFailed'],
  ['Draft', 'Draft'],
  // Mapping of tab status
  ['Init', 'Draft,CustomerNew,CustomerRevision'],
  ['InProgress', 'CustomerNewPendingApproval,CustomerRejected,CustomerReworked,CustomerReworkedPendingApproval'],
  ['Completed', 'CustomerApproved,Abandoned,DeemedApproved,AcceptanceDocumentInitiate,AcceptanceDocumentReady,AcceptanceDocumentSent,AcceptanceDocumentSendFailed'],
]);

export const packageStatusDataModelToViewModel = new Map([
  ['Pending approval', 'Customer New-Pending approval'],
  ['Approved', 'Customer Approved,Deemed Approved'],
  ['Reworked', 'Customer Reworked'],
  ['Reworked-Pending Approval', 'Customer Reworked-Pending approval'],
  ['Rejected', 'Customer Rejected,Customer Rejected-No Action'],
  ['Abandoned', 'Abandoned'],
  ['Deemed approved', 'Deemed Approved'],
  ['Transfer initiated', 'Acceptance Document Initiate'],
  ['Transfer ready', 'Acceptance Document Ready'],
  ['Transfer successful', 'Acceptance Document Sent'],
  ['Transfer failed', 'Acceptance Document Send Failed'],
  ['Draft', 'Draft']
]);

export const certificateStatusDataModelToViewModel = new Map([
  ['Certified', 'Certified'],
  ['Pending', 'InProgress'],
  ['Rejected', 'Rejected']
]);

export const evidenceStatusViewModelToDataModel = new Map([
  // Mapping of status filter
  ['New', 'CustomerNew,CustomerRevision'],
  ['Pending approval', 'CustomerNewPendingApproval'],
  ['Approved', 'CustomerApproved'],
  ['Reworked', 'CustomerReworked'],
  ['Reworked-Pending Approval', 'CustomerReworkedPendingApproval'],
  ['Rejected', 'CustomerRejected,CustomerRejectedNoAction'],
  ['Abandoned', 'Abandoned'],
  ['ViewOnly', 'CustomerAcceptanceNotRequired'],
  ['Deemed Approved', 'DeemedApproved'],
]);

export const projectStructureLineItemStatusViewModelToDataModel = new Map([
  // Mapping of status filter
  ['Draft', 'Draft'],
  ['Ready', 'Ready'],
  ['New', 'CustomerNew,CustomerRevision'],
  ['Pending approval', 'CustomerNewPendingApproval'],
  ['Approved', 'CustomerApproved'],
  ['Reworked', 'CustomerReworked'],
  ['Reworked-Pending Approval', 'CustomerReworkedPendingApproval'],
  ['Rejected', 'CustomerRejected,CustomerRejectedNoAction'],
  ['Abandoned', 'Abandoned'],
  ['ViewOnly','CustomerAcceptanceNotRequired'],
  ['Deemed Approved', 'DeemedApproved'],
]);

export const evidenceCountOptions = {
  approvedEvidenceCount: {'No Approved': 'NO_APPROVED', 'Any Approved': 'ANY_APPROVED'},
  rejectedEvidenceCount: {'No Rejected': 'NO_REJECTED', 'Any Rejected': 'ANY_REJECTED'},
  pendingEvidenceCount: {'No Pending': 'NO_PENDING', 'Any Pending': 'ANY_PENDING'},
  viewOnlyEvidenceCount: {'No View Only': 'NO_VIEW_ONLY', 'Any View Only': 'ANY_VIEW_ONLY'},
}

export const myLevelStatusViewModelToDataModel = new Map([
  ['Pending approval', 'CustomerNewPendingApproval'],
  ['Approved', 'CustomerApproved'],
  ['Reworked-Pending Approval', 'CustomerReworkedPendingApproval'],
  ['Rejected', 'CustomerRejected,CustomerRejectedNoAction'],
  ['ViewOnly', 'CustomerAcceptanceNotRequired'],
  ['Deemed Approved', 'DeemedApproved'],
  ['No Action Required', 'CustomerNoActionRequired'],
  ['Awaiting', 'CustomerAwaiting'],
  ['Not Applicable', 'NotApplicable'],
]);
